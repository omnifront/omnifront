import type { Subscribable } from "@omnifront/core"
import type { QueryKey } from "./hash-key"
import type { MutationState } from "./mutation"
import type { QueryClient } from "./query-client"

/** What tracking needs from a `Mutation`; any of them fits whatever its data and variables types are. */
export type Tracked = Subscribable<MutationState<unknown, unknown, unknown>> & {
	options?: {
		mutationKey?: QueryKey | undefined
		meta?: Record<string, unknown> | undefined
		scope?: { id: string } | undefined
	}
}

export interface Registry {
	mutations: Set<Tracked>
	listeners: Set<() => void>
}

const registries = new WeakMap<QueryClient, Registry>()

/** The mutations tracked for `client` (ADR-0011). Shared by `/activity`, `/events` and `/offline`; not a public entry. */
export function registryOf(client: QueryClient): Registry {
	let registry = registries.get(client)
	if (!registry) registries.set(client, (registry = { mutations: new Set(), listeners: new Set() }))
	return registry
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
