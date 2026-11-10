---
"@omnifront/query": minor
"@omnifront/react": minor
"@omnifront/vue": minor
"@omnifront/angular": minor
---

Mutations and the network (ADR-0013, phase 4). `@omnifront/query` is now 3.94 KB of its 4 KB budget.

- Mutations: callbacks for one call (`mutate(variables, { onSuccess, onError, onSettled })`), the flags `isIdle`, `isPending`, `isSuccess`, `isError`, `isPaused`, plus `failureCount`, `failureReason`, `submittedAt`; `retry` / `retryDelay`, `mutationKey`, `meta`, `networkMode`; `defaultOptions.mutations` on the client. `new Mutation(options, client?)` takes the client as a second argument.
- Network: `networkMode` (`"online"`, `"always"`, `"offlineFirst"`) for queries and mutations; query results get `fetchStatus` and `isPaused`.
- `useIsMutating(filters)` / `injectIsMutating(filters)` with `mutationKey`, `exact`, `status` and `predicate`; `useMutationState({ filters, select })` (React, Vue) and `injectMutationState` (Angular), built on `createMutationState` in `@omnifront/query/activity`.

**Behaviour change:** without a network, queries and mutations now wait (paused) and continue when it is back, as in TanStack Query. Before, the request was sent and failed. Set `networkMode: "always"` for work that does not use the network. While a fetch is paused, the hooks report `isFetching: false` and `fetchStatus: "paused"`.
