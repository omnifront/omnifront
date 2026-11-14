import { DestroyRef, computed, inject, signal, type Signal } from "@angular/core"
import type { Machine } from "@omnifront/ui"

type StateOf<M> = M extends Machine<object, infer S> ? S : never

/**
 * Turn a machine's state into a Signal. Angular lifecycle: call it in a constructor or field
 * initializer (an injection context), and the subscription ends with the component via DestroyRef.
 * `parts` is a computed signal, so templates re-read the machine's attributes whenever its state changes.
 */
export function bindMachine<M extends Machine<object, object>, T>(
	machine: M,
	connect: (machine: M) => T,
): { state: Signal<StateOf<M>>; parts: Signal<T> } {
	const state = signal(machine.getSnapshot() as StateOf<M>)
	const off = machine.subscribe(() => state.set(machine.getSnapshot() as StateOf<M>))
	inject(DestroyRef).onDestroy(() => {
		off()
		machine.dispose()
	})
	return { state: state.asReadonly(), parts: computed(() => (state(), connect(machine))) }
}
