# Migrating from TanStack Query

The shapes are deliberately close, so most code ports by renaming imports. This page lists what is the same, what is renamed, and what does not exist in unicore yet.

## Same

| TanStack Query | unicore |
|---|---|
| `useQuery({ queryKey, queryFn, staleTime, gcTime, enabled, retry, retryDelay })` | the same option names and meaning |
| `useMutation({ mutationFn, onSuccess, onError, onSettled })` | the same, plus `mutate`, `mutateAsync`, `reset` |
| `queryClient.invalidateQueries({ queryKey, exact })` | the same (no `predicate`, `type` or `refetchType`) |
| `queryClient.fetchQuery`, `getQueryData`, `setQueryData`, `cancelQueries` | `fetchQuery(key, fn)`, `getQueryData`, `setQueryData`, `cancelQuery(key)` |
| `dehydrate` / `hydrate` / `HydrationBoundary` | the same names |
| key hashing (object key order ignored, prefix matching) | the same |
| `QueryClientProvider` | `QueryProvider` (React), `app.use(QueryPlugin, client)` (Vue), `provideUnicore(client)` (Angular) |

## Renamed or changed

| TanStack Query v5 | unicore |
|---|---|
| `status: "pending"` | `status: "loading"` (and `"idle"` when it will not fetch). There are no `isPending`/`isLoading` flags; compare `status`. |
| Mutation `status: "pending"` | same, `"pending"` |
| `fetchQuery({ queryKey, queryFn })` (one object) | `fetchQuery(queryKey, queryFn, retryOptions?)` |
| `queryFn` context `{ queryKey, signal, meta }` | `{ signal }` only; close over the key |
| `setQueryData(key, updaterOrValue)` | value only, no updater function: `setQueryData(key, fn(getQueryData(key)))` |
| `prefetchQuery` (swallows errors) | `fetchQuery` (rejects on error); catch it |
| `cancelQueries(filters)` | `cancelQuery(key)` for one key |
| `select` option | derive a slice with `useStore(observer, selector)` / `derive` |
| `retry` default 3 for every query | 3 for observers (the hooks), 0 for `fetchQuery` |
| `QueryClient` constructor `defaultOptions` | `new QueryClient({ gcTime, scheduler })` only; set `staleTime` etc. per query (share option objects, see below) |
| Notifications scheduled with `setTimeout` | listeners run synchronously, batched through `notifyManager` |

Sharing definitions replaces `defaultOptions` and the `queryOptions()` helper: write the object once and reuse it everywhere, in any framework.

```ts
export const todosQuery = {
	queryKey: ["todos"],
	queryFn: ({ signal }: { signal: AbortSignal }) => api.listTodos(signal),
	staleTime: 5_000,
}
// React: useQuery(todosQuery)   Vue: useQuery(todosQuery)   Angular: injectQuery(todosQuery)
```

## Not in unicore yet

Refetch on window focus / reconnect, `refetchInterval`, `initialData`, `placeholderData`, `keepPreviousData`, infinite and paginated queries, `onMutate` and optimistic helpers, `useQueries`, `useIsFetching`, persistence, Suspense hooks, devtools, streaming SSR. See the [benchmarks](/benchmarks) for what the smaller feature set buys in bytes.
