/**
 * cripto-engine.js
 * Motor Soberano de Cotações Cripto, Gas Tracker, Paridades Cruzadas & Sparklines SVG
 * Cripto Ticker Pro API Anycast (<2ms)
 * 
 * @license MIT
 * @see https://github.com/clepta2/cripto-ticker-pro
 */

export const TAXA_CAMBIO_USD_BRL = 5.80;

export const CRIPTO_DATABASE = {
  'btc': {
    id: 'bitcoin',
    simbolo: 'BTC',
    nome: 'Bitcoin',
    categoria: 'Layer 1 / Moeda Soberana',
    rank: 1,
    precoUsd: 91500.00,
    variacao24hPct: +2.85,
    variacao7dPct: +8.40,
    marketCapUsd: 1810000000000,
    volume24hUsd: 48500000000,
    athUsd: 93450.00,
    circulante: '19.78M BTC',
    sparkline7d: [87500, 88200, 89100, 88700, 90200, 91100, 91500]
  },
  'eth': {
    id: 'ethereum',
    simbolo: 'ETH',
    nome: 'Ethereum',
    categoria: 'Smart Contracts / Layer 1',
    rank: 2,
    precoUsd: 3180.00,
    variacao24hPct: +1.65,
    variacao7dPct: +5.20,
    marketCapUsd: 382000000000,
    volume24hUsd: 22400000000,
    athUsd: 4891.00,
    circulante: '120.4M ETH',
    sparkline7d: [3020, 3050, 3110, 3090, 3140, 3160, 3180]
  },
  'sol': {
    id: 'solana',
    simbolo: 'SOL',
    nome: 'Solana',
    categoria: 'Layer 1 de Alta Performance',
    rank: 3,
    precoUsd: 218.50,
    variacao24hPct: +5.40,
    variacao7dPct: +14.80,
    marketCapUsd: 103000000000,
    volume24hUsd: 8900000000,
    athUsd: 260.06,
    circulante: '471M SOL',
    sparkline7d: [192, 198, 204, 201, 212, 215, 218.5]
  },
  'bnb': {
    id: 'binancecoin',
    simbolo: 'BNB',
    nome: 'BNB',
    categoria: 'Exchange Token / BNB Chain',
    rank: 4,
    precoUsd: 645.00,
    variacao24hPct: +0.80,
    variacao7dPct: +3.10,
    marketCapUsd: 93500000000,
    volume24hUsd: 1850000000,
    athUsd: 720.67,
    circulante: '145M BNB',
    sparkline7d: [625, 630, 638, 635, 641, 643, 645]
  },
  'xrp': {
    id: 'ripple',
    simbolo: 'XRP',
    nome: 'XRP',
    categoria: 'Pagamentos Internacionais',
    rank: 5,
    precoUsd: 1.15,
    variacao24hPct: +8.90,
    variacao7dPct: +62.50,
    marketCapUsd: 65400000000,
    volume24hUsd: 12400000000,
    athUsd: 3.84,
    circulante: '56.9B XRP',
    sparkline7d: [0.72, 0.81, 0.89, 0.98, 1.05, 1.10, 1.15]
  },
  'doge': {
    id: 'dogecoin',
    simbolo: 'DOGE',
    nome: 'Dogecoin',
    categoria: 'Memecoin / PoW',
    rank: 6,
    precoUsd: 0.38,
    variacao24hPct: +4.20,
    variacao7dPct: +35.40,
    marketCapUsd: 55800000000,
    volume24hUsd: 9400000000,
    athUsd: 0.7376,
    circulante: '146.8B DOGE',
    sparkline7d: [0.28, 0.31, 0.34, 0.32, 0.36, 0.37, 0.38]
  },
  'ada': {
    id: 'cardano',
    simbolo: 'ADA',
    nome: 'Cardano',
    categoria: 'Layer 1 PoS',
    rank: 7,
    precoUsd: 0.74,
    variacao24hPct: +3.10,
    variacao7dPct: +24.50,
    marketCapUsd: 26500000000,
    volume24hUsd: 2150000000,
    athUsd: 3.10,
    circulante: '35.7B ADA',
    sparkline7d: [0.59, 0.62, 0.66, 0.68, 0.71, 0.73, 0.74]
  },
  'avax': {
    id: 'avalanche-2',
    simbolo: 'AVAX',
    nome: 'Avalanche',
    categoria: 'Subnets / Layer 1',
    rank: 8,
    precoUsd: 34.80,
    variacao24hPct: +2.40,
    variacao7dPct: +11.20,
    marketCapUsd: 14200000000,
    volume24hUsd: 850000000,
    athUsd: 146.22,
    circulante: '408M AVAX',
    sparkline7d: [31.2, 32.0, 33.1, 32.8, 33.9, 34.4, 34.8]
  },
  'link': {
    id: 'chainlink',
    simbolo: 'LINK',
    nome: 'Chainlink',
    categoria: 'Oráculos / Infraestrutura Web3',
    rank: 9,
    precoUsd: 14.60,
    variacao24hPct: +1.80,
    variacao7dPct: +7.90,
    marketCapUsd: 9150000000,
    volume24hUsd: 620000000,
    athUsd: 52.88,
    circulante: '626M LINK',
    sparkline7d: [13.5, 13.8, 14.1, 14.0, 14.3, 14.5, 14.6]
  },
  'sui': {
    id: 'sui',
    simbolo: 'SUI',
    nome: 'Sui',
    categoria: 'Layer 1 Move Language',
    rank: 10,
    precoUsd: 3.42,
    variacao24hPct: +6.80,
    variacao7dPct: +41.20,
    marketCapUsd: 9750000000,
    volume24hUsd: 2450000000,
    athUsd: 3.52,
    circulante: '2.85B SUI',
    sparkline7d: [2.42, 2.65, 2.88, 3.05, 3.20, 3.35, 3.42]
  },
  'usdt': {
    id: 'tether',
    simbolo: 'USDT',
    nome: 'Tether USD',
    categoria: 'Stablecoin Fiat-Backed',
    rank: 11,
    precoUsd: 1.00,
    variacao24hPct: 0.01,
    variacao7dPct: 0.02,
    marketCapUsd: 128500000000,
    volume24hUsd: 95000000000,
    athUsd: 1.02,
    circulante: '128.5B USDT',
    sparkline7d: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
  },
  'usdc': {
    id: 'usd-coin',
    simbolo: 'USDC',
    nome: 'USD Coin',
    categoria: 'Stablecoin Regulada',
    rank: 12,
    precoUsd: 1.00,
    variacao24hPct: 0.00,
    variacao7dPct: 0.01,
    marketCapUsd: 37200000000,
    volume24hUsd: 8500000000,
    athUsd: 1.01,
    circulante: '37.2B USDC',
    sparkline7d: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
  }
};

/**
 * Retorna todos os criptoativos formatados com preços em USD e BRL
 */
export function listarCriptos(filtroCategoria) {
  let lista = Object.values(CRIPTO_DATABASE);
  if (filtroCategoria) {
    const cat = filtroCategoria.toLowerCase();
    lista = lista.filter(c => c.categoria.toLowerCase().includes(cat));
  }

  return lista.map(c => ({
    ...c,
    precoBrl: Number((c.precoUsd * TAXA_CAMBIO_USD_BRL).toFixed(2)),
    precoFormatadoUsd: `$ ${c.precoUsd >= 1 ? c.precoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : c.precoUsd}`,
    precoFormatadoBrl: `R$ ${(c.precoUsd * TAXA_CAMBIO_USD_BRL).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    marketCapFormatado: `$ ${(c.marketCapUsd / 1e9).toFixed(2)}B`,
    volume24hFormatado: `$ ${(c.volume24hUsd / 1e9).toFixed(2)}B`
  }));
}

/**
 * Consulta cotação detalhada de um criptoativo específico
 */
export function consultarCripto(simboloOuSlug) {
  const s = String(simboloOuSlug || '').toLowerCase().trim();
  const ativo = CRIPTO_DATABASE[s] || Object.values(CRIPTO_DATABASE).find(c => c.id === s || c.simbolo.toLowerCase() === s);

  if (!ativo) {
    return {
      ok: false,
      erro: 'ATIVO_NAO_ENCONTRADO',
      mensagem: `Criptoativo "${simboloOuSlug}" não encontrado no catálogo Anycast.`,
      disponiveis: Object.keys(CRIPTO_DATABASE).map(k => k.toUpperCase())
    };
  }

  const precoBrl = Number((ativo.precoUsd * TAXA_CAMBIO_USD_BRL).toFixed(2));

  return {
    ok: true,
    ativo: {
      ...ativo,
      precoBrl,
      precoFormatadoUsd: `$ ${ativo.precoUsd >= 1 ? ativo.precoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ativo.precoUsd}`,
      precoFormatadoBrl: `R$ ${precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      marketCapFormatado: `$ ${(ativo.marketCapUsd / 1e9).toFixed(2)}B`,
      volume24hFormatado: `$ ${(ativo.volume24hUsd / 1e9).toFixed(2)}B`,
      distanciaATH: `${(((ativo.precoUsd - ativo.athUsd) / ativo.athUsd) * 100).toFixed(1)}%`
    }
  };
}

/**
 * Monitor de Taxas de Rede e Gas Tracker em Tempo Real
 */
export function obterGasTracker() {
  const ethPreco = CRIPTO_DATABASE.eth.precoUsd;
  const btcPreco = CRIPTO_DATABASE.btc.precoUsd;

  return {
    ok: true,
    atualizadoEm: new Date().toISOString(),
    ethereum: {
      unidade: 'Gwei (10^-9 ETH)',
      lento: { gwei: 12, tempoSegundos: '3-5 min', custoUsdTransferencia: Number(((12 * 21000 * 1e-9) * ethPreco).toFixed(2)) },
      padrao: { gwei: 16, tempoSegundos: '< 1 min', custoUsdTransferencia: Number(((16 * 21000 * 1e-9) * ethPreco).toFixed(2)) },
      rapido: { gwei: 22, tempoSegundos: '< 15 seg', custoUsdTransferencia: Number(((22 * 21000 * 1e-9) * ethPreco).toFixed(2)) },
      swapUniswapEstimadoUsd: Number(((16 * 150000 * 1e-9) * ethPreco).toFixed(2))
    },
    bitcoin: {
      unidade: 'Satoshis / vByte (sat/vB)',
      baixaPrioridade: { satVb: 14, blocosEstimados: '3-6 blocos (~30-60 min)' },
      mediaPrioridade: { satVb: 22, blocosEstimados: '1-2 blocos (~10-20 min)' },
      altaPrioridade: { satVb: 35, blocosEstimados: 'Próximo Bloco (~10 min)' },
      custoMedioTransferenciaUsd: Number(((140 * 22 * 1e-8) * btcPreco).toFixed(2))
    },
    solana: {
      unidade: 'Lamports (micro-lamports)',
      taxaBase: '0.000005 SOL ($ 0.001)',
      taxaPrioritariaRecomendada: '50.000 micro-lamports ($ 0.012)'
    }
  };
}

/**
 * Conversor Universal de Paridades Cruzadas (Cripto ⇄ Fiat ou Cripto ⇄ Cripto)
 */
export function converterParidade(quantidade, deMoeda, paraMoeda) {
  const qtd = parseFloat(quantidade) || 1;
  const de = String(deMoeda || 'BTC').toLowerCase();
  const para = String(paraMoeda || 'BRL').toLowerCase();

  const getCotacaoUsd = (sym) => {
    if (sym === 'usd') return 1;
    if (sym === 'brl') return 1 / TAXA_CAMBIO_USD_BRL;
    if (sym === 'eur') return 1.08;
    const item = CRIPTO_DATABASE[sym] || Object.values(CRIPTO_DATABASE).find(c => c.simbolo.toLowerCase() === sym);
    return item ? item.precoUsd : null;
  };

  const precoDeUsd = getCotacaoUsd(de);
  const precoParaUsd = getCotacaoUsd(para);

  if (!precoDeUsd || !precoParaUsd) {
    return {
      ok: false,
      erro: 'MOEDA_INVALIDA',
      mensagem: `Não foi possível converter de "${deMoeda}" para "${paraMoeda}".`
    };
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
    resultadoFormatado: `${Number(resultado.toFixed(resultado >= 1 ? 2 : 6))} ${para.toUpperCase()}`
  };
}

/**
 * Indicador de Sentimento de Mercado & Dominância
 */
export function obterSentimentoEDominancia() {
  const btcCap = CRIPTO_DATABASE.btc.marketCapUsd;
  const ethCap = CRIPTO_DATABASE.eth.marketCapUsd;
  const totalCap = Object.values(CRIPTO_DATABASE).reduce((acc, cur) => acc + cur.marketCapUsd, 0);

  const btcDominance = Number(((btcCap / totalCap) * 100).toFixed(1));
  const ethDominance = Number(((ethCap / totalCap) * 100).toFixed(1));

  return {
    ok: true,
    fearAndGreedIndex: {
      valor: 82,
      classificacao: 'Extreme Greed (Ganância Extrema)',
      periodo: 'Novembro de 2026',
      descricao: 'Mercado em forte euforia com quebra consecutiva de máximas históricas do Bitcoin.'
    },
    dominanciaMercado: {
      bitcoin: `${btcDominance}%`,
      ethereum: `${ethDominance}%`,
      altcoins: `${Number((100 - btcDominance - ethDominance).toFixed(1))}%`
    },
    totalMarketCapMonitoradoUsd: `$ ${(totalCap / 1e12).toFixed(2)}T`
  };
}

/**
 * Renderiza Card Vetorial SVG com Ticker e Sparkline de 7 Dias
 */
export function renderCriptoCardSvg(simbolo = 'btc') {
  const c = consultarCripto(simbolo).ativo || CRIPTO_DATABASE.btc;
  const pts = c.sparkline7d || [100, 105, 110, 108, 115, 120];
  const min = Math.min(...pts);
  const max = Math.max(...pts);

  // Mapeamento espacial da linha SVG dentro da caixa 320x90
  const fX = 300, fY = 80, fW = 300, fH = 80;
  const pathD = pts.map((p, idx) => {
    const x = fX + (idx / (pts.length - 1)) * fW;
    const y = fY + fH - ((p - min) / Math.max(1, max - min)) * fH;
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const isUp = c.variacao24hPct >= 0;
  const corVar = isUp ? '#10b981' : '#ef4444';

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
    CRIPTO TICKER PRO ANYCAST • TICKER &amp; SPARKLINE 7D
  </text>
  <text x="608" y="36" text-anchor="end" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#94a3b8">
    ${c.categoria}
  </text>

  <!-- Ativo e Símbolo -->
  <text x="32" y="74" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#f8fafc">
    ${c.nome} <tspan fill="#60a5fa" font-size="16">(${c.simbolo})</tspan>
  </text>

  <!-- Preço Grande -->
  <text x="32" y="125" font-family="ui-monospace, monospace" font-size="36" font-weight="900" fill="#f8fafc">
    ${c.precoFormatadoUsd}
  </text>
  <text x="32" y="152" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#a3e635">
    ${c.precoFormatadoBrl}
  </text>

  <!-- Variação 24h -->
  <text x="32" y="185" font-family="ui-monospace, monospace" font-size="13" font-weight="800" fill="${corVar}">
    ${isUp ? '▲' : '▼'} ${c.variacao24hPct > 0 ? '+' : ''}${c.variacao24hPct}% (24h) • ${c.variacao7dPct > 0 ? '+' : ''}${c.variacao7dPct}% (7d)
  </text>

  <!-- Sparkline 7 Dias SVG -->
  <path d="${pathD}" fill="none" stroke="${corVar}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}
