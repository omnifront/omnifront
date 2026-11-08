# @omnifront/query-infinite

Infinite and paginated queries for omnifront: fetchNextPage, fetchPreviousPage and cursors, built on the normal query cache.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { InfiniteQueryObserver } from "@omnifront/query-infinite"

const feed = new InfiniteQueryObserver(client, {
	queryKey: ["feed"],
	queryFn: ({ pageParam }) => loadPage(pageParam),
	initialPageParam: 0,
	getNextPageParam: (last) => last.nextCursor,
})
// Frameworks: import { useInfiniteQuery } from "@omnifront/react/infinite" (also vue, angular)
```

Documentation: [omnifront docs](https://github.com/omnifront/omnifront/tree/main/apps/docs) and the [repository README](https://github.com/omnifront/omnifront#readme).
