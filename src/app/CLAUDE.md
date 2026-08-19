# src/app — rotas e layout (Next.js App Router)

## Purpose

Esqueleto navegacional do ImobHub: o root layout compartilhado e as três rotas
principais do produto (`/`, `/imoveis`, `/imoveis/[id]`) mais a página 404.

A Home (`/`) já é tela de verdade: headline mais a barra de busca, que navega para
`/imoveis` com os filtros na URL. `/imoveis/[id]` também: consome a API de
verdade, com galeria, dados canônicos e as fronteiras `loading`/`error`/`notFound`
(ver `imoveis/[id]/CLAUDE.md`). Só `/imoveis` segue **placeholder**, exibindo os
query params recebidos. A busca com dados reais vem em task seguinte e pendura
nesse esqueleto — o conteúdo dessa página pode ser substituído sem cerimônia, a
estrutura de rotas e o layout não.

## Key decisions

- **Server Components por padrão.** Nenhuma página é `'use client'`; a Home
  permanece de servidor e aninha o `SearchBar` client, e o detalhe aninha o
  `PropertyGallery` (`src/components/`). Só marque uma página como client quando a
  própria página tiver interatividade.
- **Carregamento via `loading.tsx`, erro via `error.tsx`.** Rotas que buscam dados
  não usam estado de `isLoading` no cliente: a busca é no servidor e o Suspense da
  rota cobre isso. `error.tsx` é `'use client'` por exigência do Next.
- **Header em um único lugar.** A marca "ImobHub" vive em `layout.tsx` e em lugar
  nenhum mais. Páginas nunca renderizam header próprio nem um `<main>` — o layout
  já fornece ambos, e aninhar `<main>` quebra a semântica.
- **`metadata.title` com `template`.** O layout define
  `{ default: 'ImobHub', template: '%s | ImobHub' }`, então cada página exporta só
  o título curto (`'Resultados'`) e o sufixo da marca vem de graça.
- **Sem framework de CSS.** Nem Tailwind nem styled-components. `globals.css`
  guarda o reset mínimo, as utilitárias (`.container`, `.brand`, `.nav-list`) e as
  classes de componente antigas (`.search-bar*`, `.home-hero*`). **Estilo novo
  nasce em CSS Module co-locado** (ver `src/components/CLAUDE.md`) — `globals.css`
  fica só para reset e utilitários.
- **`toDisplayParams` extraído para `imoveis/searchParams.ts`.** Componentes de
  servidor `async` não são triviais de renderizar em teste sem jsdom/plugin React;
  isolar a normalização dos query params numa função pura dá cobertura real dos
  edge cases sem arrastar infra de teste de renderização.

## Business logic

- Os query params da busca usam os nomes do contrato da API (`SearchFilters` em
  `src/lib/types.ts`): `q` e `transaction_type` (`sale` | `rent`). Os antigos
  `?cidade=&precoMax=` dos links placeholder da Home eram descartáveis e saíram
  junto com ela; não ressuscite essa nomenclatura.
- `/imoveis` **nunca** valida nem exige query params. Sem params → estado vazio,
  não erro. Params desconhecidos (`?foo=bar`) são apenas exibidos, sem rejeição —
  filtragem real é responsabilidade da task de busca.
- Params repetidos (`?amenities=a&amenities=b`) chegam como array e são exibidos
  unidos por vírgula. Só `undefined` é descartado; string vazia é valor válido.
- `/imoveis/[id]` busca o imóvel na API. ID inexistente vira `notFound()` a partir
  do `ApiError` com `status === 404` de `getPropertyById`; demais falhas caem no
  `error.tsx` da própria rota. Detalhes em `imoveis/[id]/CLAUDE.md`.

## Dependencies

- `next` (App Router, `next/link`), `react`, `react-dom`.
- Dados vêm exclusivamente de `src/lib/api.ts` — nenhuma rota deve chamar `fetch`
  direto para a `imobhub-api`. Veja `src/lib/CLAUDE.md`. Hoje só `/imoveis/[id]`
  consome a API.

## Gotchas

- **No Next 15 `params` e `searchParams` são `Promise`.** As páginas precisam ser
  `async` e dar `await`. Tipar como objeto simples compila no editor mas quebra o
  `next build`.
- **Navegação interna sempre com `next/link`.** Um `<a href="/...">` puro causa
  full page reload e viola o requisito de client-side routing.
- **`not-found.tsx` na raiz de `src/app`** cobre qualquer rota não mapeada
  automaticamente.
- `globals.css` tem `overflow-x: hidden` no `html, body` como rede de segurança
  para o requisito de 375px — é rede, não solução. Se algo estourar
  horizontalmente, corrija o elemento (valores de parâmetros usam
  `overflow-wrap: anywhere` por isso).
- O reset define `a { color: inherit }`; links que precisam parecer link recebem
  cor explícita via `.nav-list a`. Links e a marca têm `min-height: 44px` para
  alvo de toque em mobile — manter ao editar.
- `layout.tsx` fixa `lang="pt-BR"`; toda a UI é em português.
