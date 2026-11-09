import type { QueryKey } from "./hash-key"
import type { MutationState } from "./mutation"
import { registryOf, type Tracked } from "./mutation-registry"
import { CancelledError } from "./cancelled-error"
import type { Query, QueryState } from "./query"
import type { QueryClient } from "./query-client"

export interface QueryEventInfo {
	queryKey: QueryKey
	state: QueryState
}

export interface QueryEventHandlers {
	/** A fetch finished with data. Not called for `setQueryData` or hydration. */
	onSuccess?: ((data: unknown, query: QueryEventInfo) => void) | undefined
	/** A fetch failed for good (after its retries). Not called when it was cancelled. */
	onError?: ((error: unknown, query: QueryEventInfo) => void) | undefined
	/** After either outcome. */
	onSettled?: ((data: unknown, error: unknown, query: QueryEventInfo) => void) | undefined
}

/**
 * Cache-wide callbacks for every query of `client` (TanStack's `QueryCache({ onError })`): one place
 * for an error toast or a logger. Handlers run once per fetch, however many components show the query.
 * Returns the function that stops listening.
 */
export function onQueryEvents(client: QueryClient, handlers: QueryEventHandlers): () => void {
	const joined = new WeakSet<Promise<unknown>>()
	const queued = new WeakSet<Query<unknown>>()
	const never = (): Promise<never> => Promise.reject(new CancelledError())
	let active = true

	const watch = (queryKey: QueryKey, query: Query<unknown>): void => {
		queued.delete(query)
		if (!active || !query.getSnapshot().isFetching) return
		// `fetch` joins the request in flight and hands back its promise, which tells success, failure
		// and cancellation apart exactly (the state alone cannot: a cancel restores the previous state).
		const request = query.fetch(never)
		if (joined.has(request)) return
		joined.add(request)
		const info = (): QueryEventInfo => ({ queryKey, state: query.getSnapshot() })
		request.then(
			(data) => {
				if (!active) return
				handlers.onSuccess?.(data, info())
				handlers.onSettled?.(data, undefined, info())
			},
			(error: unknown) => {
				if (!active || error instanceof CancelledError) return
				handlers.onError?.(error, info())
				handlers.onSettled?.(undefined, error, info())
			},
		)
	}

	const scan = (): void => {
		for (const { key, query } of client.getQueries()) {
			if (queued.has(query) || !query.getSnapshot().isFetching) continue
			queued.add(query)
			// The change is reported while the fetch is still being set up; join it right after.
			void Promise.resolve().then(() => watch(key, query))
		}
	}

	scan()
	const stop = client.onChange(scan)
	return () => {
		active = false
		stop()
	}
}

export interface MutationEventHandlers {
	/** A tracked mutation started. */
	onMutate?: ((variables: unknown) => void) | undefined
	onSuccess?: ((data: unknown, variables: unknown) => void) | undefined
	onError?: ((error: unknown, variables: unknown) => void) | undefined
	/** After either outcome. */
	onSettled?: ((data: unknown, error: unknown, variables: unknown) => void) | undefined
}

/**
 * Cache-wide callbacks for the mutations tracked for `client` (TanStack's `MutationCache({ onError })`).
 * The adapters' mutation hooks track themselves; a `Mutation` you build by hand needs `trackMutation`
 * from `@omnifront/query/activity`. Returns the function that stops listening.
 */
export function onMutationEvents(client: QueryClient, handlers: MutationEventHandlers): () => void {
	const registry = registryOf(client)
	const seen = new WeakMap<Tracked, MutationState<unknown, unknown, unknown>>()
	const scan = (emit: boolean): void => {
		for (const mutation of registry.mutations) {
			const state = mutation.getSnapshot() as MutationState<unknown, unknown, unknown>
			const last = seen.get(mutation)
			if (last === state) continue
			seen.set(mutation, state)
			if (!emit) continue
			const { status, data, error, variables } = state
			if (status === "pending") {
				if (last?.status !== "pending" || last.variables !== variables) handlers.onMutate?.(variables)
			} else if (last?.status === "pending" && status !== "idle") {
				if (status === "success") handlers.onSuccess?.(data, variables)
				else handlers.onError?.(error, variables)
				handlers.onSettled?.(data, status === "error" ? error : undefined, variables)
			}
		}
	}
	scan(false) // what is already running started before we listened
	const listener = (): void => scan(true)
	registry.listeners.add(listener)
	return () => void registry.listeners.delete(listener)
}
