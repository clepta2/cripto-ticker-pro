/**
 * worker.js — Cloudflare Worker Anycast para Cripto Ticker Pro API
 *
 * @license MIT
 * @see https://github.com/clepta2/cripto-ticker-pro
 */

import {
  listarCriptos,
  consultarCripto,
  obterGasTracker,
  converterParidade,
  obterSentimentoEDominancia,
  renderCriptoCardSvg,
  CRIPTO_DATABASE
} from './cripto-engine.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Ponte-Version': '3.0.0'
};

const PLANOS_CONFIG = {
  free: { nome: 'Free / Sandbox', rpm: 30, cotaDiaria: 500, prefixo: 'crp_free_' },
  starter: { nome: 'Starter 86.400 (1 req/s)', rpm: 60, cotaDiaria: 86400, prefixo: 'crp_start_' },
  pro: { nome: 'Pro (5 req/s)', rpm: 300, cotaDiaria: 250000, prefixo: 'crp_pro_' },
  business: { nome: 'Business (20 req/s)', rpm: 1200, cotaDiaria: 1000000, prefixo: 'crp_biz_' },
  master: { nome: 'Master Admin (Bypass)', rpm: 3000, cotaDiaria: Infinity, prefixo: 'crp_master_' }
};

const minuteBuckets = new Map();
const dailyBuckets = new Map();
const WINDOW_MINUTE_MS = 60 * 1000;
const WINDOW_DAILY_MS = 86400 * 1000;
const BOOT_TIME = Date.now();

function resolverPlanoEChave(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const xApiKey = request.headers.get('x-api-key') || '';
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key') || url.searchParams.get('api_key') || '';

  let token = '';
  if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();
  else if (xApiKey) token = xApiKey.trim();
  else if (queryKey) token = queryKey.trim();

  if (!token) {
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'anonymous_ip';
    return { plano: 'free', keyId: `ip_${clientIp}`, config: PLANOS_CONFIG.free, isAnonymous: true };
  }

  if (token.startsWith('crp_master_') || token.startsWith('pnt_master_')) {
    return { plano: 'master', keyId: token, config: PLANOS_CONFIG.master, isAnonymous: false };
  }
  if (token.startsWith('crp_biz_') || token.startsWith('pnt_biz_')) {
    return { plano: 'business', keyId: token, config: PLANOS_CONFIG.business, isAnonymous: false };
  }
  if (token.startsWith('crp_pro_') || token.startsWith('pnt_pro_')) {
    return { plano: 'pro', keyId: token, config: PLANOS_CONFIG.pro, isAnonymous: false };
  }
  if (token.startsWith('crp_start_') || token.startsWith('pnt_start_')) {
    return { plano: 'starter', keyId: token, config: PLANOS_CONFIG.starter, isAnonymous: false };
  }
  return { plano: 'free', keyId: token, config: PLANOS_CONFIG.free, isAnonymous: false };
}

function aplicarRateLimit(keyId, config) {
  const now = Date.now();

  let dailyBucket = dailyBuckets.get(keyId);
  if (!dailyBucket || now > dailyBucket.resetAt) {
    dailyBucket = { count: 0, resetAt: now + WINDOW_DAILY_MS };
    dailyBuckets.set(keyId, dailyBucket);
  }

  let minBucket = minuteBuckets.get(keyId);
  if (!minBucket || now > minBucket.resetAt) {
    minBucket = { count: 0, resetAt: now + WINDOW_MINUTE_MS };
    minuteBuckets.set(keyId, minBucket);
  }

  const isMaster = config.cotaDiaria === Infinity;
  const resetMinSeconds = Math.max(1, Math.ceil((minBucket.resetAt - now) / 1000));
  const resetDailySeconds = Math.max(1, Math.ceil((dailyBucket.resetAt - now) / 1000));

  if (!isMaster && dailyBucket.count >= config.cotaDiaria) {
    return {
      ok: false,
      error: 'DAILY_LIMIT_EXCEEDED',
      message: `Cota diária de requisições excedida para o plano ${config.nome}.`,
      resetEmSegundos: resetDailySeconds
    };
  }

  if (!isMaster && minBucket.count >= config.rpm) {
    return {
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Limite de taxa por minuto excedido (${config.rpm} RPM).`,
      resetEmSegundos: resetMinSeconds
    };
  }

  dailyBucket.count++;
  minBucket.count++;

  return {
    ok: true,
    rpmRestante: Math.max(0, config.rpm - minBucket.count),
    cotaRestante: isMaster ? 'Ilimitada' : Math.max(0, config.cotaDiaria - dailyBucket.count),
    resetMinEmSegundos: resetMinSeconds
  };
}

export default {
  async fetch(request) {
    const t0 = performance.now();
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { plano, keyId, config, isAnonymous } = resolverPlanoEChave(request);
    const rateCheck = aplicarRateLimit(keyId, config);

    if (!rateCheck.ok) {
      return new Response(JSON.stringify(rateCheck, null, 2), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.resetEmSegundos || 60),
          ...CORS_HEADERS
        }
      });
    }

    const rateHeaders = {
      'x-cripto-plan': plano,
      'x-cripto-ratelimit-limit': String(config.rpm),
      'x-cripto-ratelimit-remaining': String(rateCheck.rpmRestante),
      'x-cripto-edge-latency': `${Math.max(1, Math.round(performance.now() - t0))}ms`
    };

    // 1. HEALTHCHECK
    if (path === '/' || path === '/health' || path === '/status' || path === '/api/cripto/health') {
      return new Response(JSON.stringify({
        ok: true,
        servico: 'Cripto Ticker Pro API — Anycast Crypto Price & Gas Engine',
        versao: '1.0.0',
        borda: 'Cloudflare Workers Anycast (<2ms)',
        uptimeSegundos: Math.floor((Date.now() - BOOT_TIME) / 1000),
        planoAtivo: config.nome,
        totalAtivosMonitorados: Object.keys(CRIPTO_DATABASE).length,
        recursos: [
          'Cotações de Criptoativos em Tempo Real (USD e BRL)',
          'Gas & Network Fee Tracker (Ethereum, Bitcoin e Solana)',
          'Conversor de Paridades Cruzadas Cripto ⇄ Fiat e Cripto ⇄ Cripto',
          'Sentimento de Mercado & Fear and Greed Index',
          'Renderizador Vetorial SVG de Sparkline 7 Dias'
        ]
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 2. LISTA DE ATIVOS (/api/cripto/ativos)
    if (path === '/api/cripto/ativos' || path === '/api/cripto/todos') {
      const cat = url.searchParams.get('categoria');
      const lista = listarCriptos(cat);
      return new Response(JSON.stringify({
        ok: true,
        totalAtivos: lista.length,
        ativos: lista
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 3. GAS & NETWORK FEE TRACKER (/api/cripto/gas)
    if (path === '/api/cripto/gas' || path === '/api/cripto/taxas') {
      const gas = obterGasTracker();
      return new Response(JSON.stringify(gas, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 4. SENTIMENTO & FEAR AND GREED INDEX (/api/cripto/sentimento)
    if (path === '/api/cripto/sentimento' || path === '/api/cripto/fear-greed') {
      const sent = obterSentimentoEDominancia();
      return new Response(JSON.stringify(sent, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 5. CONVERSOR DE PARIDADES (/api/cripto/converter)
    if (path === '/api/cripto/converter') {
      const qtd = url.searchParams.get('qtd') || url.searchParams.get('quantidade') || '1';
      const de = url.searchParams.get('de') || 'btc';
      const para = url.searchParams.get('para') || 'brl';

      const conversao = converterParidade(qtd, de, para);
      return new Response(JSON.stringify(conversao, null, 2), {
        status: conversao.ok ? 200 : 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // 6. CARD VETORIAL SVG COM SPARKLINE (/api/cripto/card/:simbolo.svg)
    const matchSvg = path.match(/^\/api\/cripto\/card\/([a-zA-Z0-9\-]+)\.svg$/i) || path.match(/^\/api\/cripto\/([a-zA-Z0-9\-]+)\.svg$/i);
    if (matchSvg) {
      const sym = matchSvg[1];
      const svg = renderCriptoCardSvg(sym);
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
          ...CORS_HEADERS,
          ...rateHeaders
        }
      });
    }

    // 7. COTAÇÃO INDIVIDUAL (/api/cripto/cotacao/:simbolo ou /api/cripto/:simbolo)
    const matchSym = path.match(/^\/api\/cripto\/cotacao\/([a-zA-Z0-9\-]+)$/i) || path.match(/^\/api\/cripto\/([a-zA-Z0-9\-]+)$/i);
    if (matchSym) {
      const sym = matchSym[1];
      const cotacao = consultarCripto(sym);
      return new Response(JSON.stringify(cotacao, null, 2), {
        status: cotacao.ok ? 200 : 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
      });
    }

    // Default: Lista de principais
    return new Response(JSON.stringify({
      ok: true,
      ativosPrincipais: listarCriptos().slice(0, 5)
    }, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...rateHeaders }
    });
  }
};
