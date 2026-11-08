# Next.js

::: info Pre-release
Not on npm yet. Once published: `npm install @unicore/next` (Next 14 or newer). It builds on `@unicore/react`.
:::

`@unicore/next` has two entry points:

| Import | Use in | Contains |
|---|---|---|
| `@unicore/next` | Server Components, route handlers, `getServerSideProps` | `getQueryClient`, `createServerQueryClient`, `dehydrate` |
| `@unicore/next/client` | Client Components (it starts with `"use client"`) | `UnicoreProvider`, `HydrationBoundary`, `useQuery`, `useMutation`, `useStore`, ... |

## App Router

```tsx
// app/layout.tsx  (Server Component)
import { UnicoreProvider } from "@unicore/next/client"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<UnicoreProvider>{children}</UnicoreProvider>
			</body>
		</html>
	)
}
```

```tsx
// app/page.tsx  (Server Component): prefetch, then hand the cache to the client
import { dehydrate, getQueryClient } from "@unicore/next"
import { HydrationBoundary } from "@unicore/next/client"
import { Todos } from "./todos"

export default async function Page() {
	const client = getQueryClient() // one per request
	await client.fetchQuery(["todos"], () => db.listTodos())
	return (
		<HydrationBoundary state={dehydrate(client)}>
			<Todos />
		</HydrationBoundary>
	)
}
```

```tsx
// app/todos.tsx
"use client"
import { useQuery } from "@unicore/next/client"

export function Todos() {
	const todos = useQuery({
		queryKey: ["todos"], // same key as the server prefetch
		queryFn: () => fetch("/api/todos").then((r) => r.json() as Promise<string[]>),
		staleTime: 10_000,
	})
	return <ul>{todos.data?.map((t) => <li key={t}>{t}</li>)}</ul>
}
```

The page arrives with the list already in the HTML, and as long as the data is younger than `staleTime` the browser does not fetch it again.

## Pages Router

```tsx
// pages/_app.tsx
import { UnicoreProvider } from "@unicore/next/client"
export default function App({ Component, pageProps }: AppProps) {
	return <UnicoreProvider><Component {...pageProps} /></UnicoreProvider>
}

// pages/todos.tsx
export const getServerSideProps: GetServerSideProps = async () => {
	const client = createServerQueryClient()
	await client.fetchQuery(["todos"], () => db.listTodos())
	return { props: { dehydratedState: dehydrate(client) } }
}
export default function Page({ dehydratedState }: { dehydratedState: DehydratedState }) {
	return <HydrationBoundary state={dehydratedState}><Todos /></HydrationBoundary>
}
```

## Things to know

- **One client per request.** `getQueryClient()` uses React's `cache`, so every Server Component in the same request shares one client and every new request gets a fresh one. Where `React.cache` does not exist (React 18), it returns a new client on each call; use `createServerQueryClient()` once per request there.
- **Data must be JSON-safe.** Dehydrated data crosses the wire as JSON. Convert `Date`s, `Map`s and class instances inside the `queryFn`.
- **No timers on the server.** Server clients use `gcTime: Infinity`, so nothing keeps the process alive.
- More background in [Server-side rendering](/guide/ssr).
