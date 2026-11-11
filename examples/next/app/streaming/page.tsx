import { dehydrate, getQueryClient, shouldDehydratePending } from "@omnifront/next"
import { HydrationBoundary } from "@omnifront/next/client"
import Link from "next/link"
import { Todos } from "../../components/todos"
import { listTodos } from "../../lib/db"
import { todosQuery } from "../../lib/queries"

export const dynamic = "force-dynamic"

// Streaming: the Server Component starts the fetch but does not wait for it. The page is sent at
// once with the query still loading, and the data follows over the same response when it is ready
// (the dehydrated state carries a promise, which React streams as a prop).
export default function Page() {
	const client = getQueryClient()
	client.fetchQuery(todosQuery.queryKey, listTodos).catch(() => {}) // not awaited
	return (
		<HydrationBoundary state={dehydrate(client, { shouldDehydrate: shouldDehydratePending })}>
			<Todos where="App Router, streamed" />
			<p style={{ textAlign: "center" }}>
				<Link href="/">Prefetched version</Link>
			</p>
		</HydrationBoundary>
	)
}
