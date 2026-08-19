# /imoveis/[id] — tela de detalhe do imóvel

## Purpose

Tela canônica de um imóvel: galeria de fotos, título, preço, endereço, atributos,
comodidades e descrição, a partir de `getPropertyById(id)`. É a página mais
acessada do produto — cada link de resultado e cada link compartilhado cai aqui.

A rota tem as três fronteiras do App Router: `page.tsx` (servidor), `loading.tsx`
(Suspense) e `error.tsx` (client). A seção de imobiliárias/`listings` **não** está
aqui ainda — vem na task #8.

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
  `src/components/propertyGalleryState.ts`.** Vitest roda sem jsdom/RTL, então a
  regra testável mora fora do `.tsx` (precedente de `searchParams.ts`).
- **Estilos em `propertyDetail.module.css` co-locado**, não em `globals.css`. É a
  convenção estabelecida pelo `PropertyCard`; `globals.css` fica para reset e
  utilitários de layout. `page`, `loading` e `error` compartilham esse módulo.

## Business logic

- **404 → `notFound()`**: `loadProperty` captura o `ApiError` com `status === 404`
  (via `isApiError`) e devolve `null`; a página chama `notFound()` e cai no
  `src/app/not-found.tsx`. Qualquer outro erro (rede, timeout, 5xx) propaga e cai
  no `error.tsx`, que reexibe `error.message` — as mensagens de `api.ts` já vêm em
  português.
- **`notFound()` fica FORA do `try`.** Ele funciona lançando uma exceção; chamado
  dentro do `catch`/`try` de `loadProperty` seria engolido e viraria erro genérico.
- Comodidades e descrição: a seção inteira **não é renderizada** quando o campo é
  ausente, `null`, `[]` ou string só de espaços. Nada de "Nenhuma comodidade".
- Atributos ausentes somem individualmente; `0` vira rótulo próprio ("Sem vagas"),
  porque zero vagas é informação, não ausência de dado. **Difere do
  `PropertyCard`**, que omite zerados — o card é resumo, esta tela é a canônica.
- Preço zero ou ausente vira "Preço sob consulta", igual ao card: a formatação tem
  uma dona só (`src/lib/format.ts`).
- `generateMetadata` reusa `loadProperty`; sucesso → título do imóvel, 404 →
  "Imóvel não encontrado", outros erros → "Imóvel". **Metadata nunca derruba a
  página.** Não gera request extra: o `fetch` do Next deduplica requisições
  idênticas dentro do mesmo render.

## Dependencies

- `src/lib/api.ts` (`getPropertyById`, `isApiError`) — nenhuma chamada `fetch`
  direta aqui, ver `src/lib/CLAUDE.md`.
- `src/lib/format.ts`, `src/components/PropertyGallery.tsx`.
- Estilos `.property-*` em `src/app/globals.css`.

## Gotchas

- **Divergência de contrato pendente.** O contrato publicado de
  `GET /api/v1/properties/{id}` (#29) traz `canonical_address` e **não** traz
  `title` nem `price` — os preços vivem em `listings[].price_raw`. O
  `src/lib/types.ts` do repo modela `title`/`address`/`price`. Alinhar afetaria
  `searchProperties`, `api.test.ts` e a task #8, então ficou fora do escopo aqui.
  Mitigação: todos os formatadores toleram campo ausente em runtime (título vazio
  → "Imóvel", preço ausente → "Preço não informado", endereço junta só o que
  existir), então a tela degrada em vez de quebrar.
- A página não renderiza header próprio nem `<main>` — `layout.tsx` já fornece
  ambos.
- No Next 15 `params` é `Promise` e precisa de `await`.
- Foto com URL quebrada cai no mesmo placeholder; o `onError` sozinho não basta,
  ver `src/components/CLAUDE.md`.
