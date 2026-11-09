import { BaseSubscribable, type Subscribable } from "@omnifront/core"
import { hashKey, matchesKey } from "./hash-key"
import { registryOf, type Tracked } from "./mutation-registry"
import type { InvalidateFilter, QueryClient } from "./query-client"

/** A number that only notifies when it changes, and only follows its source while somebody listens (ADR-0001). */
abstract class Count extends BaseSubscribable<number> {
	private value = 0
	private detach: (() => void) | undefined

	protected abstract count(): number
	/** Call `refresh` whenever `count()` may have changed; returns the way back. */
	protected abstract attach(refresh: () => void): () => void

	getSnapshot(): number {
		return this.detach ? this.value : this.count() // unsubscribed: nothing keeps `value` current
	}

	/** Nothing is in flight while rendering on the server. */
	getServerSnapshot(): number {
		return 0
	}

	protected override onSubscribe(): void {
		this.value = this.count()
		this.detach = this.attach(() => {
			const next = this.count()
			if (next === this.value) return
			this.value = next
			this.notify()
		})
	}

	protected override onUnsubscribe(): void {
		this.detach?.()
		this.detach = undefined
	}
}

class FetchingCount extends Count {
	private readonly hash: string | undefined

	constructor(
		private readonly client: QueryClient,
		private readonly filter: InvalidateFilter,
	) {
		super()
		this.hash = filter.queryKey && filter.exact ? hashKey(filter.queryKey) : undefined
	}

	protected count(): number {
		const { queryKey, exact } = this.filter
		let n = 0
		for (const { key, query } of this.client.getQueries()) {
			if (!query.getSnapshot().isFetching) continue
			if (!queryKey || (exact ? hashKey(key) === this.hash : matchesKey(key, queryKey))) n++
		}
		return n
	}

	// One listener on the client, never one per query: subscribing to a Query would cancel its gc.
	protected attach(refresh: () => void): () => void {
		return this.client.onChange(refresh)
	}
}

/**
 * How many queries are fetching right now (initial loads and background refetches alike).
 * Pass a filter to count only some: `{ queryKey: ["todos"] }` matches by prefix, add `exact: true`
 * for that one key.
 */
export function createFetchingCount(client: QueryClient, filter: InvalidateFilter = {}): Subscribable<number> {
	return new FetchingCount(client, filter)
}

/**
 * Make a mutation count towards `createMutatingCount(client)`. Adapters call this from their
 * mutation hook; use it directly if you build `Mutation`s yourself. Returns the way to stop tracking;
 * a mutation that is still pending keeps counting until it settles (like TanStack Query).
 */
export function trackMutation(client: QueryClient, mutation: Tracked): () => void {
	const registry = registryOf(client)
	const tracked = mutation
	const changed = (): void => registry.listeners.forEach((listener) => listener())
	const unwatch = tracked.subscribe(changed)
	registry.mutations.add(tracked)
	changed()
	let released = false
	const release = (): void => {
		unwatch()
		registry.mutations.delete(tracked)
		changed()
	}
	return () => {
		if (released) return
		released = true
		if (tracked.getSnapshot().status !== "pending") return release()
		const stop = tracked.subscribe(() => {
			if (tracked.getSnapshot().status === "pending") return
			stop()
			release()
		})
	}
}

class MutatingCount extends Count {
	constructor(private readonly client: QueryClient) {
		super()
	}

	protected count(): number {
		let n = 0
		for (const mutation of registryOf(this.client).mutations) if (mutation.getSnapshot().status === "pending") n++
		return n
	}

	protected attach(refresh: () => void): () => void {
		const { listeners } = registryOf(this.client)
		listeners.add(refresh)
		return () => void listeners.delete(refresh)
	}
}

/** How many tracked mutations are pending (see `trackMutation`). */
export function createMutatingCount(client: QueryClient): Subscribable<number> {
	return new MutatingCount(client)
}
