import type { Subscribable } from "@omnifront/core"
import { hashKey, type InvalidateFilter } from "@omnifront/query"
import { createFetchingCount, createMutatingCount } from "@omnifront/query/activity"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"

function useCount(counter: Subscribable<number>): number {
	const getSnapshot = useCallback(() => counter.getSnapshot(), [counter])
	// The server (and the hydrating render) shows 0: nothing is in flight before the first effect.
	const getServerSnapshot = useCallback(() => counter.getServerSnapshot?.() ?? counter.getSnapshot(), [counter])
	return useSyncExternalStore(counter.subscribe, getSnapshot, getServerSnapshot)
}

/**
 * How many queries are fetching right now (first loads and background refetches), for a global
 * spinner. Pass a filter to count only some: `{ queryKey: ["todos"] }` (prefix) or add `exact: true`.
 * Defining the filter inline is fine; it is compared by value.
 */
export function useIsFetching(filter?: InvalidateFilter): number {
	const client = useQueryClient()
	const identity = filter ? `${filter.queryKey ? hashKey(filter.queryKey) : ""}|${filter.exact === true}` : ""
	const counter = useMemo(() => createFetchingCount(client, filter), [client, identity])
	return useCount(counter)
}

/** How many mutations started with `useMutation` under this provider are pending. */
export function useIsMutating(): number {
	const client = useQueryClient()
	const counter = useMemo(() => createMutatingCount(client), [client])
	return useCount(counter)
}
