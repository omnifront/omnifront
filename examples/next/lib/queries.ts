import type { QueryObserverOptions } from "@unicore/next/client"

/**
 * The browser's definition of the query. On the server the same key is prefetched straight from
 * the database (see app/page.tsx), so the browser starts with the data and does not call this
 * until it is stale.
 */
export const todosQuery: QueryObserverOptions<string[]> = {
	queryKey: ["todos"],
	queryFn: async ({ signal }) => {
		const response = await fetch("/api/todos", { signal })
		if (!response.ok) throw new Error(`HTTP ${response.status}`)
		return (await response.json()) as string[]
	},
	staleTime: 10_000,
}
