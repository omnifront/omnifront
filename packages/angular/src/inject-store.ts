import { DestroyRef, inject, signal, type Signal } from "@angular/core"
import { derive, type Subscribable } from "@unicore/core"

const identity = <T>(value: T): T => value

/**
 * Subscribe to any Subscribable (a store, a query observer, ...) and get a Signal of a slice of it.
 * The signal only changes when the selection changes (by `equals`, default `Object.is`).
 * Must run in an injection context.
 */
export function injectStore<TState, TSelected = TState>(
	source: Subscribable<TState>,
	selector: (state: TState) => TSelected = identity as unknown as (state: TState) => TSelected,
	equals?: (a: TSelected, b: TSelected) => boolean,
): Signal<TSelected> {
	const selection = derive(source, selector, equals)
	const value = signal(selection.getSnapshot())
	inject(DestroyRef).onDestroy(selection.subscribe(() => value.set(selection.getSnapshot())))
	return value.asReadonly()
}
