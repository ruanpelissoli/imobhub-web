# src/app — rotas e layout (Next.js App Router)

## Purpose

Esqueleto navegacional do ImobHub: o root layout compartilhado e as três rotas
principais do produto (`/`, `/imoveis`, `/imoveis/[id]`) mais a página 404.

As telas ainda são **placeholders**: provam que o roteamento e a leitura de
parâmetros funcionam, exibindo os valores recebidos. Busca com filtros e detalhe
do imóvel com dados reais vêm em tasks seguintes e penduram nesse esqueleto — o
conteúdo das páginas pode ser substituído sem cerimônia, a estrutura de rotas e o
layout não.

## Key decisions

- **Server Components por padrão.** Nenhuma página é `'use client'`; as telas não
  têm interatividade e `params`/`searchParams` resolvem no servidor. Só marque uma
  página como client quando houver interatividade real.
- **Header em um único lugar.** A marca "ImobHub" vive em `layout.tsx` e em lugar
  nenhum mais. Páginas nunca renderizam header próprio nem um `<main>` — o layout
  já fornece ambos, e aninhar `<main>` quebra a semântica.
- **`metadata.title` com `template`.** O layout define
  `{ default: 'ImobHub', template: '%s | ImobHub' }`, então cada página exporta só
  o título curto (`'Resultados'`) e o sufixo da marca vem de graça.
- **Sem framework de CSS.** `globals.css` traz reset mínimo e algumas classes
  utilitárias (`.container`, `.brand`, `.nav-list`). A escolha de estilização fica
  para a task que construir a primeira tela de verdade.
- **`toDisplayParams` extraído para `imoveis/searchParams.ts`.** Componentes de
  servidor `async` não são triviais de renderizar em teste sem jsdom/plugin React;
  isolar a normalização dos query params numa função pura dá cobertura real dos
  edge cases sem arrastar infra de teste de renderização.

## Business logic

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
