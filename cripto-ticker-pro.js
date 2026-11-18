/**
 * cripto-ticker-pro.js
 * SDK Oficial para Node.js, Browser e Edge Runtimes
 * Cripto Ticker Pro API — Anycast Crypto Price & Gas Engine
 * 
 * @license MIT
 * @see https://github.com/clepta2/cripto-ticker-pro
 */

export class CriptoTickerPro {
  static baseUrl = '';
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
      'User-Agent': 'CriptoTickerPro-SDK/2.0.0'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }

  static async _fetchJson(caminho) {
    if (!this.baseUrl) {
      throw new Error('CriptoTickerPro: configure a URL base via CriptoTickerPro.configure({ baseUrl: "..." }).');
    }
    const resp = await fetch(`${this.baseUrl}${caminho}`, {
      method: 'GET',
      headers: this._getHeaders()
    });
    const dados = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = dados?.mensagem || dados?.erro || `HTTP ${resp.status}`;
      const err = new Error(`CriptoTickerPro: ${msg}`);
      err.status = resp.status;
      err.dados = dados;
      throw err;
    }
    return dados;
  }

  /**
   * Consulta a telemetria e integridade do cluster Anycast
   * @returns {Promise<Object>}
   */
  static async getHealth() {
    return this._fetchJson('/api/cripto/health');
  }

  /**
   * Lista as fontes oficiais integradas e termos de uso
   * @returns {Promise<Object>}
   */
  static async getFontes() {
    return this._fetchJson('/api/cripto/fontes');
  }

  /**
   * Lista todos os criptoativos com filtros por categoria
   * @param {string} [categoria] - Ex: 'Layer 1', 'Stablecoin'
   * @returns {Promise<Object>}
   */
  static async getAtivos(categoria) {
    const q = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    return this._fetchJson(`/api/cripto/ativos${q}`);
  }

  /**
   * Consulta a cotação de um criptoativo específico em USD e BRL (com câmbio PTAX)
   * @param {string} simbolo - Ex: 'btc', 'eth', 'sol'
   * @returns {Promise<Object>}
   */
  static async getCotacao(simbolo) {
    return this._fetchJson(`/api/cripto/cotacao/${encodeURIComponent(simbolo)}`);
  }

  /**
   * Obtém os custos de Gas e taxas de rede em tempo real (Ethereum e Bitcoin)
   * @returns {Promise<Object>}
   */
  static async getGasTracker() {
    return this._fetchJson('/api/cripto/gas');
  }

  /**
   * Converte valores entre paridades cruzadas (Cripto ⇄ Fiat ou Cripto ⇄ Cripto)
   * @param {number|string} quantidade 
   * @param {string} de - Ex: 'BTC', 'ETH'
   * @param {string} para - Ex: 'BRL', 'USD', 'EUR'
   * @returns {Promise<Object>}
   */
  static async converter(quantidade, de = 'BTC', para = 'BRL') {
    return this._fetchJson(`/api/cripto/converter?qtd=${quantidade}&de=${encodeURIComponent(de)}&para=${encodeURIComponent(para)}`);
  }

  /**
   * Obtém o índice de sentimento (Fear and Greed) e dominância de mercado
   * @returns {Promise<Object>}
   */
  static async getSentimento() {
    return this._fetchJson('/api/cripto/sentimento');
  }

  /**
   * Obtém a URL do Card SVG com Ticker e Sparkline 7d
   * @param {string} simbolo - Ex: 'btc', 'eth', 'sol'
   * @returns {string}
   */
  static getCriptoCardSvgUrl(simbolo = 'btc') {
    const base = this.baseUrl || '';
    return `${base}/api/cripto/card/${encodeURIComponent(simbolo)}.svg`;
  }
}

export default CriptoTickerPro;