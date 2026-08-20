# src/components/ui — primitivos de UI

## Purpose

Primitivos visuais genéricos, sem conhecimento de domínio: não sabem o que é um
imóvel, não chamam a API, não leem a URL. Só recebem props e desenham.

- **`EmptyState`** — ícone decorativo, título, descrição opcional e botão de ação
  opcional. Usado pelo estado de lista vazia de `/imoveis` e pelo
  `not-found.tsx` de `/imoveis/[id]`.
- **`ErrorMessage`** — `role="alert"`, ícone de alerta, texto e botão "Tentar
  novamente" (só quando `onRetry` é passado). Usado por
  `src/app/imoveis/ResultsError.tsx`.

Cada primitivo mora na própria pasta (`<Nome>/<Nome>.tsx`, `<Nome>.module.css`,
`index.ts`), diferente do `src/components/` raiz, que é flat. A pasta por
componente existe porque um primitivo tende a acumular arquivos (estilo, lógica,
subcomponentes) e o `index.ts` mantém o import curto: `@/components/ui/EmptyState`.

`src/components/Skeleton/` é a outra subpasta de primitivos e resolve o mesmo
problema por outro caminho: lá são seis componentes de uma **família**, que
dividem um CSS Module e um `@keyframes`, então a pasta é uma só. Aqui os
primitivos são **avulsos** — cada um tem módulo próprio e é usado sozinho —, daí
a pasta por componente. Nenhum dos dois grupos marca `'use client'`.

## Key decisions

- **Nenhum dos dois marca `'use client'`.** Um componente sem diretiva é
  *compartilhado*: renderiza no servidor quando importado por um Server
  Component e no cliente quando importado por um client. É o que permite
  `/imoveis` (Server Component) usar `EmptyState` sem `action`, enquanto o
  `ResultsError` client passa `onRetry`. Marcar `'use client'` aqui arrastaria os
  dois para o bundle do cliente sem necessidade; marcar `'use server'` seria
  errado.
- **Quem passa callback tem que ser client.** `onClick`/`onRetry` são funções e
  não atravessam a fronteira servidor→cliente: passá-las direto de um Server
  Component quebra em runtime. Por isso `/imoveis` renderiza `EmptyState` **sem**
  `action` e envolve o `ErrorMessage` no wrapper client `ResultsError`.
- **O título do `EmptyState` é `<p>`, não heading.** O componente não tem como
  saber se a página está no `h1` ou no `h3`; emitir um heading fixo quebraria a
  hierarquia de quem o consome. Se um consumidor precisar de heading, ele o
  renderiza por fora.
- **Zero token novo, zero literal.** Ambos os módulos CSS estão em `consumers` de
  `src/app/designTokens.test.ts` com `literalFree: true` — cor, fonte, raio,
  sombra e `font-size` só via `var(--*)` de `src/app/tokens.css`. Literal só para
  dimensão própria (`480px` de largura, `44px` de alvo de toque, tamanho do
  ícone).
- **O bloco de erro não tem fundo tintado.** O `.error` que ele substituiu usava
  `#fdf3f3`/`#f0c2c2`/`#8c2f2f`, três vermelhos que a spec de tokens não define.
  Em vez de copiá-los, o componente usa borda `--color-border` e acento
  `--color-error`. O par fundo/borda tintado volta quando a task de fechamento de
  tokens criar os tokens — não invente literal aqui.
- **Lógica testável fora do `.tsx`.** `errorMessageText.ts` guarda
  `resolveDisplayMessage`, porque o Vitest do projeto roda sem jsdom/RTL e não dá
  para renderizar componente em teste. O nome difere do `.tsx` em mais que o
  casing de propósito (TS1149 em filesystem case-insensitive).
- **Ícones SVG inline.** Não existe `public/` no projeto e nenhuma biblioteca de
  ícones é dependência. Ambos são `aria-hidden="true" focusable="false"` — são
  decoração, a informação está no texto.

## Business logic

- `ErrorMessage`: `message` ausente, vazia ou só com espaços cai em
  `GENERIC_LOAD_ERROR_MESSAGE`; qualquer outro texto é exibido `trim`ado, **como
  veio**. O componente não filtra por allowlist — quem precisa disso é o
  `resolveErrorMessage` de `@/lib/messages`, usado pelo `error.tsx` do detalhe.
- `ErrorMessage`: sem `onRetry`, o botão não é renderizado (nada de botão morto).
  O clique chama `onRetry()` e nada mais — **o refetch é do consumidor**.
- `EmptyState`: descrição e botão só aparecem quando as props existem.

## Dependencies

- `@/lib/messages` (só constantes de texto; nunca `@/lib/api`).
- Consumidores hoje: `src/app/imoveis/page.tsx` e
  `src/app/imoveis/[id]/not-found.tsx` (`EmptyState`), e
  `src/app/imoveis/ResultsError.tsx` (`ErrorMessage`). Os dois consumidores do
  `EmptyState` são Server Components e renderizam o `<Link>` de volta **fora** do
  primitivo, pelo mesmo motivo: `action` é callback.
- `EMPTY_FEATURED_TITLE` existe em `@/lib/messages` mas **não tem consumidor**:
  não há tela de destaques no produto ainda.

## Gotchas

- `/imoveis/[id]/error.tsx` **não** usa `ErrorMessage`, de propósito: ele tem
  heading próprio, estado "Tentando…" e link de volta, que não cabem em
  `{ message?, onRetry? }`. Ver `src/app/imoveis/[id]/CLAUDE.md`.
- `var(--token-inexistente)` falha em silêncio — sem erro de build nem de lint.
  Só `designTokens.test.ts` pega. Ao criar outro primitivo, registre o módulo lá.
- Custom property não é avaliada dentro de `@media`; se precisar de breakpoint,
  escreva o valor literal (mobile ≤640px / tablet 641–1024px / desktop ≥1025px).
