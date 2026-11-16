/**
 * cripto-ticker-pro.js
 * SDK Oficial para Node.js, Browser e Edge Runtimes
 * Cripto Ticker Pro API — Anycast Crypto Price & Gas Engine
 * 
 * @license MIT
 * @see https://github.com/clepta2/cripto-ticker-pro
 */

export class CriptoTickerPro {
  static baseUrl = 'https://cripto.ponte.ozpro.com.br';
  static apiKey = '';

  /**
   * Configura o cliente global com URL base e chave de autenticação
   * @param {Object} config - { apiKey?: string, baseUrl?: string }
   */
  static configure(config = {}) {
    if (config.baseUrl) this.baseUrl = config.baseUrl.replace(/\/$/, '');
    if (config.apiKey) this.apiKey = config.apiKey;
  }

  /**
   * Headers padrão para requisição com autenticação RFC 6750
   * @private
   */
  static _getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'CriptoTickerPro-SDK/1.0.0'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }

  /**
   * Consulta a telemetria e integridade do cluster Anycast
   * @returns {Promise<Object>}
   */
  static async getHealth() {
    const resp = await fetch(`${this.baseUrl}/api/cripto/health`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao consultar healthcheck: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Lista todos os criptoativos com filtros por categoria
   * @param {string} [categoria] - Ex: 'Layer 1', 'DeFi', 'Stablecoin'
   * @returns {Promise<Object>}
   */
  static async getAtivos(categoria) {
    const q = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    const resp = await fetch(`${this.baseUrl}/api/cripto/ativos${q}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao listar ativos: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Consulta a cotação de um criptoativo específico em USD e BRL
   * @param {string} simbolo - Ex: 'btc', 'eth', 'sol'
   * @returns {Promise<Object>}
   */
  static async getCotacao(simbolo) {
    const resp = await fetch(`${this.baseUrl}/api/cripto/cotacao/${encodeURIComponent(simbolo)}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao consultar cotação (${simbolo}): HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém os custos de Gas e taxas de rede em tempo real (Ethereum, Bitcoin, Solana)
   * @returns {Promise<Object>}
   */
  static async getGasTracker() {
    const resp = await fetch(`${this.baseUrl}/api/cripto/gas`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter gas tracker: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Converte valores entre paridades cruzadas (Cripto ⇄ Fiat ou Cripto ⇄ Cripto)
   * @param {number|string} quantidade 
   * @param {string} de - Ex: 'BTC', 'ETH'
   * @param {string} para - Ex: 'BRL', 'USD', 'SOL'
   * @returns {Promise<Object>}
   */
  static async converter(quantidade, de = 'BTC', para = 'BRL') {
    const resp = await fetch(`${this.baseUrl}/api/cripto/converter?qtd=${quantidade}&de=${encodeURIComponent(de)}&para=${encodeURIComponent(para)}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao converter paridade: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém o índice de sentimento (Fear and Greed) e dominância de mercado
   * @returns {Promise<Object>}
   */
  static async getSentimento() {
    const resp = await fetch(`${this.baseUrl}/api/cripto/sentimento`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    if (!resp.ok) throw new Error(`Erro ao obter sentimento: HTTP ${resp.status}`);
    return await resp.json();
  }

  /**
   * Obtém a URL do Card SVG com Ticker e Sparkline 7d
   * @param {string} simbolo - Ex: 'btc', 'eth', 'sol'
   * @returns {string}
   */
  static getCriptoCardSvgUrl(simbolo = 'btc') {
    return `${this.baseUrl}/api/cripto/card/${encodeURIComponent(simbolo)}.svg`;
  }
}

export default CriptoTickerPro;
