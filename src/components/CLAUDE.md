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
- **`FilterPanel`** — filtros de `/imoveis`, em **dois modos**: sidebar estática
  em ≥1025px e drawer lateral atrás do botão "Filtros" em ≤1024px. Recebe os
  valores vigentes por prop (`defaults: SearchFilters`) e a query string corrente
  (`currentQuery`), e navega com `router.push`. `filterPanelUrl.ts` guarda a
  lógica pura de montar/limpar a URL, a lista de tipos de imóvel e a contagem de
  filtros ativos exibida no botão.
- **`Skeleton/`** — biblioteca de primitivos de estado de carregamento
  (`SkeletonBox`, `SkeletonText`, `SkeletonCard`, `SkeletonDetailHero`,
  `SkeletonDetailData`, `SkeletonTableRow`), consumida pelos `loading.tsx` das
  rotas — hoje `src/app/imoveis/loading.tsx` usa `SkeletonCard`; o detalhe ainda
  tem esqueleto ad-hoc. Seis arquivos que compartilham um único CSS Module não caberiam na
  raiz sem virar ruído. Decisões, regras de resolução de larguras/colunas e
  gotchas em `Skeleton/CLAUDE.md`.
- **`ui/`** — primitivos genéricos sem domínio (`EmptyState`, `ErrorMessage`),
  cada um com pasta própria (`.tsx` + `.module.css` + `index.ts`). Ver
  `ui/CLAUDE.md`.

`imageFallback.ts` é compartilhado por card e galeria: detecta foto quebrada.

**A raiz é flat; subpasta só quando há coesão que justifique.** As duas que
existem chegaram por motivos diferentes e ambos valem como precedente:
`Skeleton/` é uma **família** que compartilha um CSS Module e um `@keyframes`, e
por isso mora junta na raiz; `ui/` é a coleção de primitivos **avulsos**, onde
cada componente tem seu próprio módulo e é usado sozinho. Primitivo genérico novo
nasce em `ui/`; componente de domínio continua flat na raiz.

Padrão do diretório: o `.tsx` cuida de markup e boundary de client; toda regra
testável mora num módulo `.ts` co-locado, porque o projeto usa Vitest **sem
jsdom/RTL** e não dá para renderizar componentes em teste (mesmo precedente de
`src/app/imoveis/searchFilters.ts`).

## Key decisions

- **Client no menor escopo possível.** `SearchBar`, `PropertyImage` e
  `PropertyGallery` são `'use client'`; as páginas que os aninham continuam Server
  Components. `PropertyCard` inteiro é servidor — só a imagem precisa de estado.
- **Primitivo não leva diretiva nenhuma** — vale para `ui/` e `Skeleton/`.
  Componente sem `'use client'` é *compartilhado*: renderiza no servidor quando
  importado por um Server Component e no cliente quando importado por um client.
  É o que deixa `EmptyState` servir a `/imoveis` (servidor) e `ErrorMessage`
  servir ao wrapper client que passa `onRetry`. **Callback não atravessa a
  fronteira servidor→cliente** — quem passa `onClick`/`onRetry` tem que ser
  client. Ver `ui/CLAUDE.md`.
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
  (`.search-bar*` em `src/app/globals.css`); `PropertyCard`, `PropertyGallery`,
  `FilterPanel`, `Skeleton/` e `ui/` usam **CSS Modules co-locado**, suportado nativamente pelo Next,
  sem dependência nova e sem inchar `globals.css`. **Componente novo nasce com CSS
  Module**; `globals.css` fica para reset e utilitários de layout.
- **Todo valor visual vem de `src/app/tokens.css`.** CSS Module consome
  `var(--color-*)`, `var(--text-*)`, `var(--radius-*)`, `var(--shadow-*)` e
  `var(--space-*)` sem import nenhum — as custom properties de `:root`
  cascateiam normalmente para dentro do módulo. **Cor, fonte, raio e sombra
  nunca entram como literal num componente**; literal só para dimensão própria
  do componente (`2.5rem` do ícone placeholder, `44px` de alvo de toque,
  `aspect-ratio`, as transições de 150ms). Token faltando → adicione em
  `tokens.css`, não no módulo. `src/app/designTokens.test.ts` reprova literais
  novos nos módulos da lista `consumers`; ao criar outro módulo, inclua-o lá.
- **Placeholder sem asset.** SVG inline — não existe `public/` no projeto e criar
  um só para isso adicionaria um request de rede por card sem foto.
- **`aspect-ratio` no contêiner da mídia** + `object-fit: cover` na foto: a altura
  não depende da imagem carregar, então o grid não pula quando uma foto falha.
- **`.mediaFrame` existe só para posicionar o badge.** O `.media`, dono do
  `aspect-ratio`, é renderizado **dentro** do client `PropertyImage`, nos dois
  caminhos (foto e placeholder). Envolver `<PropertyImage>` num `<div>` com
  `position: relative` no próprio `PropertyCard` mantém o badge do lado servidor,
  funciona igual sobre foto e sobre placeholder sem duplicar markup e não toca no
  `aspect-ratio`. A alternativa — `position: relative` no `.media` e o badge como
  `children` de `PropertyImage` — foi rejeitada por arrastar markup de servidor
  para dentro de um componente client sem ganho.
- **`FilterPanel` é `'use client'`, `/imoveis` continua Server Component.** Mesmo
  padrão do `SearchBar`: formulário não controlado, `FormData` no `onSubmit`.
- **A faixa (sidebar × drawer) vem de `useSyncExternalStore` + `matchMedia`, não
  de `useEffect`.** Só uma das duas árvores existe no DOM, que é o que os
  critérios pedem (nada de botão "Filtros" escondido por CSS em desktop, nada de
  `<aside>` no fluxo em mobile). `getServerSnapshot` devolve `false` (desktop),
  então o HTML servido traz a sidebar; o CSS a esconde abaixo de 1025px
  reservando 44px com `visibility`, para a chegada do botão na hidratação não
  empurrar o grid. O painel já dependia de JS antes disso (o submit é
  `onSubmit` + `router.push`, sem `action`).
- **O estado de aberto vive no próprio painel**, não na página nem num wrapper.
  `/imoveis` é Server Component e o `key={currentQuery}` que ela já passa remonta
  o painel a cada navegação — logo o drawer nasce fechado no resultado novo, sem
  estado a resetar e sem flash.
- **Scroll lock e devolução de foco na limpeza do `ref` callback** (recurso do
  React 19), não em `useEffect`: cobre também o desmonte com o drawer aberto
  (navegação, voltar no browser), que um `onClick` de fechar não cobriria. O lock
  precisa ir no `<html>` **e** no `<body>` — ver Gotchas.
- **Overlay é `<button>` dentro do elemento `role="dialog"`.** Como `<div>` com
  `onClick` ele não teria foco visível nem seria anunciado; como irmão do diálogo
  seria focável mas escondido do leitor de tela por `aria-modal`.
- **A URL é lida só pela página, nunca por `useSearchParams()` no painel.** A
  página passa `defaults` (de `parseSearchFilters`) e `currentQuery` (de
  `toSearchParams`) por prop, evitando o boundary de Suspense que
  `useSearchParams()` exigiria e mantendo uma única fonte de leitura da URL.
- **Lista fixa de `property_type` em `PROPERTY_TYPE_OPTIONS`.** A API não expõe
  endpoint que enumere os valores; a lista é uma **premissa** e é o único ponto a
  editar quando o contrato real for conhecido. Valor fora dela é descartado.
- **Amenidades ficam de fora.** `amenities` é só `string[]` em `Property`, sem
  enumeração possível para renderizar checklist. `per_page` e `sort` idem.
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

### FilterPanel

- **`Todos`/`Qualquer` = param ausente.** Ao contrário do `SearchBar` (cujo
  default é `sale`), o painel **não** tem filtro implícito: pré-selecionar
  "Comprar" quando a URL não traz `transaction_type` seria mentir sobre o
  resultado exibido.
- Regras de omissão iguais às de `buildSearchUrl`/`parseSearchFilters`: texto
  vazio ou só com espaços, valor não numérico, negativo, fracionário em campo de
  contagem, `transaction_type`/`property_type` fora do contrato → **param não é
  emitido**. **Zero é válido e é enviado** (`parking_spots=0`).
- `4+` envia `bedrooms=4`, `3+` envia `bathrooms=3`, `2+` envia
  `parking_spots=2` — o backend trata o valor como mínimo. No pré-preenchimento o
  caminho inverso escolhe a maior opção `<=` valor da URL, então `?bedrooms=7`
  marca `4+`.
- Aplicar **reescreve todos** os params do painel a partir do formulário e
  **remove `page`** (reset de paginação); `q` e params desconhecidos (inclusive
  repetidos) são preservados na ordem original. Limpar faz só a remoção e navega
  imediatamente, sem exigir "Aplicar" depois.
- `property_type` fora de `PROPERTY_TYPE_OPTIONS` cai em `Qualquer` no
  pré-preenchimento e **some ao aplicar** — intencional: o `<select>` não pode
  exibir opção que não existe, e manter o param escondido faria o painel mentir.
- **Sem validação cruzada** de `min_price > max_price`: a tela nunca bloqueia o
  submit; a API decide o resultado e o estado vazio já existe.
- Nenhum filtro preenchido → `/imoveis` puro, sem `?` pendurado.
- **`countActiveFilters` é o rótulo do botão** (`Filtros` / `Filtros (3)`). Itera
  `FILTER_PARAM_KEYS`, então `page` e `q` ficam de fora por construção;
  `min_price` e `max_price` contam separado; **`0` conta** (`parking_spots=0` é
  filtro); texto só com espaços não conta. `transaction_type` e `property_type`
  passam pelas mesmas validações do painel, porque `parseSearchFilters` **não**
  valida `property_type` contra `PROPERTY_TYPE_OPTIONS` — sem isso,
  `?property_type=castelo` exibiria "Qualquer" no `<select>` e mesmo assim
  contaria como filtro ativo, e o botão mentiria.
- O drawer fecha por "×", clique no overlay e `Esc`; Aplicar/Limpar fecham antes
  de navegar, para o `overflow` do body ser liberado mesmo que o remount demore.

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
- **Badge "N imobiliárias" só a partir de 2 anúncios** (`formatListingsBadge`). A
  contagem vem de `listings_count`; se o campo estiver ausente ou não for número
  finito, cai para `listings.length` quando `listings` existir (caso
  `PropertyDetail`), senão não há contagem. O valor passa por `Math.trunc`, então
  `2.9` vira "2 imobiliárias". `0`, `1`, negativo, fracionário `< 2`, `NaN`,
  `Infinity`, `null` e ausente → `null`, e **nada** vai ao DOM (sem elemento
  vazio). Nunca há caso de singular: o badge só existe no plural. Se a API não
  mandar o campo, o card simplesmente não sinaliza a agregação — degradação
  prevista, não quebra.

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
- `src/app/page.tsx` consome o `SearchBar` e, via `src/app/FeaturedProperties.tsx`,
  o `PropertyCard` com o `headingLevel` default (`3`) — os cards ficam sob o `h2`
  da seção "Imóveis em destaque"; `src/app/imoveis/page.tsx` consome o
  `PropertyCard` no grid de resultados, com `headingLevel={2}`, e reusa
  `toTransactionType`/`SEARCH_RESULTS_PATH` de `searchBarUrl.ts`. Esse módulo é
  puro e sem `'use client'` de propósito: precisa ser importável de Server
  Components. `src/app/imoveis/[id]/page.tsx` consome o `PropertyGallery`.
- `src/app/imoveis/page.tsx` consome o `FilterPanel` como primeiro item da grade
  `.layout`, passando `defaults`, `currentQuery` e `key={currentQuery}` — quem
  decide entre `<aside>` (sidebar) e botão + `role="dialog"` (drawer) é o próprio
  painel —, e o `ui/EmptyState` no bloco de lista vazia;
  `src/app/imoveis/ResultsError.tsx` consome o `ui/ErrorMessage`.
  `src/app/imoveis/loading.tsx` consome `Skeleton/SkeletonCard`.

## Gotchas

- `useRouter` **tem** que vir de `next/navigation`. O de `next/router` é Pages
  Router e quebra em runtime no App Router.
- **Formulário não controlado não se reidrata sozinho quando a URL muda.** Se o
  React reaproveitar a instância do `FilterPanel` (voltar/avançar no browser,
  clicar em "Próximo"), os `defaultValue` não são reaplicados e o painel passa a
  mentir sobre a busca vigente. Por isso `/imoveis` passa `key={currentQuery}`,
  forçando remount. O preço é perder o foco do campo após aplicar — aceitável
  num painel de sidebar, e o alternativo seria espelhar o DOM em `useState`.
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
  teclado. Favoritar/compartilhar terá que reestruturar isso. Por isso o badge de
  imobiliárias é um `<p>` sobreposto, e sem `aria-hidden`: o texto precisa ser
  lido pelo leitor de tela dentro do link, não virar um alvo de clique próprio.
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
- **`document.body.style.overflow = 'hidden'` sozinho NÃO trava a rolagem aqui.**
  `globals.css` põe `overflow-x: hidden` no `html`, e o overflow do `body` só
  propaga para o viewport quando o do `html` é `visible`. O drawer trava os dois
  e restaura os valores inline anteriores na limpeza.
- **O trap de `Tab` coleta os focáveis por query no contêiner do diálogo**, não
  por lista fixa: campo novo dentro do drawer entra no ciclo sozinho. Ele só
  intercepta nas pontas (primeiro/último), então a navegação nativa entre radios
  continua funcionando.
- `:has(input:checked)` estiliza a opção selecionada do `SearchBar`; onde não
  houver suporte o radio nativo continua indicando o estado, só sem o destaque.
- Nenhum componente daqui chama a API.
