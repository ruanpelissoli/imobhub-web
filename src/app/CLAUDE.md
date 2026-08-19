# src/app — rotas e layout (Next.js App Router)

## Purpose

Esqueleto navegacional do ImobHub: o root layout compartilhado e as três rotas
principais do produto (`/`, `/imoveis`, `/imoveis/[id]`) mais a página 404.

As três rotas já são telas de verdade. A Home navega para `/imoveis` com os
filtros na URL; `/imoveis` lê esses filtros, chama `searchProperties`, renderiza
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
  (`imoveis/page.module.css`, `imoveis/[id]/propertyDetail.module.css`), como os
  componentes.
- **Lógica testável fora do `.tsx`: `imoveis/searchFilters.ts`.** Componentes de
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
    re-lançado (bug de código não vira mensagem amigável). O "Tentar novamente" é
    o `RetryButton` client com `useRouter().refresh()`, já que não existe
    `reset()` do boundary. **Prefira esse padrão em tela nova.**
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
- O `<aside>` "Filtros" **deixou de ser espaço reservado**: é o `FilterPanel`
  (`src/components/`), renderizado **fora** dos blocos condicionais de erro e de
  lista vazia — o usuário precisa poder corrigir justamente o filtro que zerou a
  busca. O `<aside>` de `loading.tsx` continua sendo um esqueleto estático.
- `/imoveis/[id]` busca o imóvel na API. ID inexistente vira `notFound()` a partir
  do `ApiError` com `status === 404` de `getPropertyById`; demais falhas caem no
  `error.tsx` da própria rota. Detalhes em `imoveis/[id]/CLAUDE.md`.

## Dependencies

- `next` (App Router, `next/link`, `next/navigation`), `react`, `react-dom`.
- Dados vêm exclusivamente de `src/lib/api.ts` — nenhuma rota deve chamar `fetch`
  direto para a `imobhub-api`. Veja `src/lib/CLAUDE.md`. Hoje `/imoveis`
  (`searchProperties`) e `/imoveis/[id]` (`getPropertyById`) consomem a API.
- `/imoveis` reusa `toTransactionType`/`SEARCH_RESULTS_PATH` de
  `@/components/searchBarUrl` (módulo puro, sem `'use client'`) para não duplicar
  a regra de descarte que a barra de busca já implementa, e o `PropertyCard` com
  `headingLevel={2}` — o grid fica direto sob o `h1` da página.
- `/imoveis/[id]` usa `PropertyGallery`, `@/lib/format` e `@/lib/messages`.

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
