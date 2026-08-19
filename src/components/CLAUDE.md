# src/components — componentes de UI compartilhados

## Purpose

Componentes de UI que carregam interatividade, aninhados dentro de páginas que
continuam Server Components:

- `SearchBar` — barra de busca da Home, que a tela de Resultados vai reaproveitar
  para refinar a busca sem voltar para `/`.
- `PropertyGallery` — galeria de fotos da tela de detalhe (`/imoveis/[id]`).

Cada um tem um módulo `.ts` irmão com a lógica pura: `searchBarUrl.ts` (montagem
da URL de destino) e `propertyGalleryState.ts` (navegação circular entre fotos e
rótulos).

## Key decisions

- **Client no menor escopo possível.** `SearchBar` e `PropertyGallery` são
  `'use client'`; a Home e a tela de detalhe continuam Server Components e apenas
  aninham o componente. A única interatividade real é, respectivamente, o submit e
  a troca de foto.
- **`<img>` nativo na galeria, não `next/image`.** As fotos são URLs remotas de
  scraping, de hosts arbitrários, e `next.config.ts` não define
  `images.remotePatterns` — `next/image` quebraria em runtime para qualquer host
  fora da allowlist. Daí o `eslint-disable` do `@next/next/no-img-element`.
- **Helper de URL próprio em vez de `buildQueryString` de `src/lib/api.ts`.**
  `src/lib/CLAUDE.md` registra a decisão de não arrastar o módulo de rede para o
  bundle do cliente — `api.ts` carrega `ApiError`, timeouts e a base URL, nada
  disso necessário para montar um path. `buildSearchUrl` espelha a mesma regra de
  omissão com `URLSearchParams`.
- **Lógica pura extraída para módulo separado.** O projeto usa Vitest **sem
  jsdom/RTL**; não dá para renderizar componentes em teste. Mesmo precedente de
  `src/app/imoveis/searchParams.ts`: a regra testável mora fora do `.tsx`. O
  módulo irmão nunca difere do componente **só no casing** (ver Gotchas).
- **Formulário não controlado (`defaultValue`/`defaultChecked` + `FormData`).**
  Sem `useState` para espelhar o que o DOM já guarda, e os props `defaultQuery`/
  `defaultTransactionType` deixam a tela de Resultados reidratar a barra com a
  busca vigente sem nenhuma mudança no componente.
- **Radios em `<fieldset>`/`<legend>`, não `<select>`.** Duas opções fixas ficam
  visíveis de uma vez e cada `<label>` vira alvo de toque de 44px.

## Business logic

- `buildSearchUrl` omite `q` quando o texto é vazio, só espaços ou ausente — a URL
  nunca contém `?q=` nem `q=undefined`. O texto é `trim`ado antes de virar param.
- `transaction_type` default é `sale` ("Comprar" pré-selecionado). Valor fora do
  contrato (`sale` | `rent`) é descartado por `toTransactionType` e cai no default.
- Sem nenhum filtro, o retorno é `/imoveis` puro, sem `?` pendurado.
- O submit é `onSubmit` no `<form>`, não `onClick` no botão: Enter no campo de
  texto também precisa navegar.
- `PropertyGallery`: navegação **circular**, sem botão desabilitado — da última
  foto vai para a primeira e vice-versa. Com 1 foto, botões e contador somem; sem
  fotos (`null`/ausente/`[]`), só o placeholder. Foto cujo carregamento falha
  entra num `Set` de quebradas e cai no mesmo placeholder via `onError`, para
  nunca exibir o ícone de imagem quebrada do browser.

## Dependencies

- `next/navigation` (`useRouter().push` — client-side, sem full page reload).
- `@/lib/types` apenas para o tipo `TransactionType`, sem importar `api.ts`.
- `@/lib/format` para `FALLBACK_TITLE` — é módulo de apresentação puro, sem rede;
  não confundir com `api.ts`.
- Estilos em `src/app/globals.css` (classes `.search-bar*`, `.property-gallery*`);
  não há CSS Modules nem framework de CSS no projeto.

## Gotchas

- `useRouter` **tem** que vir de `next/navigation`. O de `next/router` é Pages
  Router e quebra em runtime no App Router.
- `URLSearchParams` codifica espaço como `+`, não `%20` (form-urlencoded). É
  válido e o Next decodifica corretamente — os testes esperam `+`.
- `:has(input:checked)` estiliza a opção selecionada; onde não houver suporte o
  radio nativo continua indicando o estado, só sem o destaque.
- **Nunca nomeie o módulo de lógica diferindo do componente só no casing.**
  `propertyGallery.ts` ao lado de `PropertyGallery.tsx` faz o TypeScript resolver
  `@/components/PropertyGallery` para o `.ts` errado em filesystem
  case-insensitive (Windows, macOS) e quebra o `typecheck` com TS1149. Daí
  `propertyGalleryState.ts`, no mesmo espírito de `searchBarUrl.ts`.
- Nenhuma chamada de API acontece aqui — os componentes só montam URL, navegam ou
  trocam de foto.
