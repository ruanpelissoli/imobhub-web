# src/lib — módulo de dados

## Purpose

Único ponto de entrada para dados da `imobhub-api` em toda a aplicação.
`types.ts` espelha o contrato JSON da API; `api.ts` faz as requisições, monta a
query string, aplica timeout e traduz falhas em `ApiError` com mensagem em
português pronta para a UI.

**Nenhum componente deve chamar `fetch` direto para a API.** Se um endpoint novo
for necessário, ele nasce aqui.

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
- Resultado vazio (`data: []`) e `page` além do total **não são erro**: a
  resposta é propagada como veio.

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
