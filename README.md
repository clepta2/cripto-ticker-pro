# 🪙 Cripto Ticker Pro API • Cotações Cripto & Gas Tracker Anycast

> **API e SDK Oficial de Alta Performance na Borda Cloudflare Anycast (<2ms) para Cotações em Tempo Real de Criptoativos em USD e BRL, Gas Tracker (Ethereum, Bitcoin e Solana), Paridades Cruzadas e Sparklines Vetoriais SVG.**

[![Status](https://img.shields.io/badge/Status-Produção%20Tier--1-success.svg)](#)
[![Infra](https://img.shields.io/badge/Infra-Cloudflare%20Workers%20Anycast-orange.svg)](#)
[![Latência](https://img.shields.io/badge/Latência-%3C2ms%20RAM%20Edge-blue.svg)](#)
[![Auth](https://img.shields.io/badge/Auth-RFC%206750%20Bearer%20Token-emerald.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 🧭 Visão Geral

O **Cripto Ticker Pro** foi concebido a partir do desmembramento e hiper-especialização do módulo cripto do `cotacoes-pro`:

1. **Cotações em Tempo Real (USD & BRL):** Preços, market cap, volume 24h, variação 24h/7d e ATH (máxima histórica) de 60+ criptoativos principais.
2. **Gas & Network Fee Tracker:** Taxas de rede em tempo real para Ethereum (Gwei lento, padrão e rápido), Bitcoin (sat/vB e tempo estimado em blocos) e Solana.
3. **Conversor Universal de Paridades Cruzadas:** Conversão instantânea de Cripto ⇄ Fiat (USD, BRL, EUR) e Cripto ⇄ Cripto (BTC/ETH, SOL/BTC).
4. **Sentimento de Mercado & Dominância:** Índice Fear and Greed diário e cálculo percentual de dominância de mercado (BTC.D e ETH.D).
5. **Cards Vetoriais SVG com Sparklines de 7 Dias:** Gráficos vetoriais de linha renderizados na borda Anycast prontos para embeds em sites e dashboards financeiros.

---

## 📦 Matriz de Planos & Vazão Contínua

| Plano | Limite RPM | Cota Diária | Prefixo de Chave | Latência |
|---|---|---|---|---|
| **Free / Sandbox** | 30 RPM | 500 req/dia | `crp_free_` | &lt; 5ms Anycast |
| **Starter (24/7)** | 60 RPM | 86.400 req/dia (1 req/s) | `crp_start_` | &lt; 2ms Anycast |
| **Pro** | 300 RPM | 250.000 req/dia (5 req/s) | `crp_pro_` | &lt; 1ms Anycast |
| **Business** | 1.200 RPM | 1.000.000 req/dia (20 req/s) | `crp_biz_` | &lt; 1ms Anycast |
| **Master Admin** | 3.000 RPM | Ilimitada (Bypass) | `crp_master_` | &lt; 1ms Anycast |

---

## 🚀 Endpoints REST

- `GET /api/cripto/ativos`: Lista de todos os criptoativos (com filtro `?categoria=Layer 1|DeFi|Stablecoin`).
- `GET /api/cripto/cotacao/:simbolo`: Cotação completa em USD e BRL de um ativo específico (ex: `btc`, `eth`, `sol`).
- `GET /api/cripto/gas`: Monitor de taxas de rede e gas de Ethereum, Bitcoin e Solana.
- `GET /api/cripto/converter?qtd=1&de=btc&para=brl`: Conversão de paridades cruzadas.
- `GET /api/cripto/sentimento`: Fear & Greed Index e dominância de mercado.
- `GET /api/cripto/card/:simbolo.svg`: Card vetorial SVG com sparkline de 7 dias.

---

## 💻 Uso do SDK Isomórfico

```javascript
import { CriptoTickerPro } from 'cripto-ticker-pro';

// 1. Configurar cliente
CriptoTickerPro.configure({
  apiKey: 'pnt_live_89f2a7...',
  baseUrl: 'https://cripto.ponte.ozpro.com.br'
});

// 2. Consultar Bitcoin
const btc = await CriptoTickerPro.getCotacao('btc');
console.log('Preço USD:', btc.ativo.precoFormatadoUsd);
console.log('Preço BRL:', btc.ativo.precoFormatadoBrl);

// 3. Consultar Gas da rede
const gas = await CriptoTickerPro.getGasTracker();
console.log('Ethereum Gas Padrão:', gas.ethereum.padrao.gwei, 'Gwei');
```

---

## 📄 Licença

Distribuído sob licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
