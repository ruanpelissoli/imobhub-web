# src/components — componentes de UI compartilhados

## Purpose

Componentes reutilizados por mais de uma rota. Hoje só o `SearchBar`: a barra de
busca principal da Home, que a tela de Resultados vai reaproveitar para permitir
refinar a busca sem voltar para `/`.

`searchBarUrl.ts` guarda a lógica pura de montagem da URL de destino, separada do
componente.

## Key decisions

- **`SearchBar` é `'use client'`, a Home continua Server Component.** A única
  interatividade real é o submit; a página apenas aninha o componente client.
- **Helper de URL próprio em vez de `buildQueryString` de `src/lib/api.ts`.**
  `src/lib/CLAUDE.md` registra a decisão de não arrastar o módulo de rede para o
  bundle do cliente — `api.ts` carrega `ApiError`, timeouts e a base URL, nada
  disso necessário para montar um path. `buildSearchUrl` espelha a mesma regra de
  omissão com `URLSearchParams`.
- **Lógica pura extraída para módulo separado.** O projeto usa Vitest **sem
  jsdom/RTL**; não dá para renderizar componentes em teste. Mesmo precedente de
  `src/app/imoveis/searchParams.ts`: a regra testável mora fora do `.tsx`.
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

## Dependencies

- `next/navigation` (`useRouter().push` — client-side, sem full page reload).
- `@/lib/types` apenas para o tipo `TransactionType`, sem importar `api.ts`.
- Estilos em `src/app/globals.css` (classes `.search-bar*`); não há CSS Modules
  nem framework de CSS no projeto.

## Gotchas

- `useRouter` **tem** que vir de `next/navigation`. O de `next/router` é Pages
  Router e quebra em runtime no App Router.
- `URLSearchParams` codifica espaço como `+`, não `%20` (form-urlencoded). É
  válido e o Next decodifica corretamente — os testes esperam `+`.
- `:has(input:checked)` estiliza a opção selecionada; onde não houver suporte o
  radio nativo continua indicando o estado, só sem o destaque.
- Nenhuma chamada de API acontece aqui — o `SearchBar` só monta a URL e navega.
