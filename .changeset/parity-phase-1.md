---
"@omnifront/query": minor
"@omnifront/query-infinite": minor
---

First step towards feature parity with TanStack Query (ADR-0013), all in opt-in entries: the main entry of `query` did not grow.

- `@omnifront/query/filters`: `findQueries`, `matchQuery`, `invalidateQueries`, `refetchQueries`, `cancelQueries`, `getQueriesData`, `setQueriesData`, `ensureQueryData`, `isCancelledError`, with the filters `queryKey`, `exact`, `type`, `stale`, `fetchStatus` and `predicate`.
- `@omnifront/query/events`: cache-wide callbacks, `onQueryEvents` and `onMutationEvents`.
- `@omnifront/query/options`: `queryOptions` and `mutationOptions`. Keys made by `queryOptions` type `getQueryData`, `setQueryData` and `getQueryState` (new `DataTag` type).
- `@omnifront/query-infinite`: `fetchInfiniteQuery`, `prefetchInfiniteQuery`, `ensureInfiniteQueryData`, `infiniteQueryOptions`.
