import { derive, type Subscribable } from "@omnifront/core"
import { computed, getCurrentScope, onScopeDispose, shallowRef, type ComputedRef } from "vue"

const identity = <T>(value: T): T => value

/**
 * Subscribe to any Subscribable (a store, a query observer, ...) and get a ref to a slice of it.
 * The ref only changes when the selection changes (by `equals`, default `Object.is`).
 */
export function useStore<TState, TSelected = TState>(
	source: Subscribable<TState>,
	selector: (state: TState) => TSelected = identity as unknown as (state: TState) => TSelected,
	equals?: (a: TSelected, b: TSelected) => boolean,
): ComputedRef<TSelected> {
	const selection = derive(source, selector, equals)
	const value = shallowRef(selection.getSnapshot())
	// Like useQuery: subscribe in setup, never on the server (no unmount there), stop with the scope.
	if (typeof window !== "undefined") {
		const unsubscribe = selection.subscribe(() => {
			value.value = selection.getSnapshot()
		})
		if (getCurrentScope()) onScopeDispose(unsubscribe)
	}
	return computed(() => value.value)
}
