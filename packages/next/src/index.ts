/**
 * Server-safe entry (Server Components, route handlers, getServerSideProps, ...).
 * Hooks and components live in "@unicore/next/client".
 */
import { QueryClient } from "@unicore/query"
import { cache } from "react"

export { dehydrate, hydrate } from "@unicore/query/hydration"
export type { DehydratedState, DehydrateOptions } from "@unicore/query/hydration"
export { QueryClient } from "@unicore/query"
export type { QueryKey, QueryObserverOptions, QueryResult } from "@unicore/query"

/** A client for one server request. Never reuse one across requests: the cache would leak between users. */
export function createServerQueryClient(): QueryClient {
	// gcTime Infinity: no timers on the server (they would keep the process alive), and the whole
	// client is thrown away when the request ends anyway.
	return new QueryClient({ gcTime: Infinity })
}

/**
 * The query client of the current request in a Server Component. React's `cache` makes every
 * component rendered for the same request get the same client (so they share prefetched data)
 * and every new request get a fresh one.
 *
 *   const client = getQueryClient()
 *   await client.fetchQuery(todosQuery.queryKey, todosQuery.queryFn)
 *   return <HydrationBoundary state={dehydrate(client)}><Todos /></HydrationBoundary>
 */
export const getQueryClient: () => QueryClient = cache(createServerQueryClient)
