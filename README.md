# imobhub-web

Frontend do ImobHub — busca de imóveis agregada de múltiplas imobiliárias.
Next.js 15 (App Router) + TypeScript.

## Requisitos

- Node.js >= 18.18
- A [`imobhub-api`](../imobhub-api) rodando localmente (porta 8080 por padrão)

## Como rodar

```bash
cp .env.example .env
npm install
npm run dev
```

A aplicação sobe em <http://localhost:3000>.

## Variáveis de ambiente

| Variável              | Padrão                  | Descrição                 |
| --------------------- | ----------------------- | ------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Base URL da `imobhub-api` |

Se `NEXT_PUBLIC_API_URL` não estiver definida, o cliente HTTP usa
`http://localhost:8080` como fallback — o build nunca falha por causa dela.

## Scripts

| Script              | O que faz                   |
| ------------------- | --------------------------- |
| `npm run dev`       | Servidor de desenvolvimento |
| `npm run build`     | Build de produção           |
| `npm start`         | Serve o build de produção   |
| `npm run lint`      | ESLint                      |
| `npm run typecheck` | `tsc --noEmit`              |
| `npm test`          | Testes unitários (Vitest)   |

## Rotas

| Rota            | Tela                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `/`             | Home — headline e barra de busca                                       |
| `/imoveis`      | Resultados — painel de filtros e grid de imóveis da API com paginação   |
| `/imoveis/[id]` | Detalhe do imóvel                                                      |
| qualquer outra  | 404                                                                    |

Os nomes dos query params seguem o contrato da `imobhub-api` (`SearchFilters` em
`src/lib/types.ts`). `/imoveis` lê `q`, `transaction_type` (`sale` para "Comprar",
`rent` para "Alugar"), `property_type`, `min_price`, `max_price`, `bedrooms`,
`bathrooms`, `parking_spots`, `min_area`, `city`, `neighborhood` e `page`. Valor
inválido é descartado silenciosamente — a busca nunca falha por causa da URL.

O painel lateral de `/imoveis` sincroniza bidirecionalmente com esses params: ele
nasce pré-preenchido com os valores válidos da URL, "Aplicar filtros" reescreve os
params a partir do formulário (voltando para a primeira página e preservando `q`),
e "Limpar filtros" os remove. A URL continua sendo o que dispara a nova busca.

`/imoveis/[id]` ainda é placeholder: exibe o `id` recebido, sem consumo de dados
reais.

## Acesso a dados

Todo consumo da API passa por `src/lib/api.ts`. Nenhum componente deve chamar
`fetch` diretamente para a `imobhub-api`. Veja `src/lib/CLAUDE.md`.
