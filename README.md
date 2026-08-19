# ImobHub Web

Aplicação web do ImobHub, construída com Next.js (App Router) e TypeScript.

## Requisitos

- Node.js 20+
- npm

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em http://localhost:3000.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento na porta 3000 |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção na porta 3000 |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals` + `next/typescript`) |

## Rotas

| Rota | Tela |
| --- | --- |
| `/` | Home |
| `/imoveis` | Resultados (lê query params, ex.: `?cidade=curitiba&precoMax=500000`) |
| `/imoveis/[id]` | Detalhe do imóvel |
| qualquer outra | 404 |

As telas ainda são placeholders navegacionais: não há busca, dados reais nem chamadas de API.
