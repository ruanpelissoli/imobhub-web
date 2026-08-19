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

| Rota            | Tela                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| `/`             | Home — headline e barra de busca                                             |
| `/imoveis`      | Resultados (lê query params, ex.: `?q=curitiba&transaction_type=sale`)       |
| `/imoveis/[id]` | Detalhe do imóvel                                                            |
| qualquer outra  | 404                                                                          |

Os nomes dos query params seguem o contrato da `imobhub-api` (`SearchFilters` em
`src/lib/types.ts`): `q` para texto livre e `transaction_type` com os valores
`sale` ("Comprar") e `rent` ("Alugar").

A Home já navega para os Resultados, mas `/imoveis` e `/imoveis/[id]` ainda são
placeholders: exibem os parâmetros recebidos, sem consumo de dados reais.

## Acesso a dados

Todo consumo da API passa por `src/lib/api.ts`. Nenhum componente deve chamar
`fetch` diretamente para a `imobhub-api`. Veja `src/lib/CLAUDE.md`.
