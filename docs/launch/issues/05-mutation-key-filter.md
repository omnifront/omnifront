---
title: mutationKey and a filter for useIsMutating
labels: help wanted, enhancement
---

`useIsMutating()` / `injectIsMutating()` count **all** pending mutations under a client, because mutations have no key ([ADR-0011](https://github.com/omnifront/omnifront/blob/main/docs/adr/0011-activity.md)). TanStack Query lets you pass `mutationKey` and filter by it.

## What to do (needs a short design note first)

Propose in this issue how a `mutationKey` option would be added to `MutationOptions` (`packages/query/src/mutation.ts`), how `createMutatingCount(client, filter?)` and `trackMutation` (`packages/query/src/activity.ts`) would match on it (reuse `matchesKey` from `hash-key.ts`), and what the adapters' signatures become. Size is the constraint: `@omnifront/query/activity` has a 1 KB budget, adapters 1 KB (Vue 1.1 KB).

## Done when

- An ADR amendment (or ADR-0012) is accepted, then the implementation lands with unit tests, conformance tests for all three adapters, docs and a changeset.
