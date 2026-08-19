# src/app — rotas e layout (Next.js App Router)

## Purpose

Esqueleto navegacional do ImobHub: o root layout compartilhado e as três rotas
principais do produto (`/`, `/imoveis`, `/imoveis/[id]`) mais a página 404.

A Home (`/`) e `/imoveis` já são telas de verdade: a Home navega para `/imoveis`
com os filtros na URL, e `/imoveis` lê esses filtros, chama `searchProperties` e
renderiza o grid de `PropertyCard` com contagem e paginação. `/imoveis/[id]`
segue **placeholder**, exibindo o `id` recebido; o detalhe com dados reais vem em
task seguinte e pendura nesse esqueleto — o conteúdo dessa página pode ser
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
- **Sem framework de CSS.** `globals.css` guarda reset, utilitárias
  (`.container`, `.brand`, `.nav-list`, `.page-title`, `.empty-state`) e as
  classes das telas mais antigas (`.search-bar*`, `.home-hero*`). Sem Tailwind ou
  styled-components. **Tela nova nasce com CSS Module co-locado**
  (`imoveis/page.module.css`), como os componentes.
- **`tokens.css` é a fonte única de cor, fonte, raio, sombra e espaçamento.**
  `globals.css` faz `@import './tokens.css'` na **primeira** linha (o CSS ignora
  `@import` que venha depois de qualquer regra; o pipeline do Next inlina o
  arquivo no topo do bundle). **Nenhum valor literal de cor, fonte, raio ou
  sombra fora de `tokens.css`** — `designTokens.test.ts` reprova o build se um
  escapar em `globals.css` ou `PropertyCard.module.css`. Literal só é legítimo
  para dimensão específica (`72rem` de container, `44px` de alvo de toque,
  `48rem` da media query). CSS Module não precisa de import: as custom
  properties de `:root` cascateiam para dentro do módulo.
- **`--color-surface` faz duplo papel como texto sobre o azul** (`.search-bar__submit`).
  A spec de tokens não define `--color-on-primary`; se um dia entrar tema escuro,
  esse é o primeiro ponto a virar token próprio.
- **Lógica testável fora do `.tsx`: `imoveis/searchFilters.ts`.** Componentes de
  servidor `async` não são triviais de renderizar em teste sem jsdom/plugin React;
  isolar parsing de query params, montagem de href de página e formatação numa
  função pura dá cobertura real dos edge cases sem arrastar infra de renderização.
  Substituiu o `searchParams.ts`/`toDisplayParams` do placeholder, que sumiu junto
  com ele.
- **Erro da API tratado com `try/catch` na página, não com `error.tsx`.** Em
  produção o Next sanitiza erros lançados no render de Server Component antes de
  chegarem ao `error.tsx`, então a `error.message` em português do `ApiError`
  **não** apareceria na UI. Com try/catch a mensagem certa é exibida; erro que não
  seja `ApiError` é re-lançado (bug de código não vira mensagem amigável). O
  "Tentar novamente" é o `RetryButton` client com `useRouter().refresh()`, já que
  não existe `reset()` do boundary.
- **Carregamento via `imoveis/loading.tsx`** (Suspense nativo do App Router), não
  `useState(isLoading)`.
- **Paginação com `next/link`, não `onClick`.** Um `<Link>` para a URL da outra
  página re-executa a busca no servidor e mantém o histórico do browser. O estado
  desabilitado é `<span aria-disabled>`, nunca um `<a>` sem `href` (seria focável
  como link ativo).

## Business logic

- Os query params da busca usam os nomes do contrato da API (`SearchFilters` em
  `src/lib/types.ts`). Nada de `?cidade=&precoMax=`: essa nomenclatura saiu com os
  links placeholder da Home e não deve voltar.
- `/imoveis` **nunca** valida nem exige query params: valor inválido é
  **descartado**, não gera erro. `?min_price=` / `?min_price=abc` / `?bedrooms=-1`
  / `?bedrooms=1.5` / `?transaction_type=xyz` simplesmente não viram filtro;
  `page` inválido ou `< 1` cai em `1`. Zero é valor válido (`?bedrooms=0`).
  Params desconhecidos (`?foo=bar`) são ignorados em silêncio. Sem params → busca
  sem filtros, não erro.
- Params repetidos (`?city=a&city=b`) chegam como array; campos escalares usam a
  **primeira** ocorrência. Ao trocar de página, porém, `buildPageHref` preserva
  **todos** os params originais (inclusive repetidos e desconhecidos) e sobrescreve
  só `page` — a URL do usuário não é "limpa" pelas nossas costas.
- `per_page`, `sort` e `amenities` existem em `SearchFilters` mas **não** são lidos
  da URL: o `per_page` efetivo é o que a API devolve na resposta.
- Lista vazia não é erro. `data: []` → "Nenhum imóvel encontrado…"; se a página
  corrente for `> 1` (pedido além do total, ver `src/lib/CLAUDE.md`), há um link de
  volta para a primeira página.
- A contagem vem de `response.total` com singular/plural ("1 imóvel encontrado" /
  "42 imóveis encontrados") e só aparece quando há resultado.
- O `<aside>` "Filtros" é **espaço reservado** para o painel lateral de outra task.
  Não implemente filtro nenhum ali sem que essa task chegue.
- `/imoveis/[id]` exibe o `id` cru, numérico ou não (`/imoveis/abc` renderiza
  normalmente). Não há checagem contra a API; imóvel inexistente será tratado na
  task de detalhe com dados reais, provavelmente com `notFound()` sobre o
  `ApiError` 404 de `getPropertyById`.

## Dependencies

- `next` (App Router, `next/link`, `next/navigation`), `react`, `react-dom`.
- Dados vêm exclusivamente de `src/lib/api.ts` — nenhuma rota deve chamar `fetch`
  direto para a `imobhub-api`. Veja `src/lib/CLAUDE.md`. Hoje só `/imoveis`
  consome a API (`searchProperties`).
- `/imoveis` reusa `toTransactionType`/`SEARCH_RESULTS_PATH` de
  `@/components/searchBarUrl` (módulo puro, sem `'use client'`) para não duplicar
  a regra de descarte que a barra de busca já implementa, e o `PropertyCard` com
  `headingLevel={2}` — o grid fica direto sob o `h1` da página.

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
- **`response.page`/`response.total_pages` são tratados defensivamente.** Se a API
  devolver algo não finito, a página corrente cai no `page` pedido e a paginação
  some. Resposta vazia costuma trazer `total_pages: 0`.
- O alias `@/*` nos **testes** vem de `vitest.config.mts` (`resolve.alias`), não do
  `tsconfig.json` — sem ele o Vitest não resolve `@/components/...` em import de
  valor. O arquivo é `.mts` de propósito: como `.ts` o Vite carrega a config em CJS
  e imprime o aviso de deprecação a cada `npm test`.
- **`var(--typo)` falha em silêncio.** Um nome de token errado não gera erro de
  build nem de lint — o CSS descarta a declaração e o elemento fica sem cor ou
  sem raio. É a falha mais provável ao mexer em estilo aqui, e a única coisa que
  a pega é `designTokens.test.ts`, que confere que todo `var(--x)` usado está
  definido em `tokens.css`.
- **Custom property não funciona dentro de `@media`.**
  `@media (min-width: var(--bp-tablet))` é inválido e ignorado sem aviso — por
  isso os breakpoints são bloco de comentário em `tokens.css`, não variáveis.
  A escala canônica é mobile ≤640px / tablet 641–1024px / desktop ≥1025px; as
  media queries de 48rem ainda não seguem essa escala (dívida consciente —
  realinhar muda o layout e é task própria).
- **`imoveis/page.module.css` ainda não usa tokens** — chegou em paralelo à task
  que criou `tokens.css` e ficou fora do escopo dela (por isso não está na lista
  `consumers` do `designTokens.test.ts`). Migrá-lo exige três tokens que a spec
  atual não tem: um cinza de superfície sutil (`#f7f8fa`/`#f2f4f7`, que devem
  colapsar num só) e o par de fundo/borda do bloco de erro
  (`#fdf3f3`/`#f0c2c2`/`#8c2f2f` — `--color-error` sozinho não cobre, é o tom de
  texto). Ao tocar nesse arquivo, migre-o e adicione-o ao teste.
