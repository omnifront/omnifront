# Infinite and paginated queries

`@unicore/query-infinite` adds lists that grow page by page ("load more", infinite scroll, bidirectional feeds). It is a separate package so the main query core stays small, and the adapters expose it from an `/infinite` entry.

::: info Pre-release
Not on npm yet. Once published: `npm install @unicore/query-infinite` (React, Vue and Angular also import their `/infinite` entry).
:::

```tsx
import { useInfiniteQuery } from "@unicore/react/infinite"

function Feed() {
	const feed = useInfiniteQuery({
		queryKey: ["feed"],
		queryFn: ({ pageParam, signal }) => fetch(`/api/feed?cursor=${pageParam}`, { signal }).then((r) => r.json() as Promise<FeedPage>),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.nextCursor, // undefined or null = no more pages
	})

	return (
		<>
			{feed.data?.pages.flatMap((page) => page.items).map((item) => <Item key={item.id} item={item} />)}
			<button onClick={() => feed.fetchNextPage()} disabled={!feed.hasNextPage || feed.isFetchingNextPage}>
				{feed.isFetchingNextPage ? "Loading…" : feed.hasNextPage ? "Load more" : "That's all"}
			</button>
		</>
	)
}
```

Vue: `useInfiniteQuery` from `@unicore/vue/infinite` (refs). Angular: `injectInfiniteQuery` from `@unicore/angular/infinite` (signals). Framework-free: `new InfiniteQueryObserver(client, options)`.

## How it works

- The cache entry holds `{ pages, pageParams }`: every page loaded so far and the cursor each one used. Because it is a normal cache entry, staleness, retries, refetch on focus, invalidation, [hydration](/guide/ssr) and [persistence](/guide/persistence) all work unchanged.
- `queryFn` loads **one** page for the `pageParam` it is given. `getNextPageParam(lastPage, allPages, lastPageParam, allPageParams)` returns the cursor of the page after the last one, or `undefined`/`null` when there is none. A cursor can be anything, including `0`.
- `fetchNextPage()` appends a page. It resolves when the page has loaded and **never rejects**: a failure is in `error` and the pages already loaded stay.
- A **refetch** (invalidation, focus, `refetch()`) reloads every page loaded so far, in order, so the list stays consistent. With many pages this is many requests; invalidate sparingly.
- Concurrent `fetchNextPage()` calls (or one during a refetch) share the request already in flight.

## Previous pages

Add `getPreviousPageParam(firstPage, allPages, firstPageParam, allPageParams)` and use `fetchPreviousPage()` / `hasPreviousPage` / `isFetchingPreviousPage` for chat-style feeds that grow upward.

## Long lists: `maxPages`

`maxPages: 5` keeps at most five pages in the cache. Loading a page past the limit drops one from the opposite end, which also keeps a refetch cheap (it only reloads the pages kept). With `getPreviousPageParam` configured, going back reloads what was dropped.

## Plain pagination

If you show one page at a time (page 1, 2, 3 buttons), you do not need this package: use a normal query keyed by the page with `placeholderData: keepPreviousData` (see [Queries](/guide/queries#pagination-without-flicker)).

## Result

All the [usual query fields](/guide/queries#what-the-result-tells-you), with `data` as `{ pages, pageParams }`, plus `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, `isFetchingPreviousPage`, and `fetchNextPage`, `fetchPreviousPage`, `refetch` functions.
