import { derive, type Subscribable } from "@omnifront/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"

const identity = <T>(value: T): T => value

/**
 * Subscribe to any Subscribable (a store, a query observer, ...) and return a slice of it.
 * The component re-renders only when the selection changes (by `equals`, default `Object.is`).
 * Keep `selector` and `equals` stable (define them outside the component or memoize them);
 * a new function each render just means re-subscribing each render.
 */
export function useStore<TState, TSelected = TState>(
	source: Subscribable<TState>,
	selector: (state: TState) => TSelected = identity as unknown as (state: TState) => TSelected,
	equals?: (a: TSelected, b: TSelected) => boolean,
): TSelected {
	const selection = useMemo(() => derive(source, selector, equals), [source, selector, equals])
	const getSnapshot = useCallback(() => selection.getSnapshot(), [selection])
	// During SSR and hydration React uses this one, so the first client render matches the server.
	const getServerSnapshot = useCallback(() => selection.getServerSnapshot?.() ?? selection.getSnapshot(), [selection])
	return useSyncExternalStore(selection.subscribe, getSnapshot, getServerSnapshot)
}
