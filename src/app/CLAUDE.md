# src/app — rotas e layout (Next.js App Router)

## Purpose

Esqueleto navegacional do ImobHub: o root layout compartilhado e as três rotas
principais do produto (`/`, `/imoveis`, `/imoveis/[id]`) mais a página 404.

A Home (`/`) já é tela de verdade: headline mais a barra de busca, que navega para
`/imoveis` com os filtros na URL. `/imoveis` e `/imoveis/[id]` seguem
**placeholders**, provando que o roteamento e a leitura de parâmetros funcionam ao
exibir os valores recebidos. Busca com dados reais e detalhe do imóvel vêm em
tasks seguintes e penduram nesse esqueleto — o conteúdo dessas páginas pode ser
substituído sem cerimônia, a estrutura de rotas e o layout não.

## Key decisions

- **Server Components por padrão.** Nenhuma página é `'use client'`; a Home
  permanece de servidor e aninha o `SearchBar` client (`src/components/`). Só
  marque uma página como client quando a própria página tiver interatividade.
- **Header em um único lugar.** A marca "ImobHub" vive em `layout.tsx` e em lugar
  nenhum mais. Páginas nunca renderizam header próprio nem um `<main>` — o layout
  já fornece ambos, e aninhar `<main>` quebra a semântica.
- **`metadata.title` com `template`.** O layout define
  `{ default: 'ImobHub', template: '%s | ImobHub' }`, então cada página exporta só
  o título curto (`'Resultados'`) e o sufixo da marca vem de graça.
- **Sem framework de CSS.** `globals.css` traz reset mínimo, utilitárias
  (`.container`, `.brand`, `.nav-list`) e as classes de componente
  (`.search-bar*`, `.home-hero*`). Sem Tailwind ou styled-components. Componente
  novo nasce com CSS Module co-locado (ver `src/components/CLAUDE.md`);
  `globals.css` fica para reset e utilitários de layout.
- **`tokens.css` é a fonte única de cor, fonte, raio, sombra e espaçamento.**
  `globals.css` faz `@import './tokens.css'` na **primeira** linha (o CSS ignora
  `@import` que venha depois de qualquer regra; o pipeline do Next inlina o
  arquivo no topo do bundle). **Nenhum valor literal de cor, fonte, raio ou
  sombra em arquivo que não seja `tokens.css`** — `designTokens.test.ts` reprova
  o build se um escapar. Literal só é legítimo para dimensão específica
  (`72rem` de container, `44px` de alvo de toque, `48rem` da media query).
- **`--color-surface` faz duplo papel como texto sobre o azul** (`.search-bar__submit`).
  A spec de tokens não define `--color-on-primary`; se um dia entrar tema escuro,
  esse é o primeiro ponto a virar token próprio.
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
- `/imoveis/[id]` exibe o `id` cru, numérico ou não (`/imoveis/abc` renderiza
  normalmente). Não há checagem contra a API; imóvel inexistente será tratado na
  task de detalhe com dados reais, provavelmente com `notFound()` sobre o
  `ApiError` 404 de `getPropertyById`.

## Dependencies

- `next` (App Router, `next/link`), `react`, `react-dom`.
- Dados virão exclusivamente de `src/lib/api.ts` — nenhuma rota deve chamar
  `fetch` direto para a `imobhub-api`. Veja `src/lib/CLAUDE.md`. Hoje nenhuma
  rota consome a API ainda.

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
- **`var(--typo)` falha em silêncio.** Um nome de token errado não gera erro de
  build nem de lint — o CSS descarta a declaração e o elemento fica sem cor ou
  sem raio. É a falha mais provável ao mexer em estilo aqui, e a única coisa que
  a pega é `designTokens.test.ts`, que confere que todo `var(--x)` usado está
  definido em `tokens.css`.
- **Custom property não funciona dentro de `@media`.**
  `@media (min-width: var(--bp-tablet))` é inválido e ignorado sem aviso — por
  isso os breakpoints são bloco de comentário em `tokens.css`, não variáveis.
  A escala canônica é mobile ≤640px / tablet 641–1024px / desktop ≥1025px; a
  media query de 48rem da barra de busca ainda não segue essa escala (dívida
  consciente — realinhar muda o layout e é task própria).
