import { BaseSubscribable, type Subscribable } from "@omnifront/core"
import { hashKey, matchesKey, type QueryKey } from "./hash-key"
import type { MutationState, MutationStatus } from "./mutation"
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

export { trackMutation } from "./mutation-registry"

/** What a filter's `predicate` (and `select` of `createMutationState`) sees of a tracked mutation. */
export interface MutationInfo {
	mutationKey: QueryKey | undefined
	meta: Record<string, unknown> | undefined
	state: MutationState<unknown, unknown, unknown>
}

export interface MutationFilters {
	/** Only mutations whose `mutationKey` starts with / contains this key. */
	mutationKey?: QueryKey | undefined
	/** Match `mutationKey` exactly instead of as a prefix. */
	exact?: boolean | undefined
	status?: MutationStatus | undefined
	/** Runs last, on the mutations the other filters let through. */
	predicate?: ((mutation: MutationInfo) => boolean) | undefined
}

const infoOf = (mutation: Tracked): MutationInfo => ({
	mutationKey: mutation.options?.mutationKey,
	meta: mutation.options?.meta,
	state: mutation.getSnapshot() as MutationState<unknown, unknown, unknown>,
})

/** The tracked mutations of `client` that pass `filters`. */
function matching(client: QueryClient, { mutationKey, exact, status, predicate }: MutationFilters): MutationInfo[] {
	const matched: MutationInfo[] = []
	for (const mutation of registryOf(client).mutations) {
		const info = infoOf(mutation)
		const key = info.mutationKey
		if (mutationKey && !(key && (exact ? hashKey(key) === hashKey(mutationKey) : matchesKey(key, mutationKey)))) continue
		if (status && info.state.status !== status) continue
		if (!predicate || predicate(info)) matched.push(info)
	}
	return matched
}

const listen = (client: QueryClient, refresh: () => void): (() => void) => {
	const { listeners } = registryOf(client)
	listeners.add(refresh)
	return () => void listeners.delete(refresh)
}

class MutatingCount extends Count {
	constructor(
		private readonly client: QueryClient,
		private readonly filters: MutationFilters,
	) {
		super()
	}

	protected count(): number {
		return matching(this.client, { status: "pending", ...this.filters }).length
	}

	protected attach(refresh: () => void): () => void {
		return listen(this.client, refresh)
	}
}

/**
 * How many tracked mutations are pending (see `trackMutation`). Pass filters to count only some:
 * `{ mutationKey: ["todos"] }` matches by prefix.
 */
export function createMutatingCount(client: QueryClient, filters: MutationFilters = {}): Subscribable<number> {
	return new MutatingCount(client, filters)
}

export interface MutationStateOptions<TResult = MutationState<unknown, unknown, unknown>> {
	filters?: MutationFilters | undefined
	/** What to keep of each mutation. Default: its state. */
	select?: ((mutation: MutationInfo) => TResult) | undefined
}

class MutationStates<TResult> extends BaseSubscribable<TResult[]> {
	private value: TResult[] = []
	private detach: (() => void) | undefined

	constructor(
		private readonly client: QueryClient,
		private readonly options: MutationStateOptions<TResult>,
	) {
		super()
	}

	/** The same array until some selected value changes (compared item by item). */
	private read(): TResult[] {
		const next = matching(this.client, this.options.filters ?? {}).map(
			this.options.select ?? ((mutation) => mutation.state as TResult),
		)
		const same = next.length === this.value.length && next.every((item, i) => Object.is(item, this.value[i]))
		return same ? this.value : (this.value = next)
	}

	getSnapshot(): TResult[] {
		return this.detach ? this.value : this.read() // unsubscribed: nothing keeps `value` current
	}

	protected override onSubscribe(): void {
		this.read()
		this.detach = listen(this.client, () => {
			const before = this.value
			if (this.read() !== before) this.notify()
		})
	}

	protected override onUnsubscribe(): void {
		this.detach?.()
		this.detach = undefined
	}
}

/**
 * The state of every tracked mutation that passes the filters, to show from another component what
 * a mutation somewhere else is doing (TanStack's `useMutationState`). Only mutations that are mounted
 * or still pending are tracked; a finished one disappears with the component that owned it.
 *
 *   createMutationState(client, { filters: { mutationKey: ["addTodo"], status: "pending" }, select: (m) => m.state.variables })
 */
export function createMutationState<TResult = MutationState<unknown, unknown, unknown>>(
	client: QueryClient,
	options: MutationStateOptions<TResult> = {},
): Subscribable<TResult[]> {
	return new MutationStates(client, options)
}
