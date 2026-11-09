---
title: "One data layer for React, Next.js, Vue and Angular, in 3 KB"
published: false
tags: javascript, react, vue, angular
cover_image: <upload docs/brand/omnifront-social.png>
---

> Draft. Fill the `<...>` placeholders and delete this note before publishing. Do not publish until the package is on npm and the repository is public (see `README.md` in this folder).

Most teams I talk to do not run one framework. They run a React app next to an Angular one, or they are half-way through a migration, or they have a Next.js site and a Vue dashboard. The UI layers differ; the data layer (fetching, caching, retries, invalidation, optimistic updates, server rendering) is the same problem solved two or three times.

I built **omnifront** to write that layer once: a framework-free core plus thin adapters for React, Next.js, Vue and Angular.

## The same query, four frameworks

```tsx
// React / Next.js
const todos = useQuery({ queryKey: ["todos"], queryFn: listTodos, staleTime: 5_000 })
// todos.status, todos.data, todos.isFetching, todos.refetch()
```

```ts
// Vue: every field is a ref
const { data, status, isFetching, refetch } = useQuery({ queryKey: ["todos"], queryFn: listTodos, staleTime: 5_000 })
```

```ts
// Angular: every field is a signal
todos = injectQuery({ queryKey: ["todos"], queryFn: listTodos, staleTime: 5_000 })
```

The query definitions are plain objects, so they can live in a shared package that all three apps import. The repository has a demo of exactly that: three apps, one `examples/shared` package, only the rendering code differs.

## How the adapters stay thin

Everything the UI listens to (a query observer, a store, a derived slice) implements one tiny contract:

```ts
interface Subscribable<TSnapshot> {
  subscribe(listener: () => void): () => void
  getSnapshot(): TSnapshot            // same reference until something changes
  getServerSnapshot?(): TSnapshot
}
```

React's `useSyncExternalStore` takes those three functions as they are. In Vue it is a `shallowRef` plus `onScopeDispose`; in Angular a `signal` plus `DestroyRef`. That is why an adapter is 20 to 50 lines, and why one shared conformance suite can run the same behavioural tests against all of them. Lifecycle follows subscriber count: the first subscriber starts the fetch, the last one starts the garbage-collection timer.

## What you get

- Queries: caching, in-flight deduplication, `staleTime`/`gcTime`, retries with backoff, invalidation, cancellation with `AbortController`, refetch on focus and reconnect, `placeholderData`, prefetching.
- Mutations with `onMutate`/`onError`/`onSettled`, so optimistic updates and rollback are a few lines.
- `useQueries` with `combine`, infinite queries, Suspense for React, a global `useIsFetching` / `useIsMutating`.
- A tiny store with selectors, using the same contract as queries.
- A small `fetch`-based HTTP client with interceptors, typed errors and cancellation, whose `queryOptions` plug straight into every adapter.
- SSR without hydration mismatches: dehydrate/hydrate, Next.js App Router and Pages Router, Vue (Nuxt 4 and Vite SSR) and Angular (`@angular/ssr`), each verified in a real app.

## Size, and what it costs

| | omnifront | TanStack Query | SWR |
|---|---|---|---|
| Framework-free core | 3.15 KB | 9.31 KB | n/a |
| With the React hooks | 3.78 KB | 10.27 KB | 6.02 KB |

(min+gzip, dependencies included, bundled with esbuild; <docs URL>/benchmarks has the method.)

The honest part: **omnifront is small because it does less.** TanStack Query has more features and years of production use, and official Svelte and Solid adapters. omnifront has no `fetchStatus` flags yet, no `mutationKey`, and its API can still change. The speed numbers in the benchmarks are micro-benchmarks of the core without UI; I would not choose a library on them. If you need the full feature set today, use TanStack Query; there is a migration guide that lists exactly what lines up and what does not.

## Who it is for

Teams with more than one framework, teams migrating from one to another (move the data layer first, the UI at your own pace), and anyone who wants query, store and HTTP client to share one small mental model.

## Try it, and tell me what is missing

- Docs: <docs URL>
- Repo: <repo URL>
- Install: `<npm install line>`

It is a 0.x project and I am looking for feedback from people who run more than one framework: what would stop you from trying it, and which missing feature would you hit first?
