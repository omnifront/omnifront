# Introduction

omnifront is a small data layer for front-end apps: an **HTTP client**, **queries** (caching, deduplication, retries, invalidation), **mutations**, and a tiny **store**. The logic is written once in a framework-free core, and adapters connect it to React, Next.js, Vue and Angular.

## Why another one?

The aim is not to out-feature TanStack Query. It is a different trade:

- **Shared logic across frameworks.** If your organisation has React and Angular apps, or you are moving from one to the other, the same query definitions and store code work in both. The [example apps](https://github.com/omnifront/omnifront/tree/main/examples) share one `examples/shared` package between the React, Vue and Angular demos; only the rendering code differs.
- **Small.** About 3 KB for the query core (including `@omnifront/core`) and about 0.8 KB per adapter (gzipped). See [benchmarks](/benchmarks).
- **One model for queries and state.** `useStore(store, selector)` and `useStore(queryObserver, selector)` are the same function.

## How it is layered

```
core        Subscribable contract, notifyManager (batching), Scheduler (injectable timers), derive
query       QueryClient, QueryObserver, Mutation, hydration      → depends on core
store       createStore                                           → depends on core
api         HTTP client (fetch), interceptors, auth helpers       → depends on core
react / vue / angular   thin adapters                             → depend on query, store, core
next        server helpers + client entry, built on react
```

The hard rule: only the adapters may import `react`, `vue` or `@angular/*`. It is enforced in CI.

## What it does not have (yet)

a `combine` option for `useQueries`, and SSR examples beyond the ones in the repository (Vue SSR, Nuxt 4 and `@angular/ssr` are verified; see [SSR](/guide/ssr)). If you need these today, use TanStack Query; see [migrating](/guide/migrating-from-tanstack) for how the APIs line up.

## Next steps

Pick your framework: [React](/guide/react), [Next.js](/guide/next), [Vue](/guide/vue) or [Angular](/guide/angular). Then read about [queries](/guide/queries) and the [HTTP client](/guide/http-client). Coming from another library? See [TanStack Query](/guide/migrating-from-tanstack) or [axios](/guide/migrating-from-axios).
