# Introduction

unicore is a small data layer for front-end apps: **queries** (fetching, caching, deduplication, retries, invalidation), **mutations**, and a tiny **store**. The logic is written once in a framework-free core, and adapters connect it to React, Next.js, Vue and Angular.

## Why another one?

The aim is not to out-feature TanStack Query. It is a different trade:

- **Shared logic across frameworks.** If your organisation has React and Angular apps, or you are moving from one to the other, the same query definitions and store code work in both. The [example apps](https://github.com/AMHB-DEV/unicore/tree/main/examples) share one `examples/shared` package between the React, Vue and Angular demos; only the rendering code differs.
- **Small.** About 2.5 KB for the query core and about 0.7 KB per adapter (gzipped). See [benchmarks](/benchmarks).
- **One model for queries and state.** `useStore(store, selector)` and `useStore(queryObserver, selector)` are the same function.

## How it is layered

```
core        Subscribable contract, notifyManager (batching), Scheduler (injectable timers), derive
query       QueryClient, QueryObserver, Mutation, hydration      → depends on core
store       createStore                                           → depends on core
react / vue / angular   thin adapters                             → depend on query, store, core
next        server helpers + client entry, built on react
```

The hard rule: only the adapters may import `react`, `vue` or `@angular/*`. It is enforced in CI.

## What it does not have (yet)

Refetch on window focus or reconnect, infinite and paginated query helpers, optimistic-update helpers (`onMutate`), `placeholderData`/`initialData`, persistence, devtools, Suspense integration and streaming SSR. If you need these today, use TanStack Query; see [migrating](/guide/migrating-from-tanstack) for how the APIs line up.

## Next steps

Pick your framework: [React](/guide/react), [Next.js](/guide/next), [Vue](/guide/vue) or [Angular](/guide/angular). Then read about [queries](/guide/queries).
