---
"@omnifront/query": minor
"@omnifront/query-infinite": minor
"@omnifront/react": minor
"@omnifront/vue": minor
"@omnifront/angular": minor
---

Query options and result fields from TanStack Query (ADR-0013, phase 3). `@omnifront/query` goes from 3.06 KB to 3.56 KB.

- Result: `isPending`, `isLoading`, `isRefetching`, `isSuccess`, `isError`, `isLoadingError`, `isRefetchError` and `failureReason`, in every adapter (Vue and Angular expose each as its own ref / signal).
- `select` in `useQuery`, `useSuspenseQuery` (React), `useQuery` (Vue) and `injectQuery` (Angular): `data` is the derived value, the cache keeps the original. It is memoized by the framework (`useMemo` / `computed`), not in the cache; new types `UseQueryOptions` and `InjectQueryOptions`.
- `new QueryClient({ defaultOptions: { queries } })`, `getDefaultOptions`, `setDefaultOptions`.
- `refetchOnMount`, `"always"` for the three `refetchOn…` options, `refetchIntervalInBackground`, `meta`, `initialDataUpdatedAt`, `staleTime: "static"`, and function forms (of the query state) for `enabled`, `staleTime`, `refetchInterval` and `refetchOn…`.
- The query function receives `{ signal, queryKey, meta, client }`.
- `fetchQuery({ queryKey, queryFn, staleTime })` as one object; `refetch({ cancelRefetch: true })`; `client.removeQuery(key)`; `Query.reset()`.
- `@omnifront/query/filters`: `removeQueries` and `resetQueries`. `@omnifront/query/options`: `skipToken`.
- Infinite queries pass the full context to the query function and honour the client's default options.

A custom `QueryFnContext` object built by hand (in tests, say) now needs `queryKey`, `meta` and `client`; functions that only read `signal` are unaffected.
