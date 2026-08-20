# src/components/Skeleton — primitivos de estado de carregamento

## Purpose

Blocos animados que representam a forma do conteúdo enquanto os dados carregam:
`SkeletonBox`, `SkeletonText`, `SkeletonCard`, `SkeletonDetailHero`,
`SkeletonDetailData` e `SkeletonTableRow`, re-exportados por `index.ts`.

Esta pasta entrega **só os primitivos**; quem os arranja em tela é o `loading.tsx`
de cada rota.

Consumidores hoje: **`src/app/imoveis/loading.tsx`** usa `SkeletonCard` dentro do
mesmo `styles.grid` do grid real (a classe ad-hoc `.skeletonCard` saiu de
`imoveis/page.module.css`); **`src/app/imoveis/[id]/loading.tsx`** usa
`SkeletonDetailHero`, `SkeletonDetailData` e `SkeletonBox` (este para o link de
volta, o título da seção e as linhas de anúncio).

## Key decisions

- **Um único `Skeleton.module.css` para a pasta inteira**, em vez de um módulo por
  componente: são seis componentes que compartilham a mesma animação e a mesma
  paleta, e seis arquivos duplicariam o `@keyframes`.
- **`@keyframes` mora dentro do módulo.** O css-loader do Next escopa o nome da
  animação junto com as classes — verificado no CSS gerado por `next build`
  (`animation: Skeleton_shimmer__<hash>`). É o comportamento desejado: nada de
  `@keyframes` global em `globals.css`, que é reservado a reset e utilitários.
- **O gradiente do shimmer é montado com tokens existentes** (`--color-surface-muted`
  de base, `--color-surface` e `--color-border` de realce). Nenhum token novo:
  `tokens.css` é decisão de spec e criar tom só para o loading abriria a mesma
  deriva de cinzas que `src/app/CLAUDE.md` já cataloga.
- **`.shimmer` não define raio.** O raio vem sempre de um modificador
  (`.radiusSm` / `.radiusCard`), o que deixa a mídia do card ficar sem raio nenhum
  e depender do `overflow: hidden` do contêiner — igual ao `PropertyCard` real.
  Linhas de texto e chips usam `--radius-sm`; mídia e frames usam `--radius-card`.
- **`aria-hidden="true"` no markup, sem `role="status"`.** O primitivo é decorativo
  e não expõe texto; anunciar o carregamento é da tela consumidora, que já tem o
  `role="status"` com texto visível (`imoveis/loading.tsx`). Duplicar aqui faria o
  leitor de tela anunciar N vezes.
- **Nenhum componente é `'use client'`.** Eles precisam ser usáveis dentro de
  `loading.tsx`, que é Server Component.
- **Lógica testável fora do `.tsx`** (`skeletonWidths.ts`, `skeletonTable.ts`),
  porque o Vitest do projeto roda sem jsdom/RTL — mesmo padrão de
  `propertyGalleryState.ts`. Os nomes evitam colidir por caixa com
  `SkeletonText.tsx`/`SkeletonTableRow.tsx`: `skeletonText.ts` ao lado de
  `SkeletonText.tsx` dispara TS1149 em filesystem case-insensitive (ver
  `src/components/CLAUDE.md`).
- **`index.ts` exporta só os componentes e seus tipos de props.** Os módulos puros
  são detalhe interno da pasta.

## Business logic

### `resolveLineWidths(lines, width)` — `skeletonWidths.ts`

- `lines` default `1`. `0`, negativo, fracionário ou não finito → **lista vazia**,
  e `SkeletonText` devolve `null` (sem `<div>` órfão no DOM).
- `width` string → mesma largura em todas as linhas.
- `width` array → cicla (`index % length`) quando é menor que `lines` e descarta o
  excedente quando é maior.
- Entradas em branco (string vazia ou só espaços) são descartadas antes da
  ciclagem; se sobrar nada, cai no comportamento default. As demais sofrem `trim`.
- Sem `width` → todas `100%`, com a **última** em `60%` **apenas quando
  `lines > 1`**. Com uma linha só não existe cauda de parágrafo a simular, e
  encurtá-la faria um `SkeletonText` solto parecer um bloco quebrado.

### `resolveColumnCount(columns)` — `skeletonTable.ts`

- Default `3`. Valor não inteiro, não finito ou `< 1` **cai no default**, não em
  zero: um `<tr>` sem `<td>` é linha inválida. É a divergência proposital em
  relação a `resolveLineWidths`, onde `0` linhas é resultado legítimo.

## Dependencies

- `src/app/tokens.css` — todas as cores, raios e espaçamentos. CSS Module não
  precisa importar: as custom properties de `:root` cascateiam.
- `src/app/designTokens.test.ts` lista `Skeleton.module.css` em `stylesheets` com
  `literalFree: true`, então o módulo está sob a proibição de literal de cor/raio/
  sombra/fonte **e** sob a checagem de `var(--x)` definido. Literal só para
  dimensão própria (alturas, `5rem` da miniatura, `48rem` da media query, `1.4s`).
- `src/app/imoveis/loading.tsx` (`SkeletonCard`) e
  `src/app/imoveis/[id]/loading.tsx` (`SkeletonDetailHero`, `SkeletonDetailData`,
  `SkeletonBox`) são os consumidores. As dimensões foram derivadas de
  `PropertyCard.module.css`, `PropertyGallery.module.css` e
  `imoveis/[id]/propertyDetail.module.css` — mexer em altura ou `aspect-ratio`
  aqui reabre CLS naquela tela.

## Gotchas

- **Os chips têm raio diferente do real.** Os chips de atributo do detalhe usam
  `border-radius: 999px`; aqui é `--radius-sm`, porque literal de raio reprova em
  `designTokens.test.ts` e criar token de pílula é decisão de spec. Diferença
  puramente visual no estado de carregamento, sem efeito de layout.
- **A fileira de miniaturas do `SkeletonDetailHero` ainda não tem contraparte.** O
  `PropertyGallery` atual navega por botões anterior/próxima + contador, sem
  miniaturas. A fileira atende o critério de aceite e antecipa a galeria futura;
  hoje a garantia de CLS ~0 vale só para o frame principal (`4 / 3`, virando
  `16 / 9` a partir de `48rem`, igual ao `.frame` real da galeria).
- **`SkeletonTableRow` segue sem consumidor, por decisão e não por pendência.**
  Ele renderiza um `<tr>` cru e precisa estar dentro de `<tbody>` — fora dele o
  HTML é inválido. A seção "Anúncios disponíveis" do detalhe é uma `<ul>`, então
  o `loading.tsx` de lá monta as linhas com `SkeletonBox` sobre as classes reais
  `.listing`/`.listings` (ver `src/app/imoveis/[id]/CLAUDE.md`). Ele passa a ter
  consumidor quando existir uma tabela de verdade no produto; aí ajuste as
  colunas.
- **Altura nunca depende de imagem carregar**: mídia e miniaturas usam
  `aspect-ratio` no contêiner, mesmo princípio de `PropertyCard.module.css`.
- As alturas de linha são `calc(var(--text-*) * var(--leading-body))`, derivadas
  dos tokens e não medidas em runtime — o CLS é ~0, não exatamente 0.
- `prefers-reduced-motion: reduce` desliga a animação e deixa o bloco estático
  (mesmo precedente do `.card` de `PropertyCard.module.css`). Não troque por uma
  animação "mais suave": o requisito é ausência de movimento.
