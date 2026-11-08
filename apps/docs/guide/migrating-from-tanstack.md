# Migrating from TanStack Query

The shapes are deliberately close, so most code ports by renaming imports. This page lists what is the same, what is renamed, and what does not exist in unicore yet.

## Same

| TanStack Query | unicore |
|---|---|
| `useQuery({ queryKey, queryFn, staleTime, gcTime, enabled, retry, retryDelay })` | the same option names and meaning |
| `useMutation({ mutationFn, onSuccess, onError, onSettled })` | the same, plus `mutate`, `mutateAsync`, `reset` |
| `queryClient.invalidateQueries({ queryKey, exact })` | the same (no `predicate`, `type` or `refetchType`) |
| `setQueryData(key, valueOrUpdater)` | the same |
| `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchInterval`, `initialData` | the same names and meaning |
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
| `prefetchQuery` (swallows errors) | `fetchQuery` (rejects on error); catch it |
| `cancelQueries(filters)` | `cancelQuery(key)` for one key |
| `select` option | derive a slice with `useStore(observer, selector)` / `derive` (not an option) |
| `retry` default 3 for every query | 3 for observers (the hooks), 0 for `fetchQuery` |
| `onMutate` + `context` | the same: the `onMutate` result is the last argument of the other callbacks |
| `placeholderData: keepPreviousData` | the same import name, from `@unicore/query` |
| `focusManager.setFocused` / `onlineManager.setOnline` | `focusManager.set(bool)` / `onlineManager.set(bool)` |
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

Infinite query helpers (`useInfiniteQuery`; plain pagination works with `placeholderData: keepPreviousData`), `useQueries`, `useIsFetching`, structural sharing of results, Suspense hooks, streaming SSR. Persistence and devtools exist as separate packages: [`@unicore/persist`](/guide/persistence) and [`@unicore/devtools`](/guide/devtools). See the [benchmarks](/benchmarks) for what the smaller feature set buys in bytes.
