import type { Subscribable } from "@omnifront/core"
import type { InvalidateFilter, MutationState } from "@omnifront/query"
import {
	createFetchingCount,
	createMutatingCount,
	createMutationState,
	type MutationFilters,
	type MutationStateOptions,
} from "@omnifront/query/activity"
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue"
import { useQueryClient } from "./plugin"

// A ref that follows a Subscribable (a counter, a list of mutation states). Like useStore: subscribe in setup, never on the server (nothing
// unmounts there), and stop with the scope. `source` is re-read when the reactive inputs it reads
// change, which swaps in a new counter.
function useCount<T = number>(source: () => Subscribable<T>, initial: T = 0 as T): ComputedRef<T> {
	const value = shallowRef(initial)
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

/**
 * How many mutations started with `useMutation` under this plugin's client are pending. Pass filters
 * (plain, a ref or a getter) to count only some: `{ mutationKey: ["todos"] }` matches by prefix.
 */
export function useIsMutating(filters?: MaybeRefOrGetter<MutationFilters | undefined>): ComputedRef<number> {
	const client = useQueryClient()
	return useCount(() => createMutatingCount(client, toValue(filters)))
}

/**
 * The state of the mutations under this plugin's client that pass `filters`, to show elsewhere what a
 * mutation is doing. `select` picks what to keep of each (default: its whole state). Options may be reactive.
 */
export function useMutationState<TResult = MutationState<unknown, unknown, unknown>>(
	options?: MaybeRefOrGetter<MutationStateOptions<TResult> | undefined>,
): ComputedRef<TResult[]> {
	const client = useQueryClient()
	return useCount<TResult[]>(() => createMutationState(client, toValue(options)), [])
}
