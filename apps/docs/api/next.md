# @omnifront/next

Next.js 14+, built on `@omnifront/react`. Two entry points; see the [Next.js guide](/guide/next).

## `@omnifront/next` (server-safe)

### `getQueryClient`

The query client of the current request in a Server Component (via React's `cache`). Where `React.cache` is missing it returns a new client per call.

### `createServerQueryClient`

A new client with `gcTime: Infinity`, for `getServerSideProps`, route handlers or anywhere you manage the request yourself.

### `dehydrate`

Re-exported from `@omnifront/query/hydration`. `DehydratedState`, `DehydrateOptions` and `HydrateOptions` are its types.

### `shouldDehydratePending`

Re-exported from `@omnifront/query/hydration`: `dehydrate(client, { shouldDehydrate: shouldDehydratePending })` also sends the queries that are still loading, as promises. See the [Next.js guide](/guide/next#streaming-a-query-that-is-not-finished).

### `hydrate`

Re-exported from `@omnifront/query/hydration`.

### `QueryClient`

Re-exported from `@omnifront/query`, as are the types `QueryKey`, `QueryObserverOptions` and `QueryResult`.

## `@omnifront/next/client` (`"use client"`)

### `OmnifrontProvider`

Put it in the root layout or `_app`. Creates the browser's `QueryClient` once per component instance (on the server: one per render, with `gcTime: Infinity`). Props: `OmnifrontProviderProps` (`children`, optional `gcTime`).

### `HydrationBoundary`

From `@omnifront/react`; props type `HydrationBoundaryProps`.

### `QueryProvider`

From `@omnifront/react`, for when you create the client yourself.

### `useQuery`

From `@omnifront/react`; result type `UseQueryResult`.

### `useMutation`

From `@omnifront/react`; result type `UseMutationResult`.

### `useQueryClient`

From `@omnifront/react`.

### `useStore`

From `@omnifront/react`. The types `MutationOptions`, `MutationState`, `QueryKey`, `QueryObserverOptions` and `QueryResult` are re-exported from `@omnifront/query`.
