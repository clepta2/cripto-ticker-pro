# 📈 Cripto Ticker Pro API • Inteligência e Preços de Criptoativos Anycast

> **API e SDK de Criptoativos alimentada por fontes reais (CoinGecko com Câmbio Oficial BCB PTAX, Alternative.me Fear & Greed, Mempool.space e Ethereum RPC). Zero dados inventados na borda Cloudflare Anycast.**

[![Status](https://img.shields.io/badge/Status-Produção%20Tier--1-success.svg)](#)
[![Infra](https://img.shields.io/badge/Infra-Cloudflare%20Workers%20Anycast-orange.svg)](#)
[![Fontes](https://img.shields.io/badge/Fontes-Reais%20%2B%20Cache%20Edge-blue.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 🧭 Visão Geral e Transparência de Dados

O **Cripto Ticker Pro** opera com uma política estrita de **zero dados inventados**:
1. **Cotações Reais de Mercado**: Preços em USD obtidos diretamente via API oficial da CoinGecko (suporta chaves de plano Demo ou Pro).
2. **Câmbio Oficial do Banco Central (PTAX)**: Conversão para Real (BRL) calculada usando o boletim mais recente de fechamento/intradiário da PTAX do BCB.
3. **Sentimento de Mercado (Fear & Greed Index)**: Obtido diretamente da API da Alternative.me, calculado exclusivamente para Bitcoin, com atribuição explícita.
4. **Taxas e Gas Tracker**: Taxas de mineração recomendadas de Bitcoin via Mempool.space e preço de gas Ethereum em tempo real via JSON-RPC `eth_gasPrice` (PublicNode).
5. **Zero Fallback Falso**: Se uma fonte externa estiver temporariamente indisponível, a API devolve o último valor em cache marcado como `desatualizado: true` com a `idadeSegundos`. Se não houver valor prévio, responde HTTP 503 com erro claro — **nunca inventa números**.

---

## 📊 Matriz de Fontes e Status

| Dado / Endpoint | Provedor Oficial | Termos / Licença | Cache TTL | Atribuição Obrigatória |
|---|---|---|---|---|
| Cotações Cripto & Sparklines | CoinGecko (Demo ou Pro) | Requer plano/chave oficial | 120s | `Dados: CoinGecko` |
| Câmbio USD/BRL e EUR/BRL | Banco Central do Brasil (PTAX) | Dados Abertos Governamentais | 600s | `Dados de câmbio: Banco Central do Brasil (PTAX)` |
| Fear & Greed Index | Alternative.me | Uso comercial permitido com atribuição | 600s | `Fonte: alternative.me — Crypto Fear & Greed Index` |
| Taxas de Rede Bitcoin | Mempool.space | Projeto Open Source | 60s | `Taxas Bitcoin: mempool.space` |
| Gas Ethereum | PublicNode Ethereum RPC | JSON-RPC público (eth_gasPrice) | 30s | `Gas Ethereum: PublicNode JSON-RPC` |

---

## 🔑 Configuração de Segredos (Zero Hardcoded Secrets)

Para habilitar a consulta de preços via CoinGecko no Cloudflare Worker:

```bash
# Configure no ambiente de produção do Cloudflare Workers:
npx wrangler secret put COINGECKO_API_KEY

# Opcional (plano demo é padrão; use pro se assinar plano comercial):
# npx wrangler secret put COINGECKO_API_PLAN
```

Em ambiente local de desenvolvimento, crie um arquivo `.dev.vars` (já listado no `.gitignore`):
```ini
COINGECKO_API_KEY=sua_chave_aqui
COINGECKO_API_PLAN=demo
```

---

## 🚀 Endpoints REST

- `GET /api/cripto/health`: Telemetria, lista de ativos e status do cluster.
- `GET /api/cripto/fontes`: Transparência completa de todas as fontes integradas e termos.
- `GET /api/cripto/ativos`: Cotações de todos os 12 ativos com conversão para Real (PTAX).
- `GET /api/cripto/cotacao/:simbolo`: Detalhes de um ativo específico (ex: `btc`, `eth`, `sol`).
- `GET /api/cripto/gas`: Monitor de taxas Bitcoin (sat/vB) e Ethereum (Gwei).
- `GET /api/cripto/sentimento`: Fear & Greed Index oficial e dominância global.
- `GET /api/cripto/converter?qtd=1&de=btc&para=brl`: Conversão com paridade real e PTAX.
- `GET /api/cripto/card/:simbolo.svg`: Card vetorial SVG com ticker e sparkline 7D amostrada.

---

## 🧪 Testes Automatizados (100% Offline)

A suíte de testes não realiza chamadas de rede externas e audita o código-fonte para garantir que nenhum preço ou taxa constante permaneça no código de produção:

```bash
node test.js
```

---

## 📄 Licença

Distribuído sob licença **MIT**.