export interface CriptoAtivo {
  id: string;
  simbolo: string;
  nome: string;
  categoria: string;
  rank: number;
  precoUsd: number;
  precoBrl: number;
  precoFormatadoUsd: string;
  precoFormatadoBrl: string;
  variacao24hPct: number;
  variacao7dPct: number;
  marketCapUsd: number;
  volume24hUsd: number;
  athUsd: number;
  circulante: string;
  sparkline7d: number[];
}

export declare class CriptoTickerPro {
  static baseUrl: string;
  static apiKey: string;

  static configure(config?: { apiKey?: string; baseUrl?: string }): void;
  static getHealth(): Promise<{ ok: boolean; servico: string; versao: string; borda: string }>;
  static getAtivos(categoria?: string): Promise<{ ok: boolean; totalAtivos: number; ativos: CriptoAtivo[] }>;
  static getCotacao(simbolo: string): Promise<{ ok: boolean; ativo: CriptoAtivo }>;
  static getGasTracker(): Promise<{ ok: boolean; ethereum: any; bitcoin: any; solana: any }>;
  static converter(quantidade: number | string, de?: string, para?: string): Promise<{ ok: boolean; quantidadeDe: number; de: string; para: string; taxaConversao: number; resultadoTotal: number; resultadoFormatado: string }>;
  static getSentimento(): Promise<{ ok: boolean; fearAndGreedIndex: any; dominanciaMercado: any }>;
  static getCriptoCardSvgUrl(simbolo?: string): string;
}

export default CriptoTickerPro;
