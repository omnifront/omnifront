---
title: Add a global loading indicator to the Vue and Angular examples
labels: good first issue, enhancement, adapter: vue, adapter: angular
---

The React example shows two cache-wide counters, "all queries fetching" and "all mutations pending", driven by `useIsFetching()` and `useIsMutating()` (`examples/react/src/App.tsx`). The Vue and Angular examples do not have them yet.

## What to do

- **Vue** (`examples/vue/src/App.vue`): add the same two counters with `useIsFetching()` and `useIsMutating()` from `@omnifront/vue/activity`.
- **Angular** (`examples/angular/src/app.component.ts`): same with `injectIsFetching()` and `injectIsMutating()` from `@omnifront/angular/activity`.
- Keep the markup consistent with the React example (same labels, same `data-testid` attributes).

## Done when

- `pnpm --filter @omnifront/example-vue build` and `pnpm --filter @omnifront/example-angular build` pass.
- Running the example (`pnpm --filter @omnifront/example-vue dev`), clicking "Refetch" briefly shows `1` and then `0`; adding a todo shows the mutation counter going `1` then `0`.

## Pointers

- [Queries guide: a global loading indicator](https://github.com/omnifront/omnifront/blob/main/apps/docs/guide/queries.md)
- [ADR-0011](https://github.com/omnifront/omnifront/blob/main/docs/adr/0011-activity.md) explains the design.
