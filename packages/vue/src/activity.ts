import type { Subscribable } from "@omnifront/core"
import type { InvalidateFilter } from "@omnifront/query"
import { createFetchingCount, createMutatingCount } from "@omnifront/query/activity"
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue"
import { useQueryClient } from "./plugin"

// A ref that follows a counter. Like useStore: subscribe in setup, never on the server (nothing
// unmounts there), and stop with the scope. `source` is re-read when the reactive inputs it reads
// change, which swaps in a new counter.
function useCount(source: () => Subscribable<number>): ComputedRef<number> {
	const value = shallowRef(0)
	let unsubscribe: (() => void) | undefined
	const stop = watch(
		source,
		(counter) => {
			unsubscribe?.()
			value.value = counter.getSnapshot()
			if (typeof window !== "undefined") unsubscribe = counter.subscribe(() => (value.value = counter.getSnapshot()))
		},
		{ immediate: true },
	)
	if (getCurrentScope()) onScopeDispose(() => (stop(), unsubscribe?.()))
	return computed(() => value.value)
}

/**
 * How many queries are fetching right now (first loads and background refetches), for a global
 * spinner. Pass a filter to count only some: `{ queryKey: ["todos"] }` (prefix) or add `exact: true`.
 * The filter can be a ref or getter.
 */
export function useIsFetching(filter?: MaybeRefOrGetter<InvalidateFilter | undefined>): ComputedRef<number> {
	const client = useQueryClient()
	return useCount(() => createFetchingCount(client, toValue(filter)))
}

/** How many mutations started with `useMutation` under this plugin's client are pending. */
export function useIsMutating(): ComputedRef<number> {
	const client = useQueryClient()
	return useCount(() => createMutatingCount(client))
}
