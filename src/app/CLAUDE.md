# src/app — rotas e layout (Next.js App Router)

## Purpose

Esqueleto navegacional do ImobHub. Define o layout raiz compartilhado e as três rotas
principais do produto (`/`, `/imoveis`, `/imoveis/[id]`) mais a página 404. As telas são
placeholders: provam que o roteamento e a leitura de parâmetros funcionam. Não há busca,
dados reais nem chamadas de API aqui — isso entra nas tasks seguintes, que penduram nesse
esqueleto.

## Key decisions

- **App Router + Server Components.** Nenhuma página é `"use client"`. As telas não têm
  interatividade, e `searchParams`/`params` são resolvidos no servidor. Só marque uma
  página como client quando ela realmente precisar de estado ou eventos.
- **Header em um único lugar.** A marca "ImobHub" vive em `layout.tsx` e em lugar nenhum
  mais. Páginas nunca renderizam header próprio — duplicar quebra o requisito de fonte única.
- **`metadata.title` com `template`.** O layout define `{ default: "ImobHub", template: "%s | ImobHub" }`,
  então cada página só exporta o seu título curto (`"Resultados"`, `"Detalhe do imóvel"`)
  e o sufixo da marca vem de graça.
- **CSS puro em `globals.css`.** Design system, tema e tipografia são milestone posterior;
  trazer Tailwind agora seria decidir por uma task futura.

## Business logic

- `/imoveis` **nunca** valida nem exige query params. Sem params → estado vazio, não erro.
  Params desconhecidos (`?foo=bar`) são apenas listados, sem rejeição — filtragem real é
  responsabilidade da task de busca.
- `/imoveis/[id]` exibe o `id` cru, numérico ou não (`/imoveis/abc` renderiza normalmente).
  Não há checagem contra base de dados; imóvel inexistente será tratado na task de detalhe
  com dados reais, provavelmente via `notFound()`.

## Dependencies

- `next` (App Router, `next/link`), `react`, `react-dom`.
- Consumido por: todas as telas futuras do produto.

## Gotchas

- **No Next 15 `params` e `searchParams` são `Promise`.** As páginas precisam ser `async` e
  dar `await`. Tipar como objeto simples compila localmente mas quebra o `next build`.
- **Navegação interna sempre com `next/link`.** Um `<a href="/...">` puro causa full page
  reload e viola o requisito de client-side routing.
- **`not-found.tsx` na raiz de `src/app`** cobre qualquer rota não mapeada automaticamente.
- `globals.css` tem `overflow-x: hidden` no `html, body` como rede de segurança para o
  requisito de 375px — é rede, não solução. Se algo estourar horizontalmente, corrija o
  elemento (os valores de parâmetros usam `overflow-wrap: anywhere` por isso).
- Links e a marca têm `min-height: 44px` para alvo de toque em mobile; manter ao editar.
