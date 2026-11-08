# @unicore/query-infinite

Infinite and paginated queries for unicore: fetchNextPage, fetchPreviousPage and cursors, built on the normal query cache.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { InfiniteQueryObserver } from "@unicore/query-infinite"

const feed = new InfiniteQueryObserver(client, {
	queryKey: ["feed"],
	queryFn: ({ pageParam }) => loadPage(pageParam),
	initialPageParam: 0,
	getNextPageParam: (last) => last.nextCursor,
})
// Frameworks: import { useInfiniteQuery } from "@unicore/react/infinite" (also vue, angular)
```

Documentation: [unicore docs](https://github.com/AMHB-DEV/unicore/tree/main/apps/docs) and the [repository README](https://github.com/AMHB-DEV/unicore#readme).
