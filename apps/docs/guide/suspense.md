# Suspense (React)

`useSuspenseQuery` is `useQuery` for `<Suspense>` and error boundaries: instead of checking `status`, you write the happy path and let React handle loading and failure.

```tsx
import { useSuspenseQuery } from "@omnifront/react/suspense"

function Todos() {
	const todos = useSuspenseQuery({ queryKey: ["todos"], queryFn: listTodos })
	return <ul>{todos.data.map((t) => <li key={t}>{t}</li>)}</ul>  // data is never undefined here
}

<ErrorBoundary fallback={<p>Could not load.</p>}>
	<Suspense fallback={<p>Loading…</p>}>
		<Todos />
	</Suspense>
</ErrorBoundary>
```

- While there is no data, the component **suspends** and the nearest `<Suspense>` shows its fallback. Components that use the same key wait on one shared request.
- If loading fails (after the usual retries), the error is **thrown** to the nearest error boundary.
- When it renders, `data` is typed as defined and `status` is `"success"` (or `"error"` if a later background refetch failed; the old data stays).

## Infinite lists

`useSuspenseInfiniteQuery` (same entry) is `useInfiniteQuery` with the same rules: it suspends for the first page, throws a failure, and `data` is always defined. Loading more pages afterwards does not suspend; use `isFetchingNextPage`.

## Retrying after an error

An errored query stays in the cache, so remounting would throw the same error. To retry, invalidate it from the boundary's reset handler; an invalidated failed query loads again (and suspends) instead of throwing:

```tsx
<ErrorBoundary
	onReset={() => client.invalidateQueries({ queryKey: ["todos"] })}
	fallbackRender={({ resetErrorBoundary }) => <button onClick={resetErrorBoundary}>Try again</button>}
>
```

(`react-error-boundary` shown; any error boundary with a reset works.)

`QueryErrorResetBoundary` (from `@omnifront/react/errors`) does that invalidation for you, TanStack style: it hands your boundary a `reset` that lets every failed query load again.

```tsx
<QueryErrorResetBoundary>
	{({ reset }) => (
		<ErrorBoundary onReset={reset} fallbackRender={({ resetErrorBoundary }) => <button onClick={resetErrorBoundary}>Try again</button>}>
			<Page />
		</ErrorBoundary>
	)}
</QueryErrorResetBoundary>
```

`reset` marks every failed query of the client as outdated (not only the ones under this boundary; a query nothing shows is not fetched until something mounts it). `useQueryErrorResetBoundary()` returns the same `{ reset }` for a boundary you wrote as a class or a hook.

## Several queries at once, and no waterfalls

`useSuspenseQueries` (from `@omnifront/react/queries`) takes `{ queries, combine? }`: the component suspends until all of them have data, loading them **in parallel**, and throws the first failure. Every `data` is defined.

```tsx
const [user, posts] = useSuspenseQueries({ queries: [userQuery(id), postsQuery(id)] })
```

A child that suspends only starts its request when it renders, after its parent finished. `usePrefetchQuery(options)` (from `@omnifront/react/suspense`) in the parent starts that request earlier, while the parent renders. It does nothing when the query is already in the cache.

## Differences from `useQuery`

- `enabled` and `placeholderData` are ignored: a suspending query exists to have real data.
- `staleTime` defaults to **1 second**, not 0. With 0, data that has just finished loading would count as stale and be refetched the moment the component mounts.
- `throwOnError` is not needed: a suspending query always throws its failure.
- `useQuery` options such as `retry`, `refetchInterval`, `initialData` all work.

## Server rendering

With streaming SSR (`renderToPipeableStream`, `renderToReadableStream`, the Next.js App Router) the server waits for the data a suspended component needs, streams the HTML with the data in it, and the browser hydrates it without a mismatch. Combine it with [`HydrationBoundary`](/guide/ssr) so the browser starts with the server's data and does not suspend again. If the browser's clock says the server's data is already old, it renders the data first and then refetches, never the other way round.
