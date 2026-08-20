# /imoveis/[id] — tela de detalhe do imóvel

## Purpose

Tela canônica de um imóvel: galeria de fotos, título, preço, endereço, atributos,
comodidades, descrição e a seção "Anúncios disponíveis" (as imobiliárias que
anunciam o imóvel, com preço por anúncio e link externo), tudo a partir de
`getPropertyById(id)`. É a página mais acessada do produto — cada link de
resultado e cada link compartilhado cai aqui.

A rota tem as três fronteiras do App Router: `page.tsx` (servidor), `loading.tsx`
(Suspense) e `error.tsx` (client).

## Key decisions

- **Página Server Component, galeria client isolada.** Só a navegação entre fotos
  precisa de estado; `PropertyGallery` é o único `'use client'` da tela. Mesmo
  padrão de Home + `SearchBar`.
- **`loading.tsx` em vez de `useState` de `isLoading`.** A busca roda no servidor
  com `revalidate: 300`; o equivalente correto do "estado de carregamento" é o
  Suspense da rota.
- **`<Link href="/imoveis">` em vez de `router.back()`.** `router.back()` obrigaria
  a página inteira a virar client e, num acesso direto (link compartilhado),
  levaria o usuário para fora do site. **Consequência aceita:** os filtros da
  busca anterior não são preservados no retorno — revisitar quando `/imoveis`
  tiver filtros reais ligados à API.
- **`<img>` nativo em vez de `next/image`.** As fotos são URLs remotas de scraping,
  de hosts arbitrários, e `next.config.ts` não define `images.remotePatterns` —
  `next/image` quebraria em runtime para qualquer host fora da allowlist. Definir
  essa allowlist é decisão à parte.
- **Formatação em `src/lib/format.ts`, estado da galeria em
  `src/components/propertyGalleryState.ts`, regras dos anúncios em `listings.ts`
  co-locado.** Vitest roda sem jsdom/RTL, então a regra testável mora fora do
  `.tsx` (precedente de `searchParams.ts`). O nome `listings.ts` não colide por
  caixa com nenhum `.tsx` do diretório — ver o TS1149 em `src/components/CLAUDE.md`.
  `toListingViews` devolve a lista pronta (nome, preço formatado, url validada,
  rótulo acessível) e o `page.tsx` só desenha `<ul>/<li>` — sem componente
  dedicado, porque não há estado nem interatividade que justifique client.
- **Estilos em `propertyDetail.module.css` co-locado**, não em `globals.css`. É a
  convenção estabelecida pelo `PropertyCard`; `globals.css` fica para reset e
  utilitários de layout. `page`, `loading` e `error` compartilham esse módulo.
- **Cor, raio, fonte e espaçamento vêm de `src/app/tokens.css`** via `var(--*)`,
  sem import (as custom properties de `:root` cascateiam para dentro do módulo).
  Restam quatro literais que a spec de tokens ainda não cobre — `#f4f6fa` dos
  chips e esqueletos, `#7ba4ff` do botão desabilitado, o `999px` da pílula e o
  `0.9375rem` dos chips. Não invente token local para eles: o inventário e o
  caminho de fechamento estão em `src/app/CLAUDE.md`.

## Business logic

- **404 → `notFound()`**: `loadProperty` captura o `ApiError` com `status === 404`
  (via `isApiError`) e devolve `null`; a página chama `notFound()` e cai no
  `src/app/not-found.tsx`. Qualquer outro erro (rede, timeout, 5xx) propaga e cai
  no `error.tsx`.
- **O `error.tsx` só exibe `error.message` quando ela está na allowlist de
  `src/lib/messages.ts`** (`resolveErrorMessage`); qualquer outra coisa vira o
  texto genérico em português. Ver Gotchas — em produção a mensagem não chega
  intacta.
- **`notFound()` fica FORA do `try`.** Ele funciona lançando uma exceção; chamado
  dentro do `catch`/`try` de `loadProperty` seria engolido e viraria erro genérico.
- Comodidades e descrição: a seção inteira **não é renderizada** quando o campo é
  ausente, `null`, `[]` ou string só de espaços. Nada de "Nenhuma comodidade".
- Atributos ausentes somem individualmente; `0` vira rótulo próprio ("Sem vagas"),
  porque zero vagas é informação, não ausência de dado. **Difere do
  `PropertyCard`**, que omite zerados — o card é resumo, esta tela é a canônica.
- Preço zero ou ausente vira "Preço sob consulta", igual ao card: a formatação tem
  uma dona só (`src/lib/format.ts`).
- **Anúncios (`toListingViews`)**: a seção some inteira quando `listings` é
  ausente, `null` ou `[]` — mesma convenção de comodidades/descrição, sem
  empty-state. `agency_name` vazio/nulo/só espaços → "Imobiliária". Preço
  inválido **não** esconde o item: vira "Preço sob consulta". `url` só é aceita
  em `http:`/`https:`; qualquer outra coisa (vazia, relativa, `javascript:`,
  `ftp:`) renderiza o item **sem** link, em vez de um `<a href="">` quebrado.
- **Ordenação por preço crescente**, com os anúncios sem preço válido no fim
  preservando a ordem original. É deliberado: a seção existe para comparar
  preços, então a ordem da API não é respeitada aqui. `key` combina índice e `id`
  porque o scraping repete/omite `id`.
- O link tem `aria-label` "Ver anúncio original de {imobiliária}": sem isso um
  leitor de tela ouve N links idênticos sem saber de quem é cada um.
- `generateMetadata` reusa `loadProperty`; sucesso → título do imóvel, 404 →
  "Imóvel não encontrado", outros erros → "Imóvel". **Metadata nunca derruba a
  página.** Não gera request extra: o `fetch` do Next deduplica requisições
  idênticas dentro do mesmo render.

## Dependencies

- `src/lib/api.ts` (`getPropertyById`, `isApiError`) — nenhuma chamada `fetch`
  direta aqui, ver `src/lib/CLAUDE.md`.
- `src/lib/format.ts`, `src/lib/messages.ts`, `src/components/PropertyGallery.tsx`.
- Estilos em `propertyDetail.module.css` (co-locado) e
  `src/components/PropertyGallery.module.css`.

## Gotchas

- **Divergência de contrato pendente.** O contrato publicado de
  `GET /api/v1/properties/{id}` (#29) traz `canonical_address` e **não** traz
  `title` nem `price` — os preços vivem em `listings[].price_raw`. O
  `src/lib/types.ts` do repo modela `title`/`address`/`price`. Alinhar afetaria
  `searchProperties` e `api.test.ts`, então segue fora do escopo desta rota.
  Mitigação: todos os formatadores toleram campo ausente em runtime (título vazio
  → "Imóvel", preço ausente → `PRICE_ON_REQUEST` ("Preço sob consulta"), endereço
  junta só o que existir), então a tela degrada em vez de quebrar. **Na seção de
  anúncios isso é visível:** se a API só enviar `price_raw`, todos os itens
  mostram "Preço sob consulta" e a ordenação cai na ordem original da API. É
  degradação prevista, não bug — corrigir é alinhar o contrato, não a UI.
- **`target="_blank"` exige `rel="noopener noreferrer"`** nos links de anúncio: o
  destino é um domínio de terceiro vindo de scraping, e sem `noopener` ele ganha
  acesso a `window.opener`.
- **Em produção o Next redige a mensagem de erros de Server Component** antes de
  entregá-la ao boundary de client: `error.message` chega como um parágrafo
  técnico em inglês ("An error occurred in the Server Components render…"). Como
  não é string vazia, um fallback do tipo `error.message || 'texto'` **não**
  dispara e o usuário vê inglês. Por isso a allowlist em `resolveErrorMessage`.
  Em `next dev` a mensagem chega intacta, então o bug não aparece na validação
  manual — só em `next build && next start`.
- **`reset()` sozinho não refaz o fetch** quando o erro veio do servidor: ele
  re-renderiza o boundary a partir do payload RSC que já falhou. Daí o
  `router.refresh()` junto, dentro de `startTransition`. Não remova um dos dois.
- **Esta rota trata erro por `error.tsx`; a irmã `/imoveis` trata por `try/catch`
  na página.** Não é descuido: `error.tsx` era critério de aceite desta task, e
  `/imoveis` chegou depois com o padrão que preserva a mensagem original. O
  primitivo `ErrorMessage` (`@/components/ui/ErrorMessage`), que `/imoveis` usa
  via `ResultsError`, **não serve aqui**: a API dele é `{ message?, onRetry? }` e
  esta rota precisa de heading próprio, estado "Tentando…", link "← Voltar aos
  resultados" e um retry que chame `reset()` **e** `router.refresh()`. Forçar o
  primitivo a caber tudo isso o transformaria num canivete de props. Se um dia
  unificar, o caminho é migrar esta rota para `try/catch` — aí
  `resolveErrorMessage` deixa de ser necessário nela e o primitivo passa a caber.
- A página não renderiza header próprio nem `<main>` — `layout.tsx` já fornece
  ambos.
- No Next 15 `params` é `Promise` e precisa de `await`.
- Foto com URL quebrada cai no mesmo placeholder; o `onError` sozinho não basta,
  ver `src/components/CLAUDE.md`.
