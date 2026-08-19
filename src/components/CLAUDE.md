# src/components — componentes de UI compartilhados

## Purpose

Componentes reutilizados por mais de uma rota:

- **`SearchBar`** — barra de busca principal da Home, que a tela de Resultados vai
  reaproveitar para refinar a busca sem voltar para `/`. `searchBarUrl.ts` guarda
  a lógica pura de montagem da URL de destino.
- **`PropertyCard`** — card de imóvel dos destaques da Home e do grid de
  `/imoveis`. Recebe dados por prop (`property: Property`) e **nunca chama a
  API** — quem busca é a página. `propertyCard.format.ts` guarda a formatação.

Padrão do diretório: o `.tsx` cuida de markup e boundary de client; toda regra
testável mora num módulo `.ts` co-locado, porque o projeto usa Vitest **sem
jsdom/RTL** e não dá para renderizar componentes em teste (mesmo precedente de
`src/app/imoveis/searchFilters.ts`).

## Key decisions

- **`SearchBar` é `'use client'`, a Home continua Server Component.** A única
  interatividade real é o submit; a página apenas aninha o componente client.
- **Helper de URL próprio em vez de `buildQueryString` de `src/lib/api.ts`.**
  `src/lib/CLAUDE.md` registra a decisão de não arrastar o módulo de rede para o
  bundle do cliente. `buildSearchUrl` espelha a mesma regra de omissão com
  `URLSearchParams`.
- **Formulário não controlado (`defaultValue`/`defaultChecked` + `FormData`).**
  Sem `useState` para espelhar o que o DOM já guarda, e os props `defaultQuery`/
  `defaultTransactionType` deixam Resultados reidratar a barra com a busca
  vigente sem mudar o componente.
- **Radios em `<fieldset>`/`<legend>`, não `<select>`.** Duas opções fixas ficam
  visíveis de uma vez e cada `<label>` vira alvo de toque de 44px.
- **`PropertyCard` usa `<img>` cru, não `next/image`.** As fotos vêm de scraping
  de imobiliárias arbitrárias e `next.config.ts` não tem `images.remotePatterns`;
  sem lista de hosts o `next/image` quebra em runtime. A regra
  `@next/next/no-img-element` é desligada pontualmente em `PropertyImage.tsx`. Se
  a API um dia normalizar as fotos para um CDN próprio, migrar e remover o
  disable.
- **Boundary de client mínimo no card.** `PropertyCard` é Server Component; só
  `PropertyImage` é `'use client'`, porque o fallback de imagem quebrada exige
  estado no browser. Não marque o card inteiro como client.
- **CSS: dois esquemas, por idade.** `SearchBar` usa classes globais
  (`.search-bar*` em `src/app/globals.css`); `PropertyCard` usa **CSS Modules
  co-locado** (`PropertyCard.module.css`), suportado nativamente pelo Next, sem
  dependência nova e sem inchar `globals.css`. **Componente novo nasce com CSS
  Module**; `globals.css` fica para reset e utilitários de layout.
- **Todo valor visual vem de `src/app/tokens.css`.** CSS Module consome
  `var(--color-*)`, `var(--text-*)`, `var(--radius-*)`, `var(--shadow-*)` e
  `var(--space-*)` sem import nenhum — as custom properties de `:root`
  cascateiam normalmente para dentro do módulo. **Cor, fonte, raio e sombra
  nunca entram como literal num componente**; literal só para dimensão própria
  do componente (`2.5rem` do ícone placeholder, `44px` de alvo de toque,
  `aspect-ratio: 4 / 3`, as transições de 150ms). Token faltando → adicione em
  `tokens.css`, não no módulo. `src/app/designTokens.test.ts` reprova literais
  novos em `PropertyCard.module.css`; ao criar outro módulo, inclua-o na lista
  `consumers` desse teste.
- **Placeholder sem asset.** SVG inline em `PropertyImage.tsx` — não existe
  `public/` no projeto e criar um só para isso adicionaria um request de rede por
  card sem foto.
- **`aspect-ratio: 4 / 3` no contêiner da mídia** + `object-fit: cover` na foto:
  a altura do card não depende da imagem carregar, então o grid não pula quando
  uma foto falha.
- **Export nomeado, um componente por arquivo.** É a convenção do resto do
  projeto (`api.ts`, `types.ts`, `searchFilters.ts`); `export default` só onde o
  App Router exige (`page.tsx`, `layout.tsx`). `SearchBar` ainda usa `default`
  por ter chegado antes desta convenção — alinhe quando for tocá-lo.

## Business logic

### SearchBar

- `buildSearchUrl` omite `q` quando o texto é vazio, só espaços ou ausente — a URL
  nunca contém `?q=` nem `q=undefined`. O texto é `trim`ado antes de virar param.
- `transaction_type` default é `sale` ("Comprar" pré-selecionado). Valor fora do
  contrato (`sale` | `rent`) é descartado por `toTransactionType` e cai no default.
- Sem nenhum filtro, o retorno é `/imoveis` puro, sem `?` pendurado.
- O submit é `onSubmit` no `<form>`, não `onClick` no botão: Enter no campo de
  texto também precisa navegar.

### PropertyCard

- Preço em BRL **sem centavos** (`maximumFractionDigits: 0`) — anúncio de imóvel
  não mostra centavos.
- `price` ausente/zero/negativo → **"Preço sob consulta"**, nunca `R$ 0`.
- Quartos, banheiros, vagas e área só aparecem quando o valor é um número finito
  **maior que zero**. Os campos são obrigatórios no tipo, mas a API pode mandar
  `0`/`null`; a checagem é defensiva. Se todos forem omitidos, a `<ul>` de
  atributos não é renderizada (sem linha vazia).
- Singular/plural respeitado: `1 quarto` / `3 quartos`, `1 vaga` / `2 vagas`.
- Bairro e cidade unidos por `·`; se um dos dois for vazio, o separador não sobra
  solto.
- Foto principal = primeira entrada **não vazia** de `photos` (a API pode mandar
  strings em branco). Sem foto válida ou erro de carregamento → placeholder.

## Dependencies

- `next/navigation` (`useRouter().push`) no `SearchBar`, `next/link` no
  `PropertyCard` — ambos client-side, sem full page reload.
- `@/lib/types` apenas para tipos (`TransactionType`, `Property`); nada de
  `@/lib/api` aqui.
- `src/app/page.tsx` consome o `SearchBar`; `src/app/imoveis/page.tsx` consome o
  `PropertyCard` no grid de resultados, com `headingLevel={2}`, e reusa
  `toTransactionType`/`SEARCH_RESULTS_PATH` de `searchBarUrl.ts`. Esse módulo é
  puro e sem `'use client'` de propósito: precisa ser importável de Server
  Components.

## Gotchas

- `useRouter` **tem** que vir de `next/navigation`. O de `next/router` é Pages
  Router e quebra em runtime no App Router.
- `URLSearchParams` codifica espaço como `+`, não `%20` (form-urlencoded). É
  válido e o Next decodifica corretamente — os testes esperam `+`.
- **`onError` sozinho não cobre foto quebrada.** O card renderiza no servidor, o
  `<img src>` já vem no HTML inicial e o browser inicia o download durante o
  parse; o React só anexa o listener de `error` (evento de mídia, não delegado na
  raiz) na hidratação. Um 404/403 rápido — comum com scraping: hotlink
  protection, URL expirada — dispara nessa janela e ninguém escuta. Por isso o
  `ref` callback checa `isBrokenImage` (`complete && naturalWidth === 0`) no
  mount. **Não remova o ref "limpando" o componente**: ele cobre a falha que já
  aconteceu, o `onError` cobre a que ainda vai acontecer (inclusive com
  `loading="lazy"`, que só dispara o request quando a imagem entra no viewport).
- `PropertyImage` guarda **qual `src` falhou**, não um booleano. Se o React
  reaproveitar a instância com outra foto (grid paginado, lista keyed por
  índice), o reset é automático e não depende de o consumidor passar `key`.
- **Nada de elemento interativo dentro do card.** O `<Link>` envolve o card
  inteiro; aninhar `<button>`/`<a>` produz HTML inválido e quebra a navegação por
  teclado. Favoritar/compartilhar terá que reestruturar isso.
- O nível do heading do card é `headingLevel` (default `3`). A página é
  responsável por não pular nível: num grid direto sob o `h1` da página, passe
  `headingLevel={2}` ou coloque um `h2` de seção acima.
- O reset global define `a { color: inherit }`, então `.card` não vira azul
  sozinho — hover/focus é sinalizado por borda e sombra, e `:focus-visible` usa
  `outline` explícito. Não remova: é o único indicador de teclado.
- O título usa `-webkit-line-clamp: 2` + `overflow-wrap: anywhere` para segurar
  títulos de 100+ caracteres em 375px. O `overflow-x: hidden` de `globals.css` é
  rede de segurança, não substituto disso.
- `formatPrice` usa espaço **não-quebrável** (vem do `Intl`); testes normalizam
  whitespace antes de comparar, senão quebram entre versões de ICU.
- `:has(input:checked)` estiliza a opção selecionada do `SearchBar`; onde não
  houver suporte o radio nativo continua indicando o estado, só sem o destaque.
- Nenhum componente daqui chama a API.
