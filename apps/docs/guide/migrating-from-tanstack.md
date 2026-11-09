# Migrating from TanStack Query

The shapes are deliberately close, so most code ports by renaming imports. This page lists what is the same, what is renamed, and what does not exist in omnifront yet.

## Same

| TanStack Query | omnifront |
|---|---|
| `useQuery({ queryKey, queryFn, staleTime, gcTime, enabled, retry, retryDelay })` | the same option names and meaning |
| `useMutation({ mutationFn, onSuccess, onError, onSettled })` | the same, plus `mutate`, `mutateAsync`, `reset` |
| `queryClient.invalidateQueries({ queryKey, exact })` | the same; for `predicate`, `type` and `stale` use `invalidateQueries(client, filters)` from `@omnifront/query/filters` (no `refetchType` yet) |
| `setQueryData(key, valueOrUpdater)` | the same |
| `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchInterval`, `initialData` | the same names and meaning |
| `queryClient.fetchQuery`, `getQueryData`, `setQueryData`, `cancelQueries` | `fetchQuery(key, fn)`, `getQueryData`, `setQueryData`, `cancelQuery(key)` |
| `dehydrate` / `hydrate` / `HydrationBoundary` | the same names |
| key hashing (object key order ignored, prefix matching) | the same |
| `useQuery<TData, TError>`, `useMutation<TData, TError, TVariables, TContext>`, `Register["defaultError"]` | the same order of type arguments and the same default (`Error`); `error` is `undefined` (not `null`) when there is none |
| `QueryClientProvider` | `QueryProvider` (React), `app.use(QueryPlugin, client)` (Vue), `provideOmnifront(client)` (Angular) |
| `useInfiniteQuery({ initialPageParam, getNextPageParam, ... })` | the same options, imported from `@omnifront/react/infinite` (also Vue, Angular) |
| `useSuspenseQuery` | `useSuspenseQuery` from `@omnifront/react/suspense` (`staleTime` defaults to 1 s; retry after an error via `invalidateQueries`) |

## Renamed or changed

| TanStack Query v5 | omnifront |
|---|---|
| `status: "pending"` | `status: "loading"` (and `"idle"` when it will not fetch). There are no `isPending`/`isLoading` flags; compare `status`. |
| Mutation `status: "pending"` | same, `"pending"` |
| `fetchQuery({ queryKey, queryFn })` (one object) | `fetchQuery(queryKey, queryFn, retryOptions?)` |
| `queryFn` context `{ queryKey, signal, meta }` | `{ signal }` only; close over the key |
| `prefetchQuery({ queryKey, queryFn, staleTime })` (swallows errors) | `prefetchQuery(client, { queryKey, queryFn, staleTime })` from `@omnifront/query/prefetch` (same behaviour: skips fresh data, never rejects); `fetchQuery` rejects on error |
| `cancelQueries(filters)`, `refetchQueries`, `setQueriesData`, `getQueriesData`, `ensureQueryData` | functions from `@omnifront/query/filters` that take the client first: `cancelQueries(client, filters)`. Filters: `queryKey`, `exact`, `type`, `stale`, `fetchStatus`, `predicate` |
| `new QueryCache({ onError })`, `new MutationCache({ onError })` | `onQueryEvents(client, { onError })`, `onMutationEvents(client, { onError })` from `@omnifront/query/events` |
| `queryOptions()`, `mutationOptions()`, `infiniteQueryOptions()` | the same names, from `@omnifront/query/options` (and `@omnifront/query-infinite`); keys are typed the same way |
| `fetchInfiniteQuery`, `prefetchInfiniteQuery`, `ensureInfiniteQueryData` | `fetchInfiniteQuery(client, options)` etc. from `@omnifront/query-infinite` |
| `select` option | derive a slice with `useStore(observer, selector)` / `derive` (not an option) |
| `retry` default 3 for every query | 3 for observers (the hooks), 0 for `fetchQuery` |
| `onMutate` + `context` | the same: the `onMutate` result is the last argument of the other callbacks |
| `placeholderData: keepPreviousData` | the same import name, from `@omnifront/query` |
| `focusManager.setFocused` / `onlineManager.setOnline` | `focusManager.set(bool)` / `onlineManager.set(bool)` |
| `QueryClient` constructor `defaultOptions` | `new QueryClient({ gcTime, scheduler })` only; set `staleTime` etc. per query (share option objects, see below) |
| Notifications scheduled with `setTimeout` | listeners run synchronously, batched through `notifyManager` |

Sharing definitions replaces `defaultOptions`: write the object once (with `queryOptions()` if you want typed keys) and reuse it everywhere, in any framework.

```ts
export const todosQuery = {
	queryKey: ["todos"],
	queryFn: ({ signal }: { signal: AbortSignal }) => api.listTodos(signal),
	staleTime: 5_000,
}
// React: useQuery(todosQuery)   Vue: useQuery(todosQuery)   Angular: injectQuery(todosQuery)
```

## Not in omnifront yet

`removeQueries`, `resetQueries` and `refetchType`; the full list and the order they are planned in is in [`docs/parity-plan.md`](https://github.com/omnifront/omnifront/blob/main/docs/parity-plan.md). `fetchStatus` flags and the `{ queries, combine }` object form of `useQueries` (omnifront takes the list first and `combine` in a second argument: `useQueries(queries, { combine })`). `useIsFetching` and `useIsMutating` ([queries](/guide/queries#a-global-loading-indicator); mutations are counted without a filter, since they have no key), `useQueries` ([queries](/guide/queries#several-queries-at-once)), structural sharing ([opt-in](/guide/queries#stable-references-structural-sharing)), `useSuspenseInfiniteQuery` and `maxPages` exist. `useInfiniteQuery` ([`@omnifront/query-infinite`](/guide/infinite-queries)) and `useSuspenseQuery` ([Suspense](/guide/suspense)) exist, as does streaming SSR with React. Persistence and devtools exist as separate packages: [`@omnifront/persist`](/guide/persistence) and [`@omnifront/devtools`](/guide/devtools). See the [benchmarks](/benchmarks) for what the smaller feature set buys in bytes.
