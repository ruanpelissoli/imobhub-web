# src/components — componentes de UI compartilhados

## Purpose

Componentes reutilizados por mais de uma rota:

- **`SearchBar`** — barra de busca principal da Home, que a tela de Resultados vai
  reaproveitar para refinar a busca sem voltar para `/`. `searchBarUrl.ts` guarda
  a lógica pura de montagem da URL de destino.
- **`PropertyCard`** — card de imóvel dos destaques da Home e do grid de
  `/imoveis`. Recebe dados por prop (`property: Property`) e **nunca chama a
  API** — quem busca é a página. `propertyCard.format.ts` guarda a formatação.
- **`PropertyGallery`** — galeria de fotos da tela de detalhe (`/imoveis/[id]`).
  `propertyGalleryState.ts` guarda a navegação circular e os rótulos.

`imageFallback.ts` é compartilhado por card e galeria: detecta foto quebrada.

Padrão do diretório: o `.tsx` cuida de markup e boundary de client; toda regra
testável mora num módulo `.ts` co-locado, porque o projeto usa Vitest **sem
jsdom/RTL** e não dá para renderizar componentes em teste (mesmo precedente de
`src/app/imoveis/searchFilters.ts`).

## Key decisions

- **Client no menor escopo possível.** `SearchBar`, `PropertyImage` e
  `PropertyGallery` são `'use client'`; as páginas que os aninham continuam Server
  Components. `PropertyCard` inteiro é servidor — só a imagem precisa de estado.
- **`<img>` cru, não `next/image`**, em card e galeria. As fotos vêm de scraping
  de imobiliárias arbitrárias e `next.config.ts` não tem `images.remotePatterns`;
  sem lista de hosts o `next/image` quebra em runtime. A regra
  `@next/next/no-img-element` é desligada pontualmente. Se a API um dia normalizar
  as fotos para um CDN próprio, migrar e remover o disable.
- **Helper de URL próprio em vez de `buildQueryString` de `src/lib/api.ts`.**
  `src/lib/CLAUDE.md` registra a decisão de não arrastar o módulo de rede para o
  bundle do cliente. `buildSearchUrl` espelha a mesma regra de omissão com
  `URLSearchParams`.
- **Formatadores de preço e área moram em `src/lib/format.ts`**, não aqui.
  `propertyCard.format.ts` os re-exporta por compatibilidade. Duas telas mostrando
  o mesmo imóvel com preços diferentes (`R$ 850.000` no card, `R$ 850.000,00` no
  detalhe) é bug de produto, então a formatação tem uma dona só.
- **Formulário não controlado (`defaultValue`/`defaultChecked` + `FormData`).**
  Sem `useState` para espelhar o que o DOM já guarda, e os props `defaultQuery`/
  `defaultTransactionType` deixam Resultados reidratar a barra com a busca
  vigente sem mudar o componente.
- **Radios em `<fieldset>`/`<legend>`, não `<select>`.** Duas opções fixas ficam
  visíveis de uma vez e cada `<label>` vira alvo de toque de 44px.
- **CSS: dois esquemas, por idade.** `SearchBar` usa classes globais
  (`.search-bar*` em `src/app/globals.css`); `PropertyCard` e `PropertyGallery`
  usam **CSS Modules co-locado**, suportado nativamente pelo Next, sem dependência
  nova e sem inchar `globals.css`. **Componente novo nasce com CSS Module**;
  `globals.css` fica para reset e utilitários de layout.
- **Placeholder sem asset.** SVG inline — não existe `public/` no projeto e criar
  um só para isso adicionaria um request de rede por card sem foto.
- **`aspect-ratio` no contêiner da mídia** + `object-fit: cover` na foto: a altura
  não depende da imagem carregar, então o grid não pula quando uma foto falha.
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

- Preço em BRL **sem centavos**; `price` ausente/zero/negativo → **"Preço sob
  consulta"**, nunca `R$ 0`. Ver `src/lib/format.ts`.
- Quartos, banheiros, vagas e área só aparecem quando o valor é um número finito
  **maior que zero**. Os campos são obrigatórios no tipo, mas a API pode mandar
  `0`/`null`; a checagem é defensiva. Se todos forem omitidos, a `<ul>` de
  atributos não é renderizada (sem linha vazia).
- Singular/plural respeitado: `1 quarto` / `3 quartos`, `1 vaga` / `2 vagas`.
- Bairro e cidade unidos por `·`; se um dos dois for vazio, o separador não sobra
  solto.
- Foto principal = primeira entrada **não vazia** de `photos` (a API pode mandar
  strings em branco). Sem foto válida ou erro de carregamento → placeholder.

### PropertyGallery

- Navegação **circular**, sem botão desabilitado — da última foto vai para a
  primeira e vice-versa. Com 1 foto, botões e contador somem; sem fotos
  (`null`/ausente/`[]`), só o placeholder.
- Foto cujo carregamento falha entra num `Set` de quebradas e cai no mesmo
  placeholder, para nunca exibir o ícone de imagem quebrada do browser.
- Ao contrário do card, o detalhe **mostra atributos zerados** ("Sem vagas") em vez
  de omitir: num card compacto o silêncio é econômico, na tela canônica ele seria
  lido como "não sabemos". Ver `src/lib/format.ts`.

## Dependencies

- `next/navigation` (`useRouter().push`) no `SearchBar`, `next/link` no
  `PropertyCard` — ambos client-side, sem full page reload.
- `@/lib/types` apenas para tipos (`TransactionType`, `Property`) e
  `@/lib/format` para formatação pura; **nada de `@/lib/api` aqui**.
- `src/app/page.tsx` consome o `SearchBar`; `src/app/imoveis/page.tsx` consome o
  `PropertyCard` no grid de resultados, com `headingLevel={2}`, e reusa
  `toTransactionType`/`SEARCH_RESULTS_PATH` de `searchBarUrl.ts`. Esse módulo é
  puro e sem `'use client'` de propósito: precisa ser importável de Server
  Components. `src/app/imoveis/[id]/page.tsx` consome o `PropertyGallery`.

## Gotchas

- `useRouter` **tem** que vir de `next/navigation`. O de `next/router` é Pages
  Router e quebra em runtime no App Router.
- `URLSearchParams` codifica espaço como `+`, não `%20` (form-urlencoded). É
  válido e o Next decodifica corretamente — os testes esperam `+`.
- **`onError` sozinho não cobre foto quebrada.** O componente renderiza no
  servidor, o `<img src>` já vem no HTML inicial e o browser inicia o download
  durante o parse; o React só anexa o listener de `error` (evento de mídia, não
  delegado na raiz) na hidratação. Um 404/403 rápido — comum com scraping: hotlink
  protection, URL expirada — dispara nessa janela e ninguém escuta. Por isso o
  `ref` callback checa `isBrokenImage` (`complete && naturalWidth === 0`) no
  mount. **Não remova o ref "limpando" o componente**: ele cobre a falha que já
  aconteceu, o `onError` cobre a que ainda vai acontecer — no card, com
  `loading="lazy"`, o request só sai quando a imagem entra no viewport, então a
  falha costuma chegar bem depois da hidratação.
- **`loading` difere por posição, de propósito.** O card usa `lazy` (grid de N
  itens abaixo da dobra); a galeria usa `eager` + `fetchPriority="high"`, porque a
  foto principal do detalhe é a candidata a LCP da página mais acessada do produto
  e o lazy faria o browser esperar o layout para só então baixar.
- Card e galeria guardam **qual `src` falhou**, não um booleano. Se o React
  reaproveitar a instância com outra foto, o reset é automático e não depende de o
  consumidor passar `key`. Pelo mesmo motivo a galeria indexa por
  `normalizePhotoIndex(currentIndex, total)` e não pelo índice cru: numa navegação
  `/imoveis/1` → `/imoveis/2` o `currentIndex` sobrevive, e se o imóvel novo tiver
  menos fotos o índice antigo apontaria para fora da lista — exibindo "Sem fotos
  disponíveis" para um imóvel que tem fotos.
- **Nada de elemento interativo dentro do card.** O `<Link>` envolve o card
  inteiro; aninhar `<button>`/`<a>` produz HTML inválido e quebra a navegação por
  teclado. Favoritar/compartilhar terá que reestruturar isso.
- O nível do heading do card é `headingLevel` (default `3`). A página é
  responsável por não pular nível.
- O reset global define `a { color: inherit }`, então `.card` não vira azul
  sozinho — hover/focus é sinalizado por borda e sombra, e `:focus-visible` usa
  `outline` explícito. Não remova: é o único indicador de teclado.
- O título do card usa `-webkit-line-clamp: 2` + `overflow-wrap: anywhere` para
  segurar títulos de 100+ caracteres em 375px. O `overflow-x: hidden` de
  `globals.css` é rede de segurança, não substituto disso.
- `formatPrice` usa espaço **não-quebrável** (vem do `Intl`); testes normalizam
  whitespace antes de comparar, senão quebram entre versões de ICU.
- O alias `@/` funciona nos testes por causa do `vitest.config.mts` na raiz — ele
  existe **só** para isso. Se um import `@/…` quebrar no Vitest mas passar no
  `next build`, é esse arquivo que está desatualizado, não o import.
- **Nunca nomeie o módulo de lógica diferindo do componente só no casing.**
  `propertyGallery.ts` ao lado de `PropertyGallery.tsx` faz o TypeScript resolver
  `@/components/PropertyGallery` para o `.ts` errado em filesystem
  case-insensitive (Windows, macOS) e quebra o `typecheck` com TS1149. Daí
  `propertyGalleryState.ts`, no mesmo espírito de `searchBarUrl.ts`.
- `:has(input:checked)` estiliza a opção selecionada do `SearchBar`; onde não
  houver suporte o radio nativo continua indicando o estado, só sem o destaque.
- Nenhum componente daqui chama a API.
