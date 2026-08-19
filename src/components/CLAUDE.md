# src/components — componentes de UI compartilhados

## Purpose

Componentes reutilizados por mais de uma rota:

- **`SearchBar`** — barra de busca principal da Home, que a tela de Resultados vai
  reaproveitar para refinar a busca sem voltar para `/`. `searchBarUrl.ts` guarda
  a lógica pura de montagem da URL de destino.
- **`PropertyCard`** — card de imóvel dos destaques da Home e do grid de
  `/imoveis`. Recebe dados por prop (`property: Property`) e **nunca chama a
  API** — quem busca é a página. `propertyCard.format.ts` guarda a formatação.
- **`FilterPanel`** — painel lateral de filtros de `/imoveis`. Recebe os valores
  vigentes por prop (`defaults: SearchFilters`) e a query string corrente
  (`currentQuery`), e navega com `router.push`. `filterPanelUrl.ts` guarda a
  lógica pura de montar/limpar a URL e a lista de tipos de imóvel.

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
- **Placeholder sem asset.** SVG inline em `PropertyImage.tsx` — não existe
  `public/` no projeto e criar um só para isso adicionaria um request de rede por
  card sem foto.
- **`aspect-ratio: 4 / 3` no contêiner da mídia** + `object-fit: cover` na foto:
  a altura do card não depende da imagem carregar, então o grid não pula quando
  uma foto falha.
- **`FilterPanel` é `'use client'`, `/imoveis` continua Server Component.** Mesmo
  padrão do `SearchBar`: formulário não controlado, `FormData` no `onSubmit`.
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
- **Formulário não controlado não se reidrata sozinho quando a URL muda.** Se o
  React reaproveitar a instância do `FilterPanel` (voltar/avançar no browser,
  clicar em "Próximo"), os `defaultValue` não são reaplicados e o painel passa a
  mentir sobre a busca vigente. Por isso `/imoveis` passa `key={currentQuery}`,
  forçando remount. O preço é perder o foco do campo após aplicar — aceitável
  num painel de sidebar, e o alternativo seria espelhar o DOM em `useState`.
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
