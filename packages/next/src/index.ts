/**
 * Server-safe entry (Server Components, route handlers, getServerSideProps, ...).
 * Hooks and components live in "@omnifront/next/client".
 */
import { QueryClient } from "@omnifront/query"
import * as React from "react"

export { dehydrate, hydrate } from "@omnifront/query/hydration"
export type { DehydratedState, DehydrateOptions, HydrateOptions } from "@omnifront/query/hydration"
export { QueryClient } from "@omnifront/query"
export type { QueryKey, QueryObserverOptions, QueryResult } from "@omnifront/query"

/** A client for one server request. Never reuse one across requests: the cache would leak between users. */
export function createServerQueryClient(): QueryClient {
	// gcTime Infinity: no timers on the server (they would keep the process alive), and the whole
	// client is thrown away when the request ends anyway.
	return new QueryClient({ gcTime: Infinity })
}

// `React.cache` exists in React 19 and in the React that Next bundles for the App Router, but not in
// React 18 (the Pages Router on Next 14). A namespace import keeps that from being a load-time crash.
const cacheForRequest: <T>(fn: () => T) => () => T =
	(React as { cache?: <T>(fn: () => T) => () => T }).cache ?? ((fn) => fn)

/**
 * The query client of the current request in a Server Component. React's `cache` makes every
 * component rendered for the same request get the same client (so they share prefetched data)
 * and every new request get a fresh one.
 *
 *   const client = getQueryClient()
 *   await client.fetchQuery(todosQuery.queryKey, todosQuery.queryFn)
 *   return <HydrationBoundary state={dehydrate(client)}><Todos /></HydrationBoundary>
 *
 * Where `React.cache` is missing (React 18) every call returns a new client. In the Pages Router use
 * `createServerQueryClient()` once per request, as `getServerSideProps` does.
 */
export const getQueryClient: () => QueryClient = cacheForRequest(createServerQueryClient)
