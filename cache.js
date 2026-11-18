/**
 * cache.js — Acesso a fontes externas com cache em duas camadas (Cache API da borda + memória),
 * deduplicação de requisições concorrentes (single-flight) e devolução de dado desatualizado
 * (nunca inventado) quando a fonte falha.
 *
 * @license MIT
 */

export const TIMEOUT_FONTE_MS = 5000;
export const RETENCAO_MAXIMA_SEGUNDOS = 86400;
export const ESPERA_APOS_FALHA_PADRAO_SEGUNDOS = 5;
export const ESPERA_APOS_FALHA_MAXIMA_SEGUNDOS = 60;
const CHAVE_BASE_BORDA = 'https://cache.ponte.internal/';

/** Falha de uma fonte externa (ou de configuração necessária para consultá-la). */
export class ErroFonte extends Error {
  constructor({ codigo = 'FONTE_INDISPONIVEL', fonte, detalhe, mensagem, httpStatus = null, retryAfterSegundos = null }) {
    super(mensagem || `${fonte}: ${detalhe}`);
    this.name = 'ErroFonte';
    this.codigo = codigo;
    this.fonte = fonte;
    this.detalhe = detalhe || null;
    this.httpStatus = httpStatus;
    this.retryAfterSegundos = retryAfterSegundos;
  }
}

/** Erro de validação da requisição do cliente (HTTP 4xx). */
export class ErroRequisicao extends Error {
  constructor(status, codigo, mensagem, extra = {}) {
    super(mensagem);
    this.name = 'ErroRequisicao';
    this.status = status;
    this.codigo = codigo;
    this.extra = extra;
  }
}

const memoria = new Map();
const voos = new Map();
const esperas = new Map();

export function resetarCaches() {
  memoria.clear();
  voos.clear();
  esperas.clear();
}

function lerRetryAfter(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? Math.ceil(n) : null;
}

/** GET/POST JSON com timeout de 5 s e erros normalizados (sem vazar chaves nem corpo). */
export async function buscarJson(url, { fonte, metodo = 'GET', headers = {}, corpo, fetchImpl } = {}) {
  const f = fetchImpl || globalThis.fetch;
  let resp;
  try {
    resp = await f(url, {
      method: metodo,
      headers,
      body: corpo,
      signal: AbortSignal.timeout(TIMEOUT_FONTE_MS)
    });
  } catch (e) {
    const timeout = e && (e.name === 'TimeoutError' || e.name === 'AbortError');
    throw new ErroFonte({ fonte, detalhe: timeout ? `tempo esgotado (${TIMEOUT_FONTE_MS} ms)` : 'falha de rede' });
  }

  if (resp.status === 429) {
    throw new ErroFonte({
      fonte,
      detalhe: 'HTTP 429 (limite de requisições do provedor)',
      httpStatus: 429,
      retryAfterSegundos: lerRetryAfter(resp.headers?.get?.('Retry-After'))
    });
  }
  if (!resp.ok) {
    throw new ErroFonte({
      fonte,
      detalhe: `HTTP ${resp.status}`,
      httpStatus: resp.status,
      retryAfterSegundos: resp.status >= 500 ? lerRetryAfter(resp.headers?.get?.('Retry-After')) : null
    });
  }
  try {
    return await resp.json();
  } catch {
    throw new ErroFonte({ fonte, detalhe: 'resposta não é um JSON válido', httpStatus: resp.status });
  }
}

function cacheBorda() {
  try {
    return typeof caches !== 'undefined' && caches.default ? caches.default : null;
  } catch {
    return null;
  }
}

async function lerBorda(nome) {
  const c = cacheBorda();
  if (!c) return null;
  try {
    const r = await c.match(new Request(CHAVE_BASE_BORDA + nome));
    if (!r) return null;
    const j = await r.json();
    if (j && typeof j.buscadoEm === 'number' && 'dados' in j) return j;
  } catch { /* cache indisponível: segue para a fonte */ }
  return null;
}

function gravarBorda(nome, entrada, contexto) {
  const c = cacheBorda();
  if (!c) return;
  try {
    const p = c.put(
      new Request(CHAVE_BASE_BORDA + nome),
      new Response(JSON.stringify(entrada), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${RETENCAO_MAXIMA_SEGUNDOS}`
        }
      })
    ).catch(() => {});
    if (contexto?.waitUntil) contexto.waitUntil(p);
  } catch { /* gravação é melhor esforço */ }
}

function montar(entrada, origem, desatualizado) {
  return {
    dados: entrada.dados,
    buscadoEm: entrada.buscadoEm,
    buscadoEmIso: new Date(entrada.buscadoEm).toISOString(),
    idadeSegundos: Math.max(0, Math.floor((Date.now() - entrada.buscadoEm) / 1000)),
    desatualizado,
    origem
  };
}

/** Consulta o cache sem acionar a fonte (memória e depois borda). Retorna null se não houver dado. */
export async function espiarCache(nome, ttlSegundos) {
  const agora = Date.now();
  const valida = (e) => e && agora - e.buscadoEm < RETENCAO_MAXIMA_SEGUNDOS * 1000;
  let entrada = valida(memoria.get(nome)) ? memoria.get(nome) : null;
  let origem = 'memoria';
  if (!entrada) {
    const borda = await lerBorda(nome);
    if (valida(borda)) {
      entrada = { dados: borda.dados, buscadoEm: borda.buscadoEm };
      origem = 'borda';
    }
  }
  if (!entrada) return null;
  return montar(entrada, origem, agora - entrada.buscadoEm >= ttlSegundos * 1000);
}

function normalizarErro(e, nome) {
  return e instanceof ErroFonte
    ? e
    : new ErroFonte({ fonte: nome, detalhe: 'resposta em formato inesperado' });
}

/**
 * Devolve o dado de `nome` respeitando o TTL. Se a fonte falhar, devolve o último valor
 * conhecido (até 24 h) marcado como desatualizado; sem valor algum, lança ErroFonte.
 */
export async function lerComCache(nome, ttlSegundos, buscar, contexto = {}) {
  const agora = Date.now();
  const retencaoMs = RETENCAO_MAXIMA_SEGUNDOS * 1000;
  const valida = (e) => e && agora - e.buscadoEm < retencaoMs;

  let entrada = valida(memoria.get(nome)) ? memoria.get(nome) : null;
  if (entrada && agora - entrada.buscadoEm < ttlSegundos * 1000) return montar(entrada, 'memoria', false);

  const borda = await lerBorda(nome);
  if (valida(borda) && (!entrada || borda.buscadoEm > entrada.buscadoEm)) {
    entrada = { dados: borda.dados, buscadoEm: borda.buscadoEm };
    memoria.set(nome, entrada);
    if (agora - entrada.buscadoEm < ttlSegundos * 1000) return montar(entrada, 'borda', false);
  }

  const falhar = (erro) => {
    if (entrada) return montar(entrada, entrada === memoria.get(nome) ? 'memoria' : 'borda', true);
    throw erro;
  };

  const espera = esperas.get(nome);
  if (espera && espera.ate > agora) return falhar(espera.erro);

  let voo = voos.get(nome);
  if (!voo) {
    voo = (async () => {
      try {
        const dados = await buscar();
        const nova = { dados, buscadoEm: Date.now() };
        memoria.set(nome, nova);
        esperas.delete(nome);
        gravarBorda(nome, nova, contexto);
        return nova;
      } finally {
        voos.delete(nome);
      }
    })();
    voos.set(nome, voo);
  }

  try {
    return montar(await voo, 'rede', false);
  } catch (e) {
    const erro = normalizarErro(e, nome);
    const esperaSeg = Math.min(
      erro.retryAfterSegundos ?? ESPERA_APOS_FALHA_PADRAO_SEGUNDOS,
      ESPERA_APOS_FALHA_MAXIMA_SEGUNDOS
    );
    esperas.set(nome, { ate: Date.now() + esperaSeg * 1000, erro });
    return falhar(erro);
  }
}
