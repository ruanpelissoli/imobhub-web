# src/lib — módulo de dados e formatação

## Purpose

Único ponto de entrada para dados da `imobhub-api` em toda a aplicação.
`types.ts` espelha o contrato JSON da API; `api.ts` faz as requisições, monta a
query string, aplica timeout e traduz falhas em `ApiError` com mensagem em
português pronta para a UI.

**Nenhum componente deve chamar `fetch` direto para a API.** Se um endpoint novo
for necessário, ele nasce aqui.

`messages.ts` guarda os textos de erro voltados ao usuário e a allowlist
`resolveErrorMessage`. Mora fora de `api.ts` para que um boundary de erro
`'use client'` possa importá-lo sem arrastar o módulo de rede para o bundle —
mesmo espírito de `format.ts`. **Mensagem nova de erro nasce aqui**, não como
literal solto em `api.ts`, senão o `error.tsx` não consegue reconhecê-la. O
módulo também guarda os textos fixos de estado vazio e o fallback genérico de
carregamento consumidos pelos primitivos de `@/components/ui` — mesma razão:
texto de tela tem uma dona só.

`format.ts` é coisa diferente e deliberadamente separada: **apresentação pura, sem
rede** — preço em BRL, área em m², endereço concatenado, contagens no singular ou
plural. É seguro importar de qualquer componente client; `api.ts` não é (arrasta
`ApiError`, timeouts e a base URL para o bundle). É a **única dona** da formatação
de preço e área: `PropertyCard` e a tela de detalhe consomem daqui
(`propertyCard.format.ts` só re-exporta), porque o mesmo imóvel mostrando
`R$ 850.000` num lugar e `R$ 850.000,00` no outro é bug de produto.

## Key decisions

- **`fetch` nativo, sem axios.** O `fetch` do Next carrega as diretivas de cache
  (`cache`, `next.revalidate`) que precisamos por função; um cliente externo
  perderia isso e adicionaria peso ao bundle.
- **`snake_case` nos tipos**, espelhando exatamente o JSON da API. Não há camada
  de conversão para camelCase — uma tradução a mais seria um ponto extra de
  divergência silenciosa com o backend.
- **Tipos separados em `types.ts`.** Componentes importam tipos sem arrastar o
  módulo de rede para o bundle do cliente.
- **Base URL com fallback, não erro na inicialização.** Falhar no boot quebraria
  build e CI por uma dependência que só é exercida em runtime.
- **Cache por função, explícito:** listagem `no-store` (resultado depende de
  filtros arbitrários — cachear geraria entradas quase sempre únicas e serviria
  dados velhos logo após um scrape); detalhe `revalidate: 300` (muda só entre
  scrapes). As duas opções são mutuamente exclusivas no Next 15 — nunca use as
  duas na mesma request.

## Business logic

- `buildQueryString` **omite** `undefined`, `null` e strings vazias (após
  `trim`). `min_price=` vazio nunca vai para a API. Zero é valor válido e é
  enviado.
- Arrays (`amenities`) viram **parâmetros repetidos**
  (`amenities=piscina&amenities=academia`). Premissa assumida — o contrato real
  da `imobhub-api` (#28/#29) não estava fechado. Se divergir, o ajuste é em um
  ponto só: `buildQueryString`.
- Filtros vazios (`{}`) produzem URL sem `?` pendurado.
- Mapeamento status → mensagem: `404` no detalhe → "Imóvel não encontrado.";
  demais `4xx` → requisição inválida; `5xx` → erro de servidor; falha de rede →
  status `0`; timeout (10s) → status `408`; corpo não-JSON ou não-objeto →
  `invalid_response`.
- **Nenhum caminho de falha retorna `null` silenciosamente** — todo erro vira
  `ApiError`.
- `resolveErrorMessage` **não** confia em `error.message` cegamente: em produção o
  Next redige mensagens de Server Component e entrega um texto em inglês. Só o que
  está na allowlist é exibido; o resto vira `GENERIC_ERROR_MESSAGE`. Ao adicionar
  uma mensagem **que o `ApiError` emite**, inclua-a no `Set` — senão ela nunca
  chega à tela via `error.tsx`. O `Set` é só isso: **não** entram nele os textos
  de UI que o módulo também hospeda (`GENERIC_LOAD_ERROR_MESSAGE`,
  `EMPTY_SEARCH_*`, `EMPTY_FEATURED_TITLE`, `FEATURED_LOAD_ERROR_MESSAGE`,
  `PROPERTY_NOT_FOUND_TITLE`, `PROPERTY_NOT_FOUND_DESCRIPTION`), que são
  conteúdo de tela e nunca
  chegam como `error.message`. Incluí-los faria `resolveErrorMessage` repassar um
  texto genérico como se fosse diagnóstico nosso.
- **`PROPERTY_NOT_FOUND_MESSAGE` e `PROPERTY_NOT_FOUND_TITLE` são coisas
  diferentes de propósito.** A primeira é a mensagem que o `ApiError` de 404 emite
  ("Imóvel não encontrado.", com ponto final) e pertence ao `Set`; a segunda é o
  título do `EmptyState` de `imoveis/[id]/not-found.tsx`, sem ponto, no molde de
  `EMPTY_SEARCH_TITLE`. Reusar a primeira como título traria o ponto final para a
  tela; alterar o valor dela para tirá-lo quebraria a allowlist e faria o
  `error.tsx` deixar de reconhecer o 404.
- Resultado vazio (`data: []`) e `page` além do total **não são erro**: a
  resposta é propagada como veio.

### `format.ts`

- **Preço e área só existem quando são positivos.** `0`, negativo, `NaN` ou
  ausente → "Preço sob consulta" e `null`, respectivamente. Um imóvel de `R$ 0` ou
  `0 m²` é dado sujo de scraping, não fato — nunca exiba como valor real.
- Preço em BRL **sem centavos** (`maximumFractionDigits: 0`) e área arredondada ao
  m² inteiro: anúncio de imóvel não mostra centavos.
- **`formatCount` é a exceção deliberada: zero é informação.** "Sem vagas" é
  diferente de vagas desconhecidas. O card compacto omite atributos zerados
  (`buildAttributes`), a tela de detalhe os exibe (`formatAttributes`) — na tela
  canônica, silêncio seria lido como "não sabemos".
- `formatAddress` pula partes vazias sem deixar vírgula pendurada e retorna `null`
  quando nada sobra.
- `toAmenityList` aplica `trim`, descarta vazios e **remove duplicatas** mantendo a
  primeira ocorrência — o scraping repete comodidade com frequência.
- Título vazio cai em `FALLBACK_TITLE` ("Imóvel"), reusado pela galeria no `alt`.

## Dependencies

- `imobhub-api`: `GET /api/v1/properties` e `GET /api/v1/properties/:id`.
- `NEXT_PUBLIC_API_URL` (fallback `http://localhost:8080`), ver `.env.example`.

## Gotchas

- `NEXT_PUBLIC_*` é inlined no bundle do cliente em build time — a URL da API é
  pública. Aceitável enquanto a API não tem auth; não coloque segredo aí.
- `photos`, `amenities`, `description` e `listings` podem vir ausentes ou nulos.
  Consumidores devem usar `?? []` / optional chaining, nunca `.map` direto.
- `ApiError` usa `Object.setPrototypeOf` para que `instanceof` sobreviva ao
  transpile; prefira o type guard `isApiError` em código de UI.
- **`types.ts` diverge do contrato publicado de #29**, que traz
  `canonical_address` e **não** traz `title` nem `price` (os preços vivem em
  `listings[].price_raw`). Alinhar afeta `searchProperties`, `api.test.ts` e a
  task #8 — pendência aberta, registrada também em
  `src/app/imoveis/[id]/CLAUDE.md`. Enquanto isso, `format.ts` tolera todo campo
  ausente em runtime para a UI degradar em vez de quebrar.
- **`Property.listings_count` é premissa, não contrato confirmado.** Foi
  adicionado como `number | null` **opcional** para o badge "N imobiliárias" do
  `PropertyCard`, na mesma pendência de #29. Se a API ainda não devolver o campo,
  o badge apenas não aparece — nenhuma chamada extra, nenhum erro. Se o backend
  nomear diferente, o ajuste fica em dois pontos: aqui e a resolução em
  `formatListingsBadge` (`src/components/propertyCard.format.ts`), que também
  aceita `listings.length` como fallback.
- Os testes comparam preço com a saída do próprio `Intl`, não com string literal:
  o separador de milhar e o espaço após `R$` variam entre versões de ICU.
