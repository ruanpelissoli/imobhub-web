# src/app — App Router

## Purpose

Rotas da aplicação. Hoje está em **estado de scaffold**: apenas o root layout
(`lang="pt-BR"`) e uma página placeholder, o mínimo para o build passar.

As telas reais — busca com filtros e detalhe do imóvel — vêm em tasks seguintes.
A página placeholder pode ser substituída sem cerimônia.

## Key decisions

- **Sem framework de CSS.** `globals.css` traz só um reset mínimo; a escolha de
  estilização fica para a task que construir a primeira tela de verdade.
- **Server Components por padrão.** `'use client'` só onde houver interatividade
  real.

## Dependencies

Dados vêm exclusivamente de `src/lib/api.ts` — nenhuma rota deve chamar `fetch`
direto para a `imobhub-api`. Veja `src/lib/CLAUDE.md`.

## Gotchas

- `layout.tsx` fixa `lang="pt-BR"`; toda a UI é em português.
