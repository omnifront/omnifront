import type { QueryKey } from "./hash-key"
import type { QueryClient } from "./query-client"
import type { QueryState } from "./query"

/**
 * Plain JSON, safe to embed in HTML or send from a server component to a client component. A query
 * that was still loading (see `shouldDehydratePending`) carries a `promise` of its data instead:
 * that works where promises can travel (props from a Server Component), not in JSON.
 */
export interface DehydratedState {
	queries: Array<{ queryKey: QueryKey; data: unknown; dataUpdatedAt: number; promise?: Promise<unknown> | undefined }>
}

export interface DehydrateOptions {
	/** Which queries to send. Default: the ones that hold successful data. */
	shouldDehydrate?: (query: { queryKey: QueryKey; state: QueryState }) => boolean
	/**
	 * Turn each query's data into something JSON-safe (a Date, a Map, a class): `superjson.serialize`,
	 * say. Undo it with `deserializeData` in `hydrate`.
	 */
	serializeData?: ((data: unknown) => unknown) | undefined
}

export interface HydrateOptions {
	/** The reverse of `serializeData`: runs on the data of each dehydrated query. */
	deserializeData?: ((data: unknown) => unknown) | undefined
}

const hasData = ({ state }: { state: QueryState }): boolean => state.status === "success" && state.dataUpdatedAt !== undefined

/**
 * `shouldDehydrate` that also takes the queries still loading, so a Server Component can start a
 * fetch, not wait for it, and stream the result to the browser when it is ready:
 * `dehydrate(client, { shouldDehydrate: shouldDehydratePending })`.
 */
export const shouldDehydratePending = (query: { queryKey: QueryKey; state: QueryState }): boolean =>
	hasData(query) || (query.state.isFetching && query.state.data === undefined)

/** What a query that is still loading will produce. A rejection nobody reads yet is not an unhandled one. */
function ahead(query: { settled(): Promise<void>; getSnapshot(): QueryState }, serializeData: DehydrateOptions["serializeData"]): Promise<unknown> {
	const promise = query.settled().then(() => {
		const { status, data, error } = query.getSnapshot()
		if (status !== "success") throw error
		return serializeData ? serializeData(data) : data
	})
	promise.catch(() => {})
	return promise
}

/**
 * Server side: capture the cache so the browser can start with it. `data` must survive
 * JSON (no Dates, Maps, class instances; convert them in the query function, or pass `serializeData`).
 */
export function dehydrate(client: QueryClient, options: DehydrateOptions = {}): DehydratedState {
	const shouldDehydrate = options.shouldDehydrate ?? hasData
	const queries: DehydratedState["queries"] = []
	for (const { key: queryKey, query } of client.getQueries()) {
		const state = query.getSnapshot()
		if (shouldDehydrate({ queryKey, state })) {
			const { serializeData } = options
			const pending = state.data === undefined
			queries.push({
				queryKey,
				data: pending || !serializeData ? state.data : serializeData(state.data),
				dataUpdatedAt: state.dataUpdatedAt ?? client.scheduler.now(),
				// Still loading: hand over what the fetch will produce.
				...(pending && { promise: ahead(query, serializeData) }),
			})
		}
	}
	return { queries }
}

/**
 * Browser side: load a dehydrated cache. Never overwrites newer data, so it is safe to call
 * again (for example for every page navigation).
 */
export function hydrate(client: QueryClient, state: DehydratedState | null | undefined, options: HydrateOptions = {}): void {
	const now = client.scheduler.now()
	for (const { queryKey, data, dataUpdatedAt, promise } of state?.queries ?? []) {
		const query = client.getQuery<unknown>(queryKey)
		if (data === undefined) {
			// Still loading on the server: show it as loading and fill it in when the promise settles.
			if (typeof promise?.then === "function" && query.getSnapshot().data === undefined && !query.getSnapshot().isFetching) {
				client
					.fetchQuery({ queryKey, // Promise.resolve: a promise that crossed from a Server Component is a bare thenable whose `then` returns nothing.
					queryFn: () => Promise.resolve(promise).then((d) => (options.deserializeData ? options.deserializeData(d) : d)), retry: false })
					.catch(() => {})
			}
			continue
		}
		const existing = query.getSnapshot().dataUpdatedAt
		// A server clock ahead of ours would make fresh data look like it comes from the future.
		const updatedAt = Math.min(dataUpdatedAt, now)
		if (existing === undefined || existing < updatedAt) query.setData(options.deserializeData ? options.deserializeData(data) : data, updatedAt)
	}
}
