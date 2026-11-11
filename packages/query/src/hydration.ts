import type { QueryKey } from "./hash-key"
import type { QueryClient } from "./query-client"
import type { QueryState } from "./query"

/** Plain JSON, safe to embed in HTML or send from a server component to a client component. */
export interface DehydratedState {
	queries: Array<{ queryKey: QueryKey; data: unknown; dataUpdatedAt: number }>
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
			queries.push({
				queryKey,
				data: serializeData ? serializeData(state.data) : state.data,
				dataUpdatedAt: state.dataUpdatedAt ?? client.scheduler.now(),
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
	for (const { queryKey, data, dataUpdatedAt } of state?.queries ?? []) {
		const query = client.getQuery<unknown>(queryKey)
		const existing = query.getSnapshot().dataUpdatedAt
		// A server clock ahead of ours would make fresh data look like it comes from the future.
		const updatedAt = Math.min(dataUpdatedAt, now)
		if (existing === undefined || existing < updatedAt) query.setData(options.deserializeData ? options.deserializeData(data) : data, updatedAt)
	}
}
