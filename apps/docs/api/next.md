# @unicore/next

Next.js 14+, built on `@unicore/react`. Two entry points; see the [Next.js guide](/guide/next).

## `@unicore/next` (server-safe)

### `getQueryClient`

The query client of the current request in a Server Component (via React's `cache`). Where `React.cache` is missing it returns a new client per call.

### `createServerQueryClient`

A new client with `gcTime: Infinity`, for `getServerSideProps`, route handlers or anywhere you manage the request yourself.

### `dehydrate`

Re-exported from `@unicore/query/hydration`. `DehydratedState` and `DehydrateOptions` are its types.

### `hydrate`

Re-exported from `@unicore/query/hydration`.

### `QueryClient`

Re-exported from `@unicore/query`, as are the types `QueryKey`, `QueryObserverOptions` and `QueryResult`.

## `@unicore/next/client` (`"use client"`)

### `UnicoreProvider`

Put it in the root layout or `_app`. Creates the browser's `QueryClient` once per component instance (on the server: one per render, with `gcTime: Infinity`). Props: `UnicoreProviderProps` (`children`, optional `gcTime`).

### `HydrationBoundary`

From `@unicore/react`; props type `HydrationBoundaryProps`.

### `QueryProvider`

From `@unicore/react`, for when you create the client yourself.

### `useQuery`

From `@unicore/react`; result type `UseQueryResult`.

### `useMutation`

From `@unicore/react`; result type `UseMutationResult`.

### `useQueryClient`

From `@unicore/react`.

### `useStore`

From `@unicore/react`. The types `MutationOptions`, `MutationState`, `QueryKey`, `QueryObserverOptions` and `QueryResult` are re-exported from `@unicore/query`.
