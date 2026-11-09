import type { Subscribable } from "@omnifront/core"
import type { MutationStatus } from "./mutation"
import type { QueryClient } from "./query-client"

/** What tracking needs from a `Mutation`; any of them fits whatever its data and variables types are. */
export type Tracked = Subscribable<{ status: MutationStatus }>

export interface Registry {
	mutations: Set<Tracked>
	listeners: Set<() => void>
}

const registries = new WeakMap<QueryClient, Registry>()

/** The mutations tracked for `client` (ADR-0011). Shared by `/activity` and `/events`; not a public entry. */
export function registryOf(client: QueryClient): Registry {
	let registry = registries.get(client)
	if (!registry) registries.set(client, (registry = { mutations: new Set(), listeners: new Set() }))
	return registry
}
