---
"@omnifront/query": minor
"@omnifront/query-infinite": minor
"@omnifront/persist": minor
"@omnifront/react": minor
"@omnifront/vue": minor
"@omnifront/angular": minor
"@omnifront/next": minor
---

The unfinished parts of phases 3 and 4 (ADR-0013). `@omnifront/query` goes from 3.94 KB to 3.975 KB of its 4 KB budget; the rest lives in opt-in entries.

- **Offline** (`@omnifront/query/offline`): `enableOffline(client)`, mutation `scope: { id }` (mutations of one scope run one after another; the `onMutate` of a waiting call still runs at once, and it shows as `isPaused` until its turn), `setMutationDefaults` / `getMutationDefaults`, `dehydrateMutations`, `hydrateMutations`, `resumePausedMutations`. It is built on a new `wrap` option of mutations, an extension point around the sending step.
- **Persist**: `persistQueryClient` also saves the calls that are waiting for the network or their scope, and sends them after a reload with the context `onMutate` returned (option `persistMutations`, default `true`; it needs `setMutationDefaults` for each `mutationKey`). Every call is saved, also several from one `useMutation`. Variables that are not JSON-safe do not stop the queries from being saved.
- **Hydration**: `dehydrate({ serializeData })` and `hydrate(client, state, { deserializeData })`; React's `HydrationBoundary` takes `options`.
- **`select`** in `useInfiniteQuery`, `useSuspenseInfiniteQuery`, Vue's `useInfiniteQuery` and Angular's `injectInfiniteQuery`, and per query in `useQueries` / `injectQueries`. React's `useQueries` now reads each result's data type off its options, so it takes the options tuple as its type argument (`useQueries<T>` with explicit data types is gone; inference works as before, and `select` is typed).
- `invalidateQueries(client, { refetchType: "none" })` marks queries outdated without refetching the ones on screen; `Query.invalidate(quiet)`.
- A mutation `isPaused` is also true while it waits for its turn in a scope.

`UseInfiniteQueryResult`, `UseSuspenseInfiniteQueryResult`, `UseInfiniteQueryReturn` and `InjectInfiniteQueryResult` gain a fourth type argument (the selected data), after `TPageParam`, so nothing that names them changes.
