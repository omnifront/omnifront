# React

::: info Pre-release
The packages are not published to npm yet. Once they are: `npm install @omnifront/react @omnifront/query` (React 18 or newer).
:::

## Set up

Create one `QueryClient` and provide it near the root.

```tsx
import { QueryClient } from "@omnifront/query"
import { QueryProvider } from "@omnifront/react"

const client = new QueryClient()

root.render(
	<QueryProvider client={client}>
		<App />
	</QueryProvider>,
)
```

## Fetch data

```tsx
import { useQuery } from "@omnifront/react"

function Todos() {
	const todos = useQuery({
		queryKey: ["todos"],
		queryFn: ({ signal }) => fetch("/api/todos", { signal }).then((r) => r.json() as Promise<string[]>),
		staleTime: 5_000,
	})

	if (todos.status === "loading") return <p>Loading…</p>
	if (todos.status === "error") return <p>{String(todos.error)}</p>
	return <ul>{todos.data?.map((t) => <li key={t}>{t}</li>)}</ul>
}
```

`useQuery` returns the whole [result](/api/query#queryresult) (`status`, `data`, `error`, `isFetching`, `isStale`, `failureCount`, ...) plus `refetch()`. The first render already reports `status: "loading"` and `isFetching: true` when a fetch will start on mount, so there is no idle flash.

Two components that use the same key share one request and one cache entry. The key is compared structurally and object key order does not matter: `["todos", { a: 1, b: 2 }]` equals `["todos", { b: 2, a: 1 }]`.

## Change data

```tsx
import { useMutation, useQueryClient } from "@omnifront/react"

function AddTodo() {
	const client = useQueryClient()
	const add = useMutation<void, Error, string>({
		mutationFn: (title) => fetch("/api/todos", { method: "POST", body: JSON.stringify({ title }) }).then(() => {}),
		// Stays "pending" until the list has been refetched.
		onSuccess: () => client.invalidateQueries({ queryKey: ["todos"] }),
	})
	return <button onClick={() => add.mutate("Write docs")} disabled={add.status === "pending"}>Add</button>
}
```

## Shared state

```tsx
import { createStore } from "@omnifront/store"
import { useStore } from "@omnifront/react"

const filter = createStore({ text: "" })
const selectText = (s: { text: string }) => s.text // define selectors outside the component

function Filter() {
	const text = useStore(filter, selectText)
	return <input value={text} onChange={(e) => filter.setState({ text: e.target.value })} />
}
```

::: tip Keep selectors stable
`useStore(source, selector, equals)` re-subscribes whenever the selector or `equals` function changes identity. Define them outside the component (or memoize them) rather than inline. See the [store guide](/guide/store).
:::

## Good to know

- Works under `<StrictMode>`; the double mount still sends a single request.
- Rendering on a server? Use `HydrationBoundary`; see [SSR](/guide/ssr). In Next.js use [`@omnifront/next`](/guide/next).
- Prefer `<Suspense>` and error boundaries to `status` checks? See [`useSuspenseQuery`](/guide/suspense). Lists that load page by page: [infinite queries](/guide/infinite-queries).
