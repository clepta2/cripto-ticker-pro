import { CriptoTickerPro } from './cripto-ticker-pro.js';
import worker from './worker.js';

console.log('🧪 Iniciando Bateria de Testes do Cripto Ticker Pro API...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    passCount++;
    console.log(`  ✅ ${message}`);
  } else {
    failCount++;
    console.error(`  ❌ FALHA: ${message}`);
    throw new Error(message);
  }
}

// ─── 1. AUTENTICAÇÃO RFC 6750 & MATRIZ DE PLANOS ───
console.log('--- 1. Padrão de Autenticação RFC 6750 & Resolução de Nível ---');

const resFree = await worker.fetch(new Request('https://api.test/api/cripto/health'), {});
assert(resFree.status === 200, 'Requisição anônima responde HTTP 200');
assert(resFree.headers.get('x-cripto-plan') === 'free', 'Requisição anônima recebe plano free');
assert(resFree.headers.get('x-cripto-ratelimit-limit') === '30', 'Plano free tem limite de 30 RPM');

const resStarter = await worker.fetch(new Request('https://api.test/api/cripto/health', {
  headers: { 'Authorization': 'Bearer crp_start_live123' }
}), {});
assert(resStarter.headers.get('x-cripto-plan') === 'starter', 'Token crp_start_ resolve plano starter');
assert(resStarter.headers.get('x-cripto-ratelimit-limit') === '60', 'Plano starter tem 60 RPM');

const resPro = await worker.fetch(new Request('https://api.test/api/cripto/health', {
  headers: { 'x-api-key': 'crp_pro_live456' }
}), {});
assert(resPro.headers.get('x-cripto-plan') === 'pro', 'Header x-api-key crp_pro_ resolve plano pro');
assert(resPro.headers.get('x-cripto-ratelimit-limit') === '300', 'Plano pro tem 300 RPM');

const resMaster = await worker.fetch(new Request('https://api.test/api/cripto/health', {
  headers: { 'Authorization': 'Bearer crp_master_suite' }
}), {});
assert(resMaster.headers.get('x-cripto-plan') === 'master', 'Token crp_master_ resolve plano master');
assert(resMaster.headers.get('x-cripto-ratelimit-limit') === '3000', 'Plano master tem 3000 RPM');


// ─── 2. RATE LIMITING DINÂMICO & HTTP 429 ───
console.log('\n--- 2. Rate Limiting Dinâmico & Bloqueio HTTP 429 ---');

let atingiu429 = false;
let retryAfterHeader = null;

for (let i = 0; i < 35; i++) {
  const r = await worker.fetch(new Request('https://api.test/api/cripto/health', {
    headers: { 'Authorization': 'Bearer crp_free_test_flood' }
  }), {});
  if (r.status === 429) {
    atingiu429 = true;
    retryAfterHeader = r.headers.get('Retry-After');
    break;
  }
}
assert(atingiu429, 'Rate limiter bloqueia com HTTP 429 ao ultrapassar cota RPM do plano free');
assert(retryAfterHeader !== null, 'Header Retry-After retornado no 429');


// ─── 3. HEALTHCHECK & METADADOS ANYCAST ───
console.log('\n--- 3. Healthcheck & Metadados Anycast ---');

const dataHealth = await (await worker.fetch(new Request('https://api.test/api/cripto/health'), {})).json();
assert(dataHealth.ok === true, 'Health reporta status ok: true');
assert(dataHealth.servico.includes('Cripto Ticker Pro'), 'Nome do serviço validado');
assert(dataHealth.totalAtivosMonitorados >= 10, 'Mínimo de 10 ativos de ponta');


// ─── 4. LISTA DE ATIVOS & FILTROS ───
console.log('\n--- 4. Lista de Criptoativos & Filtro por Categoria ---');

const resAtivos = await worker.fetch(new Request('https://api.test/api/cripto/ativos'), {});
assert(resAtivos.status === 200, 'Endpoint /api/cripto/ativos responde 200');
const dataAtivos = await resAtivos.json();
assert(dataAtivos.totalAtivos >= 10, 'Total de ativos consistente');

const resStables = await worker.fetch(new Request('https://api.test/api/cripto/ativos?categoria=stablecoin'), {});
const dataStables = await resStables.json();
assert(dataStables.ativos.some(a => a.simbolo === 'USDT'), 'Tether USDT presente em stablecoins');


// ─── 5. COTAÇÃO DO BITCOIN (BTC) EM USD E BRL ───
console.log('\n--- 5. Cotação do Bitcoin (BTC) ---');

const resBtc = await worker.fetch(new Request('https://api.test/api/cripto/cotacao/btc'), {});
assert(resBtc.status === 200, 'Endpoint /api/cripto/cotacao/btc responde 200');
const dataBtc = await resBtc.json();
assert(dataBtc.ativo.simbolo === 'BTC', 'Símbolo BTC validado');
assert(dataBtc.ativo.precoUsd >= 50000, 'Preço USD consistente');
assert(dataBtc.ativo.precoBrl > dataBtc.ativo.precoUsd * 5, 'Preço convertido para BRL');
assert(dataBtc.ativo.sparkline7d.length === 7, 'Sparkline de 7 dias presente');


// ─── 6. COTAÇÃO DA SOLANA (SOL) E ETHEREUM (ETH) ───
console.log('\n--- 6. Cotação da Solana e Ethereum ---');

const resSol = await worker.fetch(new Request('https://api.test/api/cripto/cotacao/sol'), {});
const dataSol = await resSol.json();
assert(dataSol.ativo.simbolo === 'SOL', 'Solana identificada');

const resEth = await worker.fetch(new Request('https://api.test/api/cripto/cotacao/eth'), {});
const dataEth = await resEth.json();
assert(dataEth.ativo.simbolo === 'ETH', 'Ethereum identificado');


// ─── 7. REJEIÇÃO DE ATIVO INEXISTENTE ───
console.log('\n--- 7. Rejeição de Ativo Inexistente ---');

const resFake = await worker.fetch(new Request('https://api.test/api/cripto/cotacao/moeda-fantasma'), {});
assert(resFake.status === 404, 'Ativo inexistente retorna HTTP 404');


// ─── 8. GAS & NETWORK FEE TRACKER ───
console.log('\n--- 8. Gas & Network Fee Tracker ---');

const resGas = await worker.fetch(new Request('https://api.test/api/cripto/gas'), {});
assert(resGas.status === 200, 'Endpoint /api/cripto/gas responde 200');
const dataGas = await resGas.json();
assert(dataGas.ethereum.padrao.gwei > 0, 'Taxa padrão em Gwei calculada para Ethereum');
assert(dataGas.bitcoin.mediaPrioridade.satVb > 0, 'Taxa em sat/vB calculada para Bitcoin');
assert(dataGas.solana.taxaBase !== undefined, 'Taxa base da Solana reportada');


// ─── 9. CONVERSOR DE PARIDADES CRUZADAS ───
console.log('\n--- 9. Conversor de Paridades Cruzadas ---');

// 9.1 De BTC para BRL
const resConvBrl = await worker.fetch(new Request('https://api.test/api/cripto/converter?qtd=0.5&de=btc&para=brl'), {});
assert(resConvBrl.status === 200, 'Conversor BTC para BRL responde 200');
const dataConvBrl = await resConvBrl.json();
assert(dataConvBrl.resultadoTotal > 100000, '0.5 BTC convertido para BRL com precisão');

// 9.2 De SOL para BTC
const resConvSol = await worker.fetch(new Request('https://api.test/api/cripto/converter?qtd=10&de=sol&para=btc'), {});
const dataConvSol = await resConvSol.json();
assert(dataConvSol.taxaConversao > 0, 'Taxa de conversão cruzada SOL/BTC calculada');


// ─── 10. SENTIMENTO & FEAR AND GREED INDEX ───
console.log('\n--- 10. Sentimento de Mercado & Fear and Greed ---');

const resSent = await worker.fetch(new Request('https://api.test/api/cripto/sentimento'), {});
assert(resSent.status === 200, 'Endpoint /api/cripto/sentimento responde 200');
const dataSent = await resSent.json();
assert(dataSent.fearAndGreedIndex.valor >= 0 && dataSent.fearAndGreedIndex.valor <= 100, 'Valor do Fear & Greed entre 0 e 100');
assert(dataSent.dominanciaMercado.bitcoin !== undefined, 'Dominância do Bitcoin calculada');


// ─── 11. RENDERIZADOR VETORIAL SVG COM SPARKLINE ───
console.log('\n--- 11. Renderizador Vetorial SVG com Sparkline ---');

const resSvg = await worker.fetch(new Request('https://api.test/api/cripto/card/btc.svg'), {});
assert(resSvg.status === 200, 'Endpoint /api/cripto/card/btc.svg responde 200');
assert(resSvg.headers.get('Content-Type').includes('image/svg+xml'), 'Header image/svg+xml retornado');
const svgText = await resSvg.text();
assert(svgText.includes('CRIPTO TICKER PRO ANYCAST'), 'Marca dágua oficial no SVG');
assert(svgText.includes('Bitcoin'), 'Nome do Bitcoin no SVG');
assert(svgText.includes('<path d="M'), 'Sparkline desenhada como path SVG');


// ─── 12. SDK ISOMÓRFICO CRIPTOTICKERPRO ───
console.log('\n--- 12. Validação do SDK Isomórfico CriptoTickerPro ---');

const origFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const req = input instanceof Request ? input : new Request(input, init);
  return await worker.fetch(req, {});
};

CriptoTickerPro.configure({ baseUrl: 'https://api.test', apiKey: 'crp_master_sdk_key' });

const sdkHealth = await CriptoTickerPro.getHealth();
assert(sdkHealth.ok === true && sdkHealth.servico.includes('Cripto Ticker'), 'SDK getHealth funciona');

const sdkAtivos = await CriptoTickerPro.getAtivos();
assert(sdkAtivos.ok === true && sdkAtivos.totalAtivos >= 10, 'SDK getAtivos funciona');

const sdkBtc = await CriptoTickerPro.getCotacao('btc');
assert(sdkBtc.ok === true && sdkBtc.ativo.simbolo === 'BTC', 'SDK getCotacao funciona');

const sdkGas = await CriptoTickerPro.getGasTracker();
assert(sdkGas.ok === true && sdkGas.ethereum.padrao.gwei > 0, 'SDK getGasTracker funciona');

const sdkConv = await CriptoTickerPro.converter(1, 'ETH', 'BRL');
assert(sdkConv.ok === true && sdkConv.resultadoTotal > 0, 'SDK converter funciona');

const sdkSent = await CriptoTickerPro.getSentimento();
assert(sdkSent.ok === true && sdkSent.fearAndGreedIndex !== undefined, 'SDK getSentimento funciona');

const sdkSvgUrl = CriptoTickerPro.getCriptoCardSvgUrl('sol');
assert(sdkSvgUrl.includes('/card/sol.svg'), 'SDK getCriptoCardSvgUrl gera URL correta');

globalThis.fetch = origFetch;

console.log(`\n🎉 Todos os ${passCount} testes do Cripto Ticker Pro foram executados e APROVADOS com sucesso! Zero falhas (${failCount}).\n`);
