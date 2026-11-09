import { createApi } from "@omnifront/api"
import type { QueryObserverOptions } from "@omnifront/next/client"

/** Stateless, so one module-level instance is safe on the server too. Add per-request headers (cookies) by creating it per request. */
export const api = createApi()

/**
 * The browser's definition of the query. On the server the same key is prefetched straight from
 * the database (see app/page.tsx), so the browser starts with the data and does not call this
 * until it is stale.
 */
export const todosQuery: QueryObserverOptions<string[]> = {
	...api.queryOptions<string[]>("/api/todos"),
	staleTime: 10_000,
}
