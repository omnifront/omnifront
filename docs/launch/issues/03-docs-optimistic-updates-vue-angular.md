---
title: Docs: optimistic update recipes for Vue and Angular
labels: good first issue, docs
---

`apps/docs/guide/mutations.md` shows an optimistic update with rollback using React hooks only. The same flow is covered by the shared conformance suite on Vue and Angular, but the guide has no Vue or Angular code.

## What to do

Add a Vue (`useMutation`) and an Angular (`injectMutation`) version of the optimistic-add example next to the React one (tabs are fine, VitePress supports code groups: `::: code-group`). Run the code in `examples/vue` / `examples/angular` before pasting it: guides should contain code that works.

## Done when

- `pnpm --filter @omnifront/docs build` passes.
- The Vue and Angular snippets use the real API (`mutate`, `onMutate`, `onError`, `onSettled`, `client.setQueryData`, `client.invalidateQueries`).

## Pointers

- `packages/conformance/src/index.ts` has the optimistic flow ("supports optimistic updates with rollback through onMutate").
