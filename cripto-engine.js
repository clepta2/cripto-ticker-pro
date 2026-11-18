/**
 * cripto-engine.js — Motor de Cotações Cripto, Câmbio PTAX, Gas Tracker e Fear & Greed
 * NENHUM dado inventado: dados consultados de fontes reais com cache e tratamento de indisponibilidade.
 *
 * @license MIT
 * @see https://github.com/clepta2/cripto-ticker-pro
 */

import { buscarJson, lerComCache, espiarCache, ErroFonte, ErroRequisicao } from './cache.js';

export const ATIVOS_SUPORTADOS = [
  { id: 'bitcoin', simbolo: 'BTC', nome: 'Bitcoin', categoria: 'Layer 1 / Moeda Soberana' },
  { id: 'ethereum', simbolo: 'ETH', nome: 'Ethereum', categoria: 'Smart Contracts / Layer 1' },
  { id: 'solana', simbolo: 'SOL', nome: 'Solana', categoria: 'Layer 1 de Alta Performance' },
  { id: 'binancecoin', simbolo: 'BNB', nome: 'BNB', categoria: 'Ecossistema BNB Chain' },
  { id: 'ripple', simbolo: 'XRP', nome: 'XRP', categoria: 'Pagamentos & Liquidez' },
  { id: 'dogecoin', simbolo: 'DOGE', nome: 'Dogecoin', categoria: 'Memecoin / PoW' },
  { id: 'cardano', simbolo: 'ADA', nome: 'Cardano', categoria: 'Proof of Stake / Layer 1' },
  { id: 'avalanche-2', simbolo: 'AVAX', nome: 'Avalanche', categoria: 'Subnets / Layer 1' },
  { id: 'chainlink', simbolo: 'LINK', nome: 'Chainlink', categoria: 'Infraestrutura / Oráculos' },
  { id: 'sui', simbolo: 'SUI', nome: 'Sui', categoria: 'Move Language / Layer 1' },
  { id: 'tether', simbolo: 'USDT', nome: 'Tether USD', categoria: 'Stablecoin Pareada ao USD' },
  { id: 'usd-coin', simbolo: 'USDC', nome: 'USD Coin', categoria: 'Stablecoin Auditada USD' }
];

const MAPA_SIMBOLO_ID = new Map();
const MAPA_ID_INFO = new Map();
for (const a of ATIVOS_SUPORTADOS) {
  MAPA_SIMBOLO_ID.set(a.simbolo.toLowerCase(), a.id);
  MAPA_SIMBOLO_ID.set(a.id.toLowerCase(), a.id);
  MAPA_ID_INFO.set(a.id, a);
}

export const TTL_SEGUNDOS = {
  markets: 120, // 2 min
  global: 300,  // 5 min
  fng: 600,     // 10 min
  ptax: 600,    // 10 min
  mempool: 60,  // 1 min
  gasEth: 30    // 30 s
};

export const FONTES_INFO = {
  coingecko: {
    nome: 'CoinGecko API',
    termo: 'Uso comercial requer plano com chave de API. Dados agregados de mercado e sparkline.',
    url: 'https://docs.coingecko.com',
    atribuicao: 'Dados: CoinGecko'
  },
  bcb: {
    nome: 'Banco Central do Brasil — PTAX',
    termo: 'Dados abertos oficiais do governo brasileiro (referência diária/intradiária de câmbio PTAX).',
    url: 'https://dadosabertos.bcb.gov.br/dataset/dolar-americano-usd-todos-os-boletins-diarios',
    atribuicao: 'Dados de câmbio: Banco Central do Brasil (PTAX)'
  },
  alternativeMe: {
    nome: 'Alternative.me — Crypto Fear & Greed Index',
    termo: 'Uso comercial permitido com atribuição direta ao lado do dado exibido. Índice restrito ao Bitcoin.',
    url: 'https://alternative.me/crypto/fear-and-greed-index/',
    atribuicao: 'Fonte: alternative.me — Crypto Fear & Greed Index'
  },
  mempool: {
    nome: 'The Mempool Open Source Project (mempool.space)',
    termo: 'Estimativas de taxas da rede Bitcoin recomendadas por bloco.',
    url: 'https://mempool.space',
    atribuicao: 'Taxas Bitcoin: mempool.space'
  },
  publicNode: {
    nome: 'PublicNode Ethereum RPC',
    termo: 'Endpoint JSON-RPC público para consulta direta da taxa de gas da rede Ethereum (eth_gasPrice).',
    url: 'https://ethereum-rpc.publicnode.com',
    atribuicao: 'Gas Ethereum: PublicNode JSON-RPC (eth_gasPrice)'
  }
};

// ─── 1. CÂMBIO PTAX BCB ───
export async function obterCambioBcb(moeda = 'USD', env = {}, ctx = {}, fetchImpl) {
  const m = moeda.toUpperCase();
  if (m !== 'USD' && m !== 'EUR') {
    throw new ErroRequisicao(400, 'MOEDA_INVALIDA', 'Moeda de câmbio suportada no BCB: USD ou EUR.');
  }

  const nomeCache = `ptax_${m}`;
  return lerComCache(nomeCache, TTL_SEGUNDOS.ptax, async () => {
    const agora = new Date();
    const dataFim = formatarDataBcb(agora);
    const dataIni = formatarDataBcb(new Date(agora.getTime() - 10 * 86400 * 1000));

    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='${m}'&@dataInicial='${dataIni}'&@dataFinalCotacao='${dataFim}'&` + '$top=1&$orderby=dataHoraCotacao%20desc&$format=json';

    const res = await buscarJson(url, { fonte: 'Banco Central do Brasil (PTAX)', fetchImpl });
    const lista = res?.value;
    if (!Array.isArray(lista) || lista.length === 0) {
      throw new ErroFonte({
        fonte: 'Banco Central do Brasil (PTAX)',
        detalhe: `Nenhuma cotação PTAX encontrada para ${m} nos últimos 10 dias.`
      });
    }

    const reg = lista[0];
    const taxaVenda = Number(reg.cotacaoVenda);
    if (!Number.isFinite(taxaVenda) || taxaVenda <= 0) {
      throw new ErroFonte({ fonte: 'Banco Central do Brasil (PTAX)', detalhe: 'Taxa PTAX retornada inválida.' });
    }

    return {
      moeda: m,
      taxaVenda,
      taxaCompra: Number(reg.cotacaoCompra) || taxaVenda,
      dataHoraCotacao: reg.dataHoraCotacao,
      tipoBoletim: reg.tipoBoletim || 'Oficial',
      fonte: FONTES_INFO.bcb.nome,
      atribuicao: FONTES_INFO.bcb.atribuicao,
      aviso: 'Taxa PTAX oficial do BCB; é referência cambial de fechamento/intradiária, não cotação tick-a-tick em tempo real.'
    };
  }, ctx);
}

function formatarDataBcb(data) {
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(data.getUTCDate()).padStart(2, '0');
  const ano = data.getUTCFullYear();
  return `${mes}-${dia}-${ano}`;
}

// ─── 2. COINGECKO MARKETS ───
export async function obterCriptoMarkets(env = {}, ctx = {}, fetchImpl) {
  const chave = env.COINGECKO_API_KEY || '';
  if (!chave && !fetchImpl) {
    throw new ErroRequisicao(503, 'CHAVE_NAO_CONFIGURADA', 'Acesso aos dados de criptoativos requer chave da API CoinGecko. Configure a variável secreta COINGECKO_API_KEY no Cloudflare Worker.');
  }

  const plano = (env.COINGECKO_API_PLAN || 'demo').toLowerCase();
  const baseUrl = plano === 'pro' ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
  const headerKey = plano === 'pro' ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';

  return lerComCache('coingecko_markets', TTL_SEGUNDOS.markets, async () => {
    const ids = ATIVOS_SUPORTADOS.map(a => a.id).join(',');
    const url = `${baseUrl}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`;
    const headers = chave ? { [headerKey]: chave } : {};

    const raw = await buscarJson(url, { fonte: 'CoinGecko Markets', headers, fetchImpl });
    if (!Array.isArray(raw)) {
      throw new ErroFonte({ fonte: 'CoinGecko Markets', detalhe: 'Resposta não é uma lista de ativos.' });
    }

    const mapa = {};
    for (const item of raw) {
      if (!item || !item.id) continue;
      const meta = MAPA_ID_INFO.get(item.id);
      mapa[item.id] = {
        id: item.id,
        simbolo: (item.symbol || meta?.simbolo || '').toUpperCase(),
        nome: item.name || meta?.nome || item.id,
        categoria: meta?.categoria || 'Criptoativo',
        rank: item.market_cap_rank || null,
        precoUsd: Number(item.current_price) || 0,
        variacao24hPct: Number(item.price_change_percentage_24h ?? item.price_change_percentage_24h_in_currency) || 0,
        variacao7dPct: Number(item.price_change_percentage_7d_in_currency) || 0,
        marketCapUsd: Number(item.market_cap) || 0,
        volume24hUsd: Number(item.total_volume) || 0,
        athUsd: Number(item.ath) || 0,
        circulante: item.circulating_supply ? `${(Number(item.circulating_supply) / 1e6).toFixed(2)}M ${(item.symbol || '').toUpperCase()}` : null,
        sparkline7d: Array.isArray(item.sparkline_in_7d?.price) ? item.sparkline_in_7d.price : [],
        atualizadoEm: item.last_updated || new Date().toISOString()
      };
    }
    return mapa;
  }, ctx);
}

// ─── 3. FEAR & GREED ───
export async function obterFearAndGreed(ctx = {}, fetchImpl) {
  return lerComCache('alternative_fng', TTL_SEGUNDOS.fng, async () => {
    const url = 'https://api.alternative.me/fng/?limit=1';
    const raw = await buscarJson(url, { fonte: 'Alternative.me', fetchImpl });
    const data = raw?.data?.[0];
    if (!data) throw new ErroFonte({ fonte: 'Alternative.me', detalhe: 'Formato de resposta inesperado.' });

    const valor = Number(data.value);
    const classOriginal = data.value_classification || 'Neutral';
    const traduzida = traduzirClassificacaoFng(classOriginal);

    return {
      valor,
      classificacao: traduzida,
      classificacaoOriginal: classOriginal,
      timestampUnix: Number(data.timestamp),
      tempoAteProximaAtualizacaoSegundos: Number(data.time_until_update) || null,
      aviso: 'O Fear & Greed Index é calculado exclusivamente para o mercado de Bitcoin (BTC).',
      atribuicao: FONTES_INFO.alternativeMe.atribuicao,
      fonte: FONTES_INFO.alternativeMe.nome
    };
  }, ctx);
}

function traduzirClassificacaoFng(classificacao) {
  const c = String(classificacao).toLowerCase();
  if (c.includes('extreme fear')) return 'Medo Extremo';
  if (c.includes('extreme greed')) return 'Ganância Extrema';
  if (c.includes('fear')) return 'Medo';
  if (c.includes('greed')) return 'Ganância';
  return 'Neutro';
}

// ─── 4. GAS & FEES (BITCOIN & ETHEREUM) ───
export async function obterGasTrackerReal(env = {}, ctx = {}, fetchImpl) {
  const pMempool = lerComCache('mempool_fees', TTL_SEGUNDOS.mempool, async () => {
    const raw = await buscarJson('https://mempool.space/api/v1/fees/recommended', { fonte: 'mempool.space', fetchImpl });
    return {
      fastestFee: Number(raw.fastestFee) || 0,
      halfHourFee: Number(raw.halfHourFee) || 0,
      hourFee: Number(raw.hourFee) || 0,
      minimumFee: Number(raw.minimumFee) || 0
    };
  }, ctx);

  const pEthGas = lerComCache('eth_gas_rpc', TTL_SEGUNDOS.gasEth, async () => {
    const corpo = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] });
    const raw = await buscarJson('https://ethereum-rpc.publicnode.com', {
      fonte: 'PublicNode Ethereum RPC',
      metodo: 'POST',
      headers: { 'Content-Type': 'application/json' },
      corpo,
      fetchImpl
    });
    const hex = raw?.result;
    if (!hex || typeof hex !== 'string') {
      throw new ErroFonte({ fonte: 'PublicNode Ethereum RPC', detalhe: 'Resultado eth_gasPrice inválido.' });
    }
    const wei = BigInt(hex);
    const gwei = Number(wei) / 1e9;
    return { wei: wei.toString(), gwei: Number(gwei.toFixed(2)) };
  }, ctx);

  const [resMempool, resEthGas] = await Promise.allSettled([pMempool, pEthGas]);

  let precoEth = null;
  let precoBtc = null;
  try {
    const marketsWrap = await espiarCache('coingecko_markets', TTL_SEGUNDOS.markets);
    if (marketsWrap?.dados) {
      precoEth = marketsWrap.dados.ethereum?.precoUsd || null;
      precoBtc = marketsWrap.dados.bitcoin?.precoUsd || null;
    }
  } catch { /* omite estimativa em USD */ }

  const bitcoin = resMempool.status === 'fulfilled' ? {
    unidade: 'Satoshis / vByte (sat/vB)',
    altaPrioridade: { satVb: resMempool.value.dados.fastestFee, estimativa: 'Próximo Bloco (~10 min)' },
    mediaPrioridade: { satVb: resMempool.value.dados.halfHourFee, estimativa: '~3 blocos (~30 min)' },
    baixaPrioridade: { satVb: resMempool.value.dados.hourFee, estimativa: '~6 blocos (~60 min)' },
    taxaMinima: { satVb: resMempool.value.dados.minimumFee },
    custoEstimadoTransferenciaUsd: precoBtc ? Number(((140 * resMempool.value.dados.halfHourFee * 1e-8) * precoBtc).toFixed(2)) : null,
    fonte: FONTES_INFO.mempool.nome,
    atribuicao: FONTES_INFO.mempool.atribuicao,
    desatualizado: resMempool.value.desatualizado
  } : { erro: resMempool.reason?.message || 'Indisponível no momento' };

  const ethData = resEthGas.status === 'fulfilled' ? resEthGas.value.dados : null;
  const gwei = ethData?.gwei || 0;
  const ethereum = resEthGas.status === 'fulfilled' ? {
    unidade: 'Gwei (10^-9 ETH)',
    gasPriceGwei: gwei,
    gasPriceWei: ethData.wei,
    custoTransferenciaSimplesUsd: precoEth ? Number(((gwei * 21000 * 1e-9) * precoEth).toFixed(2)) : null,
    custoSwapUniswapEstimadoUsd: precoEth ? Number(((gwei * 150000 * 1e-9) * precoEth).toFixed(2)) : null,
    fonte: FONTES_INFO.publicNode.nome,
    atribuicao: FONTES_INFO.publicNode.atribuicao,
    desatualizado: resEthGas.value.desatualizado
  } : { erro: resEthGas.reason?.message || 'Indisponível no momento' };

  return {
    ok: true,
    atualizadoEm: new Date().toISOString(),
    bitcoin,
    ethereum
  };
}

// ─── 5. GLOBAL & DOMINÂNCIA ───
export async function obterDominanciaGlobal(env = {}, ctx = {}, fetchImpl) {
  const chave = env.COINGECKO_API_KEY || '';
  const plano = (env.COINGECKO_API_PLAN || 'demo').toLowerCase();
  const baseUrl = plano === 'pro' ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
  const headerKey = plano === 'pro' ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';

  return lerComCache('coingecko_global', TTL_SEGUNDOS.global, async () => {
    const url = `${baseUrl}/global`;
    const headers = chave ? { [headerKey]: chave } : {};
    const raw = await buscarJson(url, { fonte: 'CoinGecko Global', headers, fetchImpl });
    const data = raw?.data;
    if (!data) throw new ErroFonte({ fonte: 'CoinGecko Global', detalhe: 'Formato global inesperado.' });

    const btcDom = Number(data.market_cap_percentage?.btc) || 0;
    const ethDom = Number(data.market_cap_percentage?.eth) || 0;
    const outras = Math.max(0, Number((100 - btcDom - ethDom).toFixed(2)));

    return {
      dominancia: {
        bitcoin: `${btcDom.toFixed(2)}%`,
        ethereum: `${ethDom.toFixed(2)}%`,
        outras: `${outras.toFixed(2)}%`
      },
      ativosMonitoradosGlobal: data.active_cryptocurrencies || null,
      atualizadoEmUnix: data.updated_at,
      fonte: FONTES_INFO.coingecko.nome,
      atribuicao: FONTES_INFO.coingecko.atribuicao
    };
  }, ctx);
}

// ─── 6. LISTAGEM COM CONVERSÃO PTAX ───
export async function listarCriptos(filtroCategoria, env = {}, ctx = {}, fetchImpl) {
  const [resMarkets, resPtax] = await Promise.all([
    obterCriptoMarkets(env, ctx, fetchImpl),
    obterCambioBcb('USD', env, ctx, fetchImpl)
  ]);

  const taxaPtax = resPtax.dados.taxaVenda;
  let lista = Object.values(resMarkets.dados);

  if (filtroCategoria) {
    const cat = filtroCategoria.toLowerCase();
    lista = lista.filter(c => c.categoria.toLowerCase().includes(cat));
  }

  return {
    ok: true,
    total: lista.length,
    cambioPtaxUsd: taxaPtax,
    cambioAtualizadoEm: resPtax.dados.dataHoraCotacao,
    desatualizado: resMarkets.desatualizado || resPtax.desatualizado,
    idadeSegundos: Math.max(resMarkets.idadeSegundos, resPtax.idadeSegundos),
    ativos: lista.map(c => {
      const precoBrl = Number((c.precoUsd * taxaPtax).toFixed(2));
      return {
        ...c,
        precoBrl,
        precoFormatadoUsd: `$ ${c.precoUsd >= 1 ? c.precoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : c.precoUsd}`,
        precoFormatadoBrl: `R$ ${precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        marketCapFormatado: `$ ${(c.marketCapUsd / 1e9).toFixed(2)}B`,
        volume24hFormatado: `$ ${(c.volume24hUsd / 1e9).toFixed(2)}B`
      };
    }),
    fontes: [FONTES_INFO.coingecko.nome, FONTES_INFO.bcb.nome]
  };
}

// ─── 7. CONSULTA INDIVIDUAL ───
export async function consultarCripto(simboloOuSlug, env = {}, ctx = {}, fetchImpl) {
  const s = String(simboloOuSlug || '').toLowerCase().trim();
  const id = MAPA_SIMBOLO_ID.get(s);

  if (!id) {
    return {
      ok: false,
      erro: 'ATIVO_NAO_ENCONTRADO',
      mensagem: `Criptoativo "${simboloOuSlug}" não está no catálogo suportado (12 ativos monitorados).`,
      disponiveis: ATIVOS_SUPORTADOS.map(a => a.simbolo)
    };
  }

  const [resMarkets, resPtax] = await Promise.all([
    obterCriptoMarkets(env, ctx, fetchImpl),
    obterCambioBcb('USD', env, ctx, fetchImpl)
  ]);

  const ativo = resMarkets.dados[id];
  if (!ativo) {
    return {
      ok: false,
      erro: 'DADOS_INDISPONIVEIS',
      mensagem: `Dados do ativo "${id}" não retornaram do feed da CoinGecko.`
    };
  }

  const taxaPtax = resPtax.dados.taxaVenda;
  const precoBrl = Number((ativo.precoUsd * taxaPtax).toFixed(2));

  return {
    ok: true,
    desatualizado: resMarkets.desatualizado || resPtax.desatualizado,
    idadeSegundos: Math.max(resMarkets.idadeSegundos, resPtax.idadeSegundos),
    ativo: {
      ...ativo,
      precoBrl,
      precoFormatadoUsd: `$ ${ativo.precoUsd >= 1 ? ativo.precoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ativo.precoUsd}`,
      precoFormatadoBrl: `R$ ${precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      marketCapFormatado: `$ ${(ativo.marketCapUsd / 1e9).toFixed(2)}B`,
      volume24hFormatado: `$ ${(ativo.volume24hUsd / 1e9).toFixed(2)}B`,
      distanciaATH: ativo.athUsd ? `${(((ativo.precoUsd - ativo.athUsd) / ativo.athUsd) * 100).toFixed(1)}%` : null
    },
    cambioPtaxUsd: taxaPtax,
    cambioDataHora: resPtax.dados.dataHoraCotacao
  };
}

// ─── 8. CONVERSOR DE PARIDADES ───
export async function converterParidade(quantidade, deMoeda, paraMoeda, env = {}, ctx = {}, fetchImpl) {
  const qtd = parseFloat(quantidade);
  if (!Number.isFinite(qtd) || qtd <= 0) {
    throw new ErroRequisicao(400, 'QUANTIDADE_INVALIDA', 'Informe uma quantidade numérica maior que zero.');
  }

  const de = String(deMoeda || 'BTC').toLowerCase().trim();
  const para = String(paraMoeda || 'BRL').toLowerCase().trim();

  const precisaPtaxUsd = de === 'brl' || para === 'brl';
  const precisaPtaxEur = de === 'eur' || para === 'eur';

  const [resMarkets, resPtaxUsd, resPtaxEur] = await Promise.all([
    obterCriptoMarkets(env, ctx, fetchImpl),
    precisaPtaxUsd ? obterCambioBcb('USD', env, ctx, fetchImpl) : Promise.resolve(null),
    precisaPtaxEur ? obterCambioBcb('EUR', env, ctx, fetchImpl) : Promise.resolve(null)
  ]);

  const ptaxUsd = resPtaxUsd?.dados?.taxaVenda || null;
  const ptaxEur = resPtaxEur?.dados?.taxaVenda || null;

  const getUsdPrice = (sym) => {
    if (sym === 'usd') return 1;
    if (sym === 'brl') return ptaxUsd ? (1 / ptaxUsd) : null;
    if (sym === 'eur') {
      if (ptaxEur && ptaxUsd) return ptaxEur / ptaxUsd;
      return null;
    }
    const id = MAPA_SIMBOLO_ID.get(sym);
    if (!id) return null;
    return resMarkets.dados[id]?.precoUsd || null;
  };

  const precoDeUsd = getUsdPrice(de);
  const precoParaUsd = getUsdPrice(para);

  if (!precoDeUsd || !precoParaUsd) {
    throw new ErroRequisicao(400, 'MOEDA_INVALIDA', `Não foi possível cotar paridade entre "${deMoeda}" e "${paraMoeda}". Ativos permitidos: moedas (USD, BRL, EUR) e criptos monitoradas (${ATIVOS_SUPORTADOS.map(a => a.simbolo).join(', ')}).`);
  }

  const taxaConversao = precoDeUsd / precoParaUsd;
  const resultado = qtd * taxaConversao;

  return {
    ok: true,
    quantidadeDe: qtd,
    de: de.toUpperCase(),
    para: para.toUpperCase(),
    taxaConversao: Number(taxaConversao.toFixed(6)),
    resultadoTotal: Number(resultado.toFixed(resultado >= 1 ? 2 : 6)),
    resultadoFormatado: `${Number(resultado.toFixed(resultado >= 1 ? 2 : 6))} ${para.toUpperCase()}`,
    fontesUtilizadas: [
      FONTES_INFO.coingecko.nome,
      ...(precisaPtaxUsd || precisaPtaxEur ? [FONTES_INFO.bcb.nome] : [])
    ]
  };
}

// ─── 9. CARD SVG COM SPARKLINE 7D ───
export async function renderCriptoCardSvg(simbolo = 'btc', env = {}, ctx = {}, fetchImpl) {
  const s = String(simbolo || 'btc').toLowerCase().trim();
  const id = MAPA_SIMBOLO_ID.get(s) || 'bitcoin';

  const [resMarkets, resPtax] = await Promise.all([
    obterCriptoMarkets(env, ctx, fetchImpl),
    obterCambioBcb('USD', env, ctx, fetchImpl)
  ]);

  const ativo = resMarkets.dados[id];
  if (!ativo) {
    throw new ErroRequisicao(404, 'ATIVO_NAO_ENCONTRADO', `Ativo "${simbolo}" indisponível para renderização.`);
  }

  const taxaPtax = resPtax.dados.taxaVenda;
  const precoBrl = Number((ativo.precoUsd * taxaPtax).toFixed(2));

  let pts = ativo.sparkline7d;
  if (Array.isArray(pts) && pts.length > 50) {
    const passo = Math.ceil(pts.length / 42);
    pts = pts.filter((_, idx) => idx % passo === 0);
  }
  if (!Array.isArray(pts) || pts.length < 2) pts = [ativo.precoUsd, ativo.precoUsd];

  const min = Math.min(...pts);
  const max = Math.max(...pts);

  const fX = 300, fY = 80, fW = 300, fH = 80;
  const pathD = pts.map((p, idx) => {
    const x = fX + (idx / (pts.length - 1)) * fW;
    const y = fY + fH - ((p - min) / Math.max(0.0001, max - min)) * fH;
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const isUp = ativo.variacao24hPct >= 0;
  const corVar = isUp ? '#10b981' : '#ef4444';

  const avisoDesat = (resMarkets.desatualizado || resPtax.desatualizado)
    ? `<text x="608" y="200" text-anchor="end" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#f59e0b">DADOS EM CACHE (DESATUALIZADOS)</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 220" width="640" height="220">
  <defs>
    <linearGradient id="crBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09101f"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>

  <rect width="640" height="220" rx="16" fill="url(#crBg)" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Topo -->
  <text x="32" y="36" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#a3e635" letter-spacing="1">
    CRIPTO TICKER PRO • DADOS REAIS
  </text>
  <text x="608" y="36" text-anchor="end" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#94a3b8">
    ${escaparXml(ativo.categoria)}
  </text>

  <!-- Ativo e Símbolo -->
  <text x="32" y="74" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#f8fafc">
    ${escaparXml(ativo.nome)} <tspan fill="#60a5fa" font-size="16">(${escaparXml(ativo.simbolo)})</tspan>
  </text>

  <!-- Preço Grande -->
  <text x="32" y="125" font-family="ui-monospace, monospace" font-size="34" font-weight="900" fill="#f8fafc">
    $ ${ativo.precoUsd >= 1 ? ativo.precoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ativo.precoUsd}
  </text>
  <text x="32" y="152" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#94a3b8">
    R$ ${precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <tspan font-size="11" fill="#64748b">(PTAX: R$ ${taxaPtax.toFixed(2)})</tspan>
  </text>

  <!-- Variação 24h -->
  <rect x="32" y="168" width="94" height="26" rx="6" fill="${corVar}" fill-opacity="0.15"/>
  <text x="79" y="185" text-anchor="middle" font-family="ui-monospace, monospace" font-size="13" font-weight="800" fill="${corVar}">
    ${isUp ? '+' : ''}${ativo.variacao24hPct.toFixed(2)}%
  </text>

  <!-- Sparkline 7D -->
  <path d="${pathD}" fill="none" stroke="${corVar}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Rodapé / Atribuição -->
  <text x="32" y="206" font-family="system-ui, sans-serif" font-size="10" font-weight="500" fill="#64748b">
    Dados: CoinGecko • Câmbio: BCB PTAX • Atualizado: ${escaparXml(ativo.atualizadoEm.slice(0, 19).replace('T', ' '))}
  </text>
  ${avisoDesat}
</svg>`;
}

function escaparXml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }[c]));
}