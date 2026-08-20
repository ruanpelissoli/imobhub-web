# src/app — rotas e layout (Next.js App Router)

## Purpose

Esqueleto navegacional do ImobHub: o root layout compartilhado e as três rotas
principais do produto (`/`, `/imoveis`, `/imoveis/[id]`) mais a página 404.

As três rotas já são telas de verdade. A Home navega para `/imoveis` com os
filtros na URL e, abaixo do `SearchBar`, exibe a seção "Imóveis em destaque"
(`FeaturedProperties.tsx`), que busca até 6 imóveis na API — a Home deixou de ser
estática; `/imoveis` lê esses filtros, chama `searchProperties`, renderiza
o grid de `PropertyCard` com contagem e paginação e oferece o `FilterPanel`
lateral para refinar a busca; `/imoveis/[id]` chama `getPropertyById` e mostra
galeria e dados canônicos, com as fronteiras `loading`/`error`/`notFound` (ver
`imoveis/[id]/CLAUDE.md`).

## Key decisions

- **Server Components por padrão.** Nenhuma página é `'use client'`; a Home
  permanece de servidor e aninha o `SearchBar` client, e o detalhe aninha o
  `PropertyGallery` (`src/components/`). Só marque uma página como client quando a
  própria página tiver interatividade.
- **Carregamento via `loading.tsx`, erro via `error.tsx`.** Rotas que buscam dados
  não usam estado de `isLoading` no cliente: a busca é no servidor e o Suspense da
  rota cobre isso. `error.tsx` é `'use client'` por exigência do Next.
- **A Home é a exceção: `<Suspense>` local em vez de `loading.tsx`.** A busca dos
  destaques mora num subcomponente `async` de servidor (`FeaturedProperties.tsx`)
  envolto em `<Suspense>` na própria `page.tsx`. Um `loading.tsx` na raiz
  bloquearia a Home inteira — inclusive o hero e a barra de busca — enquanto a API
  responde (ou até estourar o timeout de 10s de `request()`). Com o Suspense local
  só o slot de destaques espera. **Não crie `src/app/loading.tsx`.**
- **O `<h2>` da seção de destaques vem de `FEATURED_SECTION_TITLE`
  (`featuredFilters.ts`), nunca de literal duplicado.** Os quatro estados
  (carregando, erro, vazio, com resultados) renderizam a **mesma**
  `<section className={styles.featured}>` com o **mesmo** heading na mesma
  posição — é isso que impede a troca do fallback pelo conteúdo de empurrar a
  página. Três literais iguais em três arquivos derivariam no primeiro rename.
- **`sort: 'recent'` é premissa, não contrato.** O contrato da `imobhub-api` não
  enumera valores de `sort`. Ele fica isolado em `featuredFilters.ts`
  (`FEATURED_FILTERS`), que é o **ponto único de ajuste**. Se a API ignorar, o pior
  caso é ordem arbitrária — e o rótulo "Imóveis em destaque" não promete recência.
- **Header em um único lugar.** A marca "ImobHub" vive em `layout.tsx` e em lugar
  nenhum mais. Páginas nunca renderizam header próprio nem um `<main>` — o layout
  já fornece ambos, e aninhar `<main>` quebra a semântica.
- **`metadata.title` com `template`.** O layout define
  `{ default: 'ImobHub', template: '%s | ImobHub' }`, então cada página exporta só
  o título curto (`'Resultados'`) e o sufixo da marca vem de graça.
- **Sem framework de CSS.** `globals.css` guarda reset, utilitárias
  (`.container`, `.brand`, `.nav-list`, `.page-title`) e as
  classes das telas mais antigas (`.search-bar*`, `.home-hero*`). Sem Tailwind ou
  styled-components. **Tela nova nasce com CSS Module co-locado**
  (`imoveis/page.module.css`, `imoveis/[id]/propertyDetail.module.css`), como os
  componentes.
- **`tokens.css` é a fonte única de cor, fonte, raio, sombra e espaçamento.**
  `globals.css` faz `@import './tokens.css'` na **primeira** linha (o CSS ignora
  `@import` que venha depois de qualquer regra; o pipeline do Next inlina o
  arquivo no topo do bundle). **Nenhum valor literal de cor, fonte, raio ou
  sombra fora de `tokens.css`** — `designTokens.test.ts` reprova o build se um
  escapar num dos arquivos da lista `consumers`. Literal só é legítimo para
  dimensão específica (`72rem` de container, `44px` de alvo de toque, `641px` da
  media query). CSS Module não precisa de import: as custom properties de
  `:root` cascateiam para dentro do módulo.
- **`--color-overlay`** (`--color-text` a 55%) é o fundo semitransparente de
  camada modal. Nasceu com o drawer de filtros de `/imoveis`; qualquer modal
  futuro reusa esse tom em vez de inventar outro preto.
- **`--color-surface` faz duplo papel como texto sobre o azul** (`.search-bar__submit`).
  A spec de tokens não define `--color-on-primary`; se um dia entrar tema escuro,
  esse é o primeiro ponto a virar token próprio.
- **Lógica testável fora do `.tsx`: `imoveis/searchFilters.ts` e
  `featuredFilters.ts`.** Componentes de
  servidor `async` não são triviais de renderizar em teste sem jsdom/plugin React;
  isolar parsing de query params, montagem de href de página e formatação numa
  função pura dá cobertura real dos edge cases sem arrastar infra de renderização.
  Substituiu o `searchParams.ts`/`toDisplayParams` do placeholder, que sumiu junto
  com ele.
- **Em produção o Next sanitiza erros lançados no render de Server Component**
  antes de chegarem ao `error.tsx`: a `error.message` em português do `ApiError`
  vira um parágrafo técnico em inglês. As duas rotas que consomem a API tratam
  isso, por caminhos diferentes — ao mexer em qualquer uma, saiba qual é qual:
  - `/imoveis` usa **`try/catch` na própria página**, então a mensagem certa nunca
    cruza a fronteira e é exibida como veio. Erro que não seja `ApiError` é
    re-lançado (bug de código não vira mensagem amigável). O bloco inteiro é o
    primitivo `ErrorMessage` (`@/components/ui/ErrorMessage`), envolvido pelo
    wrapper client `imoveis/ResultsError.tsx`, que passa
    `onRetry={() => router.refresh()}` — não existe `reset()` de boundary aqui, e
    o callback precisa nascer num client. **Prefira esse padrão em tela nova.**
  - `/imoveis/[id]` usa **`error.tsx`**, exigido pelos critérios da task, e por
    isso não pode confiar na mensagem que chega: `resolveErrorMessage`
    (`src/lib/messages.ts`) só exibe o que está numa allowlist e cai num texto
    genérico em português para o resto. Ver `imoveis/[id]/CLAUDE.md`.
- **A URL é a única fonte de verdade dos filtros.** `/imoveis` lê os params uma
  vez (`parseSearchFilters`) e passa o resultado como `defaults` para o
  `FilterPanel`, junto de `currentQuery` (`toSearchParams(raw).toString()`, a
  query crua, que o painel usa para preservar `q` e params desconhecidos ao
  aplicar). O painel não lê a URL com `useSearchParams()` — isso exigiria
  boundary de Suspense e duplicaria a leitura. `toSearchParams` foi extraído de
  `buildPageHref`, que continua sobrescrevendo só `page`.
- **`key={currentQuery}` no `<FilterPanel>`.** O painel é formulário não
  controlado; sem remount os `defaultValue` não se reaplicam ao voltar/avançar no
  browser ou ao paginar. Ver `src/components/CLAUDE.md`.
- **Carregamento via `imoveis/loading.tsx`** (Suspense nativo do App Router), não
  `useState(isLoading)`. O esqueleto do grid são seis `SkeletonCard`
  (`@/components/Skeleton`) dentro do **mesmo `styles.grid`** do grid real: reusar
  a classe é o que garante colunas e `gap` idênticos aos do resultado carregado
  sem uma segunda fonte de verdade para os breakpoints. Seis é aproximação
  deliberada — `per_page` não é lido da URL, quem decide é a API.
- **Paginação com `next/link`, não `onClick`.** Um `<Link>` para a URL da outra
  página re-executa a busca no servidor e mantém o histórico do browser. O estado
  desabilitado é `<span aria-disabled>`, nunca um `<a>` sem `href` (seria focável
  como link ativo).

## Business logic

- **Destaques da Home:** `searchProperties({ per_page: 6, sort: 'recent' })`.
  Se a API ignorar `per_page` e devolver mais itens, `takeFeatured` corta em 6 no
  cliente. Os quatro estados, todos dentro da mesma `<section>` com o mesmo `h2`:
  - **carregando** → `FeaturedSkeleton.tsx` é o `fallback` do `<Suspense>`:
    `FEATURED_LIMIT` `SkeletonCard` (`@/components/Skeleton`) numa `<ul>`
    `aria-hidden` sobre o mesmo `styles.grid` do conteúdo real, mais um
    `<p role="status">` com o texto de carregamento sob `.srOnly` — anunciado por
    leitor de tela sem ocupar espaço, o que manteria o CLS de pé. A contagem vem
    de `FEATURED_LIMIT`, nunca de um `6` solto.
  - **erro** (`ApiError`: rede, timeout, 4xx, 5xx, corpo inválido) → `ErrorMessage`
    (`role="alert"`) com `FEATURED_LOAD_ERROR_MESSAGE` e botão "Tentar novamente",
    via o wrapper `'use client'` `FeaturedError.tsx` (`router.refresh()`). Como
    `searchProperties` usa `cache: 'no-store'`, o refresh refaz a chamada de
    verdade e só o slot sob Suspense é re-renderizado. Erro que **não** é
    `ApiError` continua sendo re-lançado (bug de código não vira mensagem
    amigável).
  - **vazio** (`data: []`, ausente ou não-array) → `EmptyState` com
    `EMPTY_FEATURED_TITLE`, **sem** `action` (Server Component não passa callback).
  - **com resultados** → o grid de `PropertyCard`.

  Hero, `<h1>` e `SearchBar` ficam **fora** do `<Suspense>` e continuam
  renderizados e funcionais nos quatro. O heading fica em todos de propósito: é a
  paridade de markup entre fallback e conteúdo que segura o layout.
- O grid dos destaques segue a mesma escala de `/imoveis`: 1 coluna ≤640px, 2 em
  641–1024px, 3 a partir de 1025px, com `repeat(n, minmax(0, 1fr))` — o
  `minmax(0, …)` é o que impede título longo de estourar a coluna a 375px.
- O `ErrorMessage` dos destaques recebe `FEATURED_LOAD_ERROR_MESSAGE` **fixo** por
  prop, não a `error.message` do `ApiError`: em produção o Next redige a mensagem
  de Server Component, e o texto certo nunca cruzaria a fronteira intacto.
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
- Lista vazia não é erro. `data: []` → `EmptyState` com `EMPTY_SEARCH_TITLE` e
  `EMPTY_SEARCH_DESCRIPTION` (`src/lib/messages.ts`); se a página corrente for
  `> 1` (pedido além do total, ver `src/lib/CLAUDE.md`), o link de volta para a
  primeira página aparece **fora** do componente, logo abaixo — o primitivo é
  genérico e não conhece paginação, e `action` exigiria um callback, que um
  Server Component não pode passar.
- A contagem vem de `response.total` com singular/plural ("1 imóvel encontrado" /
  "42 imóveis encontrados") e só aparece quando há resultado.
- O `<aside>` "Filtros" **deixou de ser espaço reservado**: é o `FilterPanel`
  (`src/components/`), renderizado **fora** dos blocos condicionais de erro e de
  lista vazia — o usuário precisa poder corrigir justamente o filtro que zerou a
  busca, e em ≤1024px o botão "Filtros" é a única porta de entrada para eles. O
  `<aside>` de `loading.tsx` continua sendo um esqueleto estático.
- **Layout de `/imoveis` por faixa:** ≤640px grid de 1 coluna e filtros em
  drawer; 641–1024px grid de 2 colunas e o mesmo drawer; ≥1025px sidebar de
  `18rem` ao lado de um grid de 3 colunas. O grid usa
  `repeat(n, minmax(0, 1fr))` — `auto-fill`/`minmax(15rem, …)` decidia a
  contagem de colunas pela largura disponível e não dava para casar com os
  breakpoints exigidos, e o `minmax(0, …)` é o que impede título longo de
  estourar a coluna. Quem monta o drawer é o `FilterPanel`, não a página: ver
  `src/components/CLAUDE.md`.
- `/imoveis/[id]` busca o imóvel na API. ID inexistente vira `notFound()` a partir
  do `ApiError` com `status === 404` de `getPropertyById` e cai no `not-found.tsx`
  **da própria rota** (`EmptyState` "Imóvel não encontrado" + link de volta aos
  resultados), não no 404 genérico do site; demais falhas caem no `error.tsx` da
  própria rota. Detalhes em `imoveis/[id]/CLAUDE.md`.

## Dependencies

- `next` (App Router, `next/link`, `next/navigation`), `react`, `react-dom`.
- Dados vêm exclusivamente de `src/lib/api.ts` — nenhuma rota deve chamar `fetch`
  direto para a `imobhub-api`. Veja `src/lib/CLAUDE.md`. Hoje `/`
  (`searchProperties`, via `FeaturedProperties.tsx`), `/imoveis`
  (`searchProperties`) e `/imoveis/[id]` (`getPropertyById`) consomem a API.
- `/` consome o `PropertyCard` com o `headingLevel` default (`3`), sob o `h2` da
  seção de destaques, os primitivos `SkeletonCard` (`@/components/Skeleton`, via
  `FeaturedSkeleton.tsx`), `ErrorMessage` (via `FeaturedError.tsx`) e `EmptyState`
  (`@/components/ui`), e `@/lib/messages` para os textos de erro e de lista vazia.
  Como `searchProperties` usa `cache: 'no-store'`, a Home saiu de `○` para `ƒ` na
  saída do `next build` — consequência esperada de consumir a API.
- `/imoveis` reusa `toTransactionType`/`SEARCH_RESULTS_PATH` de
  `@/components/searchBarUrl` (módulo puro, sem `'use client'`) para não duplicar
  a regra de descarte que a barra de busca já implementa, e o `PropertyCard` com
  `headingLevel={2}` — o grid fica direto sob o `h1` da página. Os estados vazio
  e de erro vêm dos primitivos de `@/components/ui` (ver `ui/CLAUDE.md`).
- `/imoveis/[id]` usa `PropertyGallery`, `@/lib/format` e `@/lib/messages`.

## Gotchas

- **No Next 15 `params` e `searchParams` são `Promise`.** As páginas precisam ser
  `async` e dar `await`. Tipar como objeto simples compila no editor mas quebra o
  `next build`.
- **Navegação interna sempre com `next/link`.** Um `<a href="/...">` puro causa
  full page reload e viola o requisito de client-side routing.
- **`not-found.tsx` na raiz de `src/app`** cobre qualquer rota não mapeada
  automaticamente — **exceto** onde uma rota define o seu: `imoveis/[id]` tem um
  `not-found.tsx` próprio, que tem precedência sobre o global. Rota que precise de
  404 com contexto próprio segue esse caminho, sem tocar no `page.tsx`.
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
  A escala canônica é mobile ≤640px / tablet 641–1024px / desktop ≥1025px.
  Home (`globals.css`, `home.module.css`) e `/imoveis` já seguem a escala, e
  `designTokens.test.ts` trava a regressão nos estilos da Home — inclusive o grid
  de destaques em 1/2/3 colunas, que o esqueleto do `<Suspense>` reusa. Sobraram
  as media queries de 48rem de `PropertyGallery.module.css`,
  `imoveis/[id]/propertyDetail.module.css` e `Skeleton.module.css` — dívida
  consciente, e precisam mudar **juntas**: é o `48rem` que casa o `aspect-ratio`
  do esqueleto do hero com o da galeria real e mantém o CLS ~0. Realinhar é task
  própria.
- **`.srOnly` vive em `home.module.css`, não em `globals.css`.** Ela nasceu com o
  anúncio de carregamento dos destaques e por enquanto tem um consumidor só; o
  segundo consumidor fora da Home é o gatilho para promovê-la a utilitária global.
  Só tem literal de dimensão (`1px`, `rect(0, 0, 0, 0)`) e **nenhuma media
  query**, então `home.module.css` continua passando tanto na proibição de literal
  quanto na trava de breakpoints de `designTokens.test.ts`.
- **`FeaturedSkeleton.tsx` e `FeaturedProperties.tsx` compartilham
  `home.module.css` e precisam ficar em paridade de layout** — mesma `.featured`,
  mesma `.title`, mesmo `.grid`, mesma contagem de itens. Mexeu no grid de um
  lado, acerte o outro, senão a troca do fallback pelo conteúdo empurra a página.
  O `.grid` é a **única** fonte dos breakpoints de destaques: o esqueleto nunca
  copia `641px`/`1025px` para si.
- **`loading.tsx` e `page.tsx` compartilham `page.module.css` e precisam ficar
  em paridade de layout.** `.filters` e `.filtersTrigger` existem **só** para o
  esqueleto: `.filters` reproduz a sidebar (visível a partir de 1025px) e
  `.filtersTrigger` reserva os 44px do botão "Filtros" abaixo disso. Mexeu no
  breakpoint ou na altura do botão de um lado, acerte o outro — senão a troca do
  Suspense para a página pronta empurra o grid.
- **`page.module.css`, `[id]/propertyDetail.module.css` e o `FilterPanel.module.css`
  estão migrados só em parte.** Chegaram de `main` depois que `tokens.css` já
  existia. Tudo que tinha
  equivalente exato na tabela virou `var(--*)`; sobraram os literais cujo token
  a spec aprovada não define, e que **não** foram colapsados de propósito — mexer
  no tom de tela recém-mergeada de outra pessoa seria mudança visual não
  autorizada. Por isso os dois estão em `stylesheets` mas fora de `consumers` no
  `designTokens.test.ts`: a checagem de `var()` indefinido vale, a proibição de
  literal não. Para fechar, faltam quatro tokens:
  - um cinza de superfície sutil que colapse `#f4f6fa` / `#f7f8fa` / `#f2f4f7`
    (três quase-idênticos, inventados por telas diferentes; `#f7f8fa` já aparece
    em dois arquivos, que é a deriva começando de novo). O `#f2f4f7` chegou a
    sumir com o `.skeletonCard` órfão, mas voltou no `.filtersTrigger` do
    esqueleto — enquanto o token não existir, cada esqueleto novo reinventa o
    tom;
  - o azul desabilitado `#7ba4ff` do `.retryButton:disabled` do detalhe;
  - um par fundo/borda tintado para bloco de erro. Os literais `#fdf3f3` /
    `#f0c2c2` / `#8c2f2f` **saíram do repo** junto com o `.error` de
    `imoveis/page.module.css`: o `ErrorMessage` usa borda `--color-border` e
    acento `--color-error`, sem fundo tintado. A dívida virou uma decisão
    consciente de aparência, não um literal solto — se o tintado voltar, ele
    nasce como token.
