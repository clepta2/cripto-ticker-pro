import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from './worker.js';
import { CriptoTickerPro } from './cripto-ticker-pro.js';
import { resetarCaches } from './cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧪 Iniciando Bateria de Testes do Cripto Ticker Pro API (100% Offline)...\n');

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) {
    pass++;
    console.log(`  ✅ ${message}`);
  } else {
    fail++;
    console.error(`  ❌ FALHA: ${message}`);
    throw new Error(message);
  }
}

// ─── MOCK DA REDE PARA TESTES OFFLINE ───
const MOCK_COINGECKO_MARKETS = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    current_price: 64000,
    market_cap: 1280000000000,
    market_cap_rank: 1,
    total_volume: 35000000000,
    price_change_percentage_24h: 2.5,
    price_change_percentage_7d_in_currency: -5.0,
    ath: 126000,
    circulating_supply: 19780000,
    last_updated: '2026-11-17T18:00:00.000Z',
    sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 60000 + i * 20) }
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 3200,
    market_cap: 384000000000,
    market_cap_rank: 2,
    total_volume: 20000000000,
    price_change_percentage_24h: -1.2,
    price_change_percentage_7d_in_currency: 3.1,
    ath: 4890,
    circulating_supply: 120000000,
    last_updated: '2026-11-17T18:00:00.000Z',
    sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 3100 + i * 2) }
  }
];

const MOCK_PTAX_USD = {
  value: [
    {
      cotacaoCompra: 5.75,
      cotacaoVenda: 5.80,
      dataHoraCotacao: '2026-11-17 13:07:26.015',
      tipoBoletim: 'Fechamento'
    }
  ]
};

const MOCK_FNG = {
  name: 'Fear and Greed Index',
  data: [
    {
      value: '25',
      value_classification: 'Extreme Fear',
      timestamp: '1794930000',
      time_until_update: '12000'
    }
  ]
};

const MOCK_MEMPOOL = {
  fastestFee: 15,
  halfHourFee: 10,
  hourFee: 5,
  minimumFee: 1
};

const MOCK_ETH_RPC = {
  jsonrpc: '2.0',
  id: 1,
  result: '0xe5135ad' // 240203181 wei => ~0.24 Gwei
};

let chamadasFetch = 0;
const mockFetch = async (url, options = {}) => {
  chamadasFetch++;
  const u = String(url);

  if (u.includes('coingecko.com') && u.includes('/coins/markets')) {
    return new Response(JSON.stringify(MOCK_COINGECKO_MARKETS), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (u.includes('coingecko.com') && u.includes('/global')) {
    return new Response(JSON.stringify({
      data: {
        active_cryptocurrencies: 20000,
        market_cap_percentage: { btc: 58.5, eth: 10.2 },
        updated_at: 1794930000
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (u.includes('olinda.bcb.gov.br')) {
    return new Response(JSON.stringify(MOCK_PTAX_USD), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (u.includes('alternative.me/fng')) {
    return new Response(JSON.stringify(MOCK_FNG), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (u.includes('mempool.space')) {
    return new Response(JSON.stringify(MOCK_MEMPOOL), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (u.includes('ethereum-rpc.publicnode.com')) {
    return new Response(JSON.stringify(MOCK_ETH_RPC), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
};

const ENV_TESTE = {
  COINGECKO_API_KEY: 'mock_key_test'
};

// ─── 1. AUTENTICAÇÃO E PLANOS ───
console.log('--- 1. Autenticação e Matriz de Planos ---');
resetarCaches();

const resHealth = await worker.fetch(new Request('https://api.test/api/cripto/health'), ENV_TESTE, {}, mockFetch);
assert(resHealth.status === 200, 'Healthcheck responde HTTP 200');
const dataHealth = await resHealth.json();
assert(dataHealth.ok === true, 'Healthcheck ok === true');
assert(!JSON.stringify(dataHealth).includes('Solana'), 'Healthcheck não inventa suporte a Solana Gas');

const resFontes = await worker.fetch(new Request('https://api.test/api/cripto/fontes'), ENV_TESTE, {}, mockFetch);
assert(resFontes.status === 200, 'Rota /api/cripto/fontes responde 200');
const dataFontes = await resFontes.json();
assert(dataFontes.fontes.coingecko && dataFontes.fontes.bcb && dataFontes.fontes.alternativeMe, 'Lista fontes oficiais');

// ─── 2. FALTA DE CHAVE COINGECKO DEVE DAR 503 (NUNCA CHUTAR DADO) ───
console.log('\n--- 2. Tratamento de Chave Não Configurada (Sem Fallback Inventado) ---');
resetarCaches();
const resSemChave = await worker.fetch(new Request('https://api.test/api/cripto/cotacao/btc'), {}, {});
assert(resSemChave.status === 503, 'Sem chave CoinGecko configurada responde HTTP 503');
const dataSemChave = await resSemChave.json();
assert(dataSemChave.erro === 'CHAVE_NAO_CONFIGURADA', 'Erro explícito CHAVE_NAO_CONFIGURADA');

// ─── 3. COTAÇÕES COM FONTE REAL E CONVERSÃO PTAX ───
console.log('\n--- 3. Cotações Reais (CoinGecko + PTAX BCB) ---');
resetarCaches();
chamadasFetch = 0;

const resCotacao = await worker.fetch(new Request('https://api.test/api/cripto/cotacao/btc'), ENV_TESTE, {}, mockFetch);
assert(resCotacao.status === 200, 'Consulta cotação BTC responde 200');
const dataCotacao = await resCotacao.json();
assert(dataCotacao.ativo.precoUsd === 64000, 'Preço USD bate com fonte mockada');
assert(dataCotacao.ativo.precoBrl === Math.round(64000 * 5.80 * 100) / 100, 'Preço BRL usa taxa PTAX (5.80)');
assert(dataCotacao.cambioPtaxUsd === 5.80, 'Informa taxa PTAX oficial utilizada');

// Testa cache: segunda chamada idêntica não deve chamar o fetch novamente
const chamadasAntes = chamadasFetch;
await worker.fetch(new Request('https://api.test/api/cripto/cotacao/btc'), ENV_TESTE, {}, mockFetch);
assert(chamadasFetch === chamadasAntes, 'Segunda requisição é atendida pelo cache em memória');

// ─── 4. FEAR & GREED (ALTERNATIVE.ME COM ATRIBUIÇÃO) ───
console.log('\n--- 4. Sentimento & Fear and Greed Index ---');
const resFng = await worker.fetch(new Request('https://api.test/api/cripto/sentimento'), ENV_TESTE, {}, mockFetch);
assert(resFng.status === 200, 'Rota sentimento responde 200');
const dataFng = await resFng.json();
assert(dataFng.fearAndGreedIndex.valor === 25, 'Valor Fear and Greed correto');
assert(dataFng.fearAndGreedIndex.classificacao === 'Medo Extremo', 'Classificação traduzida');
assert(dataFng.fearAndGreedIndex.atribuicao.includes('alternative.me'), 'Atribuição obrigatória presente');

// ─── 5. GAS TRACKER (ETHEREUM + BITCOIN) ───
console.log('\n--- 5. Gas Tracker (Ethereum RPC + Bitcoin Mempool) ---');
const resGas = await worker.fetch(new Request('https://api.test/api/cripto/gas'), ENV_TESTE, {}, mockFetch);
assert(resGas.status === 200, 'Rota gas responde 200');
const dataGas = await resGas.json();
assert(dataGas.bitcoin.altaPrioridade.satVb === 15, 'Taxa Bitcoin rápida 15 sat/vB');
assert(dataGas.ethereum.gasPriceGwei > 0, 'Gas Ethereum Gwei extraído de eth_gasPrice');
assert(!dataGas.solana, 'Solana sem fonte verificada foi removida');

// ─── 6. CONVERSOR DE PARIDADES REAL ───
console.log('\n--- 6. Conversor de Paridades Real ---');
const resConv = await worker.fetch(new Request('https://api.test/api/cripto/converter?qtd=2&de=btc&para=usd'), ENV_TESTE, {}, mockFetch);
assert(resConv.status === 200, 'Conversão 2 BTC -> USD responde 200');
const dataConv = await resConv.json();
assert(dataConv.resultadoTotal === 128000, '2 BTC * 64.000 = 128.000 USD');

// ─── 7. CARD SVG COM SPARKLINE E ESCAPE XML ───
console.log('\n--- 7. Card SVG com Sparkline e Escape XML ---');
const resSvg = await worker.fetch(new Request('https://api.test/api/cripto/card/btc.svg'), ENV_TESTE, {}, mockFetch);
assert(resSvg.status === 200, 'Card SVG responde 200');
assert(resSvg.headers.get('Content-Type').includes('image/svg+xml'), 'Header Content-Type é SVG');
const svgTexto = await resSvg.text();
assert(svgTexto.includes('<svg') && svgTexto.includes('</svg>'), 'SVG bem formatado');
assert(svgTexto.includes('CoinGecko') && svgTexto.includes('BCB PTAX'), 'Atribuições presentes no SVG');

// ─── 8. RATE LIMIT 429 ───
console.log('\n--- 8. Rate Limiting Dinâmico & Bloqueio HTTP 429 ---');
let bateu429 = false;
for (let i = 0; i < 35; i++) {
  const r = await worker.fetch(new Request('https://api.test/api/cripto/health'), ENV_TESTE, {}, mockFetch);
  if (r.status === 429) {
    bateu429 = true;
    break;
  }
}
assert(bateu429, 'Rate limiter bloqueia após 30 RPM no plano free');

// ─── 9. VERIFICAÇÃO DE CÓDIGO LIMPO (ZERO HARDCODE DE PREÇO/TAXAS) ───
console.log('\n--- 9. Auditoria Estática (Zero Preços ou Taxas Hardcoded) ---');
const arquivosProducao = ['cripto-engine.js', 'worker.js', 'cache.js', 'cripto-ticker-pro.js'];
const padroesProibidos = [
  /precoUsd:\s*\d{3,}/i,
  /TAXA_CAMBIO_USD_BRL/i,
  /sparkline7d:\s*\[\s*\d/i,
  /CRIPTO_DATABASE/i,
  /91500/
];

for (const f of arquivosProducao) {
  const conteudo = fs.readFileSync(path.join(__dirname, f), 'utf8');
  for (const reg of padroesProibidos) {
    if (reg.test(conteudo)) {
      throw new Error(`Padrão proibido "${reg}" encontrado no arquivo de produção ${f}`);
    }
  }
}
assert(true, 'Nenhum valor simulado/hardcoded de preço ou taxa encontrado no código de produção');

console.log(`\n🎉 Todos os ${pass} testes do Cripto Ticker Pro passaram com 100% de sucesso!`);