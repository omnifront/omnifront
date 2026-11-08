import { dehydrate, getQueryClient } from "@unicore/next"
import { HydrationBoundary } from "@unicore/next/client"
import Link from "next/link"
import { Todos } from "../components/todos"
import { listTodos } from "../lib/db"
import { todosQuery } from "../lib/queries"

export const dynamic = "force-dynamic"

// App Router: a Server Component prefetches, the Client Component below starts with the data.
export default async function Page() {
	const client = getQueryClient() // one per request
	await client.fetchQuery(todosQuery.queryKey, listTodos)

	return (
		<HydrationBoundary state={dehydrate(client)}>
			<Todos where="App Router" />
			<p style={{ textAlign: "center" }}>
				<Link href="/legacy">Pages Router version</Link>
			</p>
		</HydrationBoundary>
	)
}
