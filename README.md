# omnifront

**One data layer for React, Next.js, Vue and Angular.** Queries (fetching, caching, deduplication, retries, invalidation), mutations and a tiny store, written once in a framework-free core with thin adapters on top.

> **Status: pre-release.** Not on npm yet and the API can still change. Everything below is covered by tests and runs in the example apps.
>
> **Private for now.** The project stays private until every planned package is finished; see [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the publishing checklist.

## Why

- **Share logic across frameworks.** Teams running React *and* Angular, or migrating from one to the other, keep one set of query and store definitions. The three demos in [`examples/`](examples) share a single `examples/shared` package; only the rendering code differs.
- **Small on purpose.** The query core is about 3 KB gzipped and each adapter under 1 KB (TanStack Query's core is about 9 KB; see [benchmarks](apps/benchmarks/README.md) for exactly what that trade gives up).
- **One mental model.** A query observer, a store and a derived slice all implement the same `Subscribable` contract ([ADR-0001](docs/adr/0001-subscribable-contract.md)), so `useStore(source, selector)` works on any of them.
- **SSR that does not mismatch.** `dehydrate`/`hydrate`, a clock-independent server snapshot, a Next.js package for the App Router and Pages Router, Vue SSR (`onServerPrefetch`) and Angular SSR (`TransferState`), plus React Suspense.

## The same query in four frameworks

```tsx
// React / Next.js
const todos = useQuery({ queryKey: ["todos"], queryFn: listTodos, staleTime: 5_000 })
// todos.status, todos.data, todos.isFetching, todos.refetch()
```

```ts
// Vue: each field is a ref
const { data, status, isFetching, refetch } = useQuery({ queryKey: ["todos"], queryFn: listTodos, staleTime: 5_000 })
```

```ts
// Angular: each field is a signal
todos = injectQuery({ queryKey: ["todos"], queryFn: listTodos, staleTime: 5_000 })
// todos.status(), todos.data(), ...
```

The HTTP client plugs straight in, with cancellation wired through: `useQuery(api.queryOptions("/todos"))`. See the [HTTP client guide](apps/docs/guide/http-client.md).

Mutations (`useMutation` / `injectMutation`), stores (`createStore`, `useStore` / `injectStore`) and invalidation (`client.invalidateQueries`) line up the same way.

## Packages

| Package | What | Size (min+gzip) |
|---|---|---:|
| [`@omnifront/core`](packages/core) | `Subscribable` contract, `notifyManager`, injectable `Scheduler`, `derive` | ~0.8 KB |
| [`@omnifront/query`](packages/query) | `QueryClient`, `QueryObserver`, `Mutation`, hydration | ~3.0 KB |
| [`@omnifront/store`](packages/store) | `createStore` | ~0.4 KB |
| [`@omnifront/api`](packages/api) | `fetch`-based HTTP client: interceptors, typed errors, abort/timeout, retry, `queryOptions`/`mutationOptions`; entries `/xhr` (upload progress), `/auth`, `/testing` | ~2.7 KB |
| [`@omnifront/react`](packages/react) | `QueryProvider`, `useQuery`, `useMutation`, `useStore`, `HydrationBoundary` | ~0.8 KB |
| [`@omnifront/vue`](packages/vue) | `QueryPlugin`, `useQuery`, `useMutation`, `useStore` | ~0.8 KB |
| [`@omnifront/angular`](packages/angular) | `provideOmnifront`, `injectQuery`, `injectMutation`, `injectStore` | ~0.8 KB |
| [`@omnifront/next`](packages/next) | server helpers and a `"use client"` entry for Next.js 14+ | ~0.3 KB each |
| [`@omnifront/query-infinite`](packages/query-infinite) | infinite and paginated queries (`fetchNextPage`, cursors); adapters expose `/infinite` | ~1.0 KB |
| [`@omnifront/persist`](packages/persist) | keep the cache across page loads (localStorage, IndexedDB, any storage) | ~0.9 KB |
| [`@omnifront/devtools`](packages/devtools) | cache inspector: headless model + framework-free panel | ~0.6 KB model, ~2.2 KB panel |

Only the adapters may import `react`, `vue` or `@angular/*`; CI enforces it.

## Documentation

The docs site lives in [`apps/docs`](apps/docs) (VitePress):

```bash
pnpm install && pnpm build
pnpm --filter @omnifront/docs dev
```

Start with the Introduction, the guide for your framework, then Queries. The API reference is checked against the built packages in CI, so it cannot silently drift.

## What is not here yet

`useIsFetching`, and server rendering for Vue and Angular is verified in real apps: Vite SSR, Nuxt 4 and `@angular/ssr`. See [Migrating from TanStack Query](apps/docs/guide/migrating-from-tanstack.md) for the full comparison.

## Examples

| Example | Run |
|---|---|
| [`examples/react`](examples/react) | `pnpm --filter @omnifront/example-react dev` |
| [`examples/vue`](examples/vue) | `pnpm --filter @omnifront/example-vue dev` |
| [`examples/angular`](examples/angular) | `pnpm --filter @omnifront/example-angular dev` |
| [`examples/next`](examples/next) | `pnpm --filter @omnifront/example-next dev` (App Router and Pages Router) |
| [`examples/vue-ssr`](examples/vue-ssr) | `pnpm --filter @omnifront/example-vue-ssr dev` (Vite SSR server) |
| [`examples/nuxt`](examples/nuxt) | `pnpm --filter @omnifront/example-nuxt dev` (Nuxt 4) |
| [`examples/angular-ssr`](examples/angular-ssr) | `pnpm --filter @omnifront/example-angular-ssr build && pnpm --filter @omnifront/example-angular-ssr start` (`@angular/ssr`) |

## Development

Requires Node >= 24 and pnpm >= 12.

```bash
pnpm install
pnpm build        # packages, examples, docs
pnpm typecheck    # includes the type-level inference tests
pnpm test         # unit tests, shared adapter conformance suite, hydration tests
pnpm lint
pnpm deps:check   # package boundary rules
pnpm size         # size budgets
```

Architecture decisions are in [`docs/adr`](docs/adr). Every user-facing change needs a changeset (`pnpm changeset`).

## License

[MIT](LICENSE).
