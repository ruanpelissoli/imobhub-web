# src/components — componentes de UI compartilhados

## Purpose

Componentes reutilizados por mais de uma rota. O primeiro é `PropertyCard`, o
card de imóvel usado nos destaques da Home e no grid de `/imoveis`. O card
**recebe dados por prop** (`property: Property`) e nunca chama a API — quem
busca é a página.

## Key decisions

- **`<img>` cru, não `next/image`.** As fotos vêm de scraping de imobiliárias
  arbitrárias e `next.config.ts` não tem `images.remotePatterns`; sem lista de
  hosts o `next/image` quebra em runtime. A regra `@next/next/no-img-element` é
  desligada pontualmente em `PropertyImage.tsx` com essa justificativa. Se um dia
  a API normalizar as fotos para um CDN próprio, migrar para `next/image` e
  remover o disable.
- **Boundary de client mínimo.** `PropertyCard` é Server Component. Só
  `PropertyImage` é `'use client'`, porque `onError` (fallback de imagem
  quebrada) exige estado no browser. Não marque o card inteiro como client.
- **CSS Modules co-locado** (`PropertyCard.module.css`). Suportado nativamente
  pelo Next, não incha `globals.css` e não adiciona dependência. `globals.css`
  segue reservado para reset e utilitários globais.
- **Placeholder sem asset.** SVG inline em `PropertyImage.tsx` — não existe
  `public/` no projeto e criar um só para isso adicionaria um request de rede
  por card sem foto.
- **Formatação extraída para `propertyCard.format.ts`.** Mesmo precedente de
  `src/app/imoveis/searchParams.ts`: não há jsdom nem RTL no projeto, então a
  cobertura real vem de testar funções puras. Se um dia a renderização precisar
  de teste, aí sim vale adicionar a infra.
- **`aspect-ratio: 4 / 3` no contêiner da mídia** + `object-fit: cover` na foto:
  a altura do card não depende da imagem carregar, então o grid não pula quando
  uma foto falha.

## Business logic

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

- `@/lib/types` (`Property`) — apenas o tipo; nada de `@/lib/api` aqui.
- `next/link` para navegação até `/imoveis/{id}`.
- Consumidores previstos: `src/app/page.tsx` (destaques) e
  `src/app/imoveis/page.tsx` (grid). Nenhum deles integra o card ainda.

## Gotchas

- **Nada de elemento interativo dentro do card.** O `<Link>` envolve o card
  inteiro; aninhar `<button>`/`<a>` dentro produz HTML inválido e quebra a
  navegação por teclado. Favoritar/compartilhar terá que reestruturar isso.
- O reset global define `a { color: inherit }`, então `.card` não vira azul
  sozinho — o hover/focus é sinalizado por borda e sombra, e `:focus-visible`
  usa `outline` explícito. Não remova: é o único indicador de teclado.
- O título usa `-webkit-line-clamp: 2` + `overflow-wrap: anywhere` para segurar
  títulos de 100+ caracteres em 375px. O `overflow-x: hidden` de `globals.css` é
  rede de segurança, não substituto disso.
- `formatPrice` usa espaço **não-quebrável** (vem do `Intl`); testes normalizam
  whitespace antes de comparar, senão quebram entre versões de ICU.
