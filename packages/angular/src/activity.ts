import { DestroyRef, effect, inject, signal, untracked, type Signal } from "@angular/core"
import type { Subscribable } from "@omnifront/core"
import type { InvalidateFilter } from "@omnifront/query"
import { createFetchingCount, createMutatingCount } from "@omnifront/query/activity"
import { injectQueryClient } from "./provide"

// A signal that follows a counter and stops with the injection context's owner (DestroyRef).
function bind(counter: Subscribable<number>, value: (n: number) => void): () => void {
	value(counter.getSnapshot())
	return counter.subscribe(() => value(counter.getSnapshot()))
}

/**
 * How many queries are fetching right now (first loads and background refetches), for a global
 * spinner. Pass a filter to count only some: `{ queryKey: ["todos"] }` (prefix) or add `exact: true`.
 * Pass a function that reads signals to make the filter reactive. Must run in an injection context.
 */
export function injectIsFetching(filter?: InvalidateFilter | (() => InvalidateFilter | undefined)): Signal<number> {
	const client = injectQueryClient()
	const count = signal(0)
	const read = () => (typeof filter === "function" ? filter() : filter)
	let unsubscribe = bind(createFetchingCount(client, untracked(read)), (n) => count.set(n))
	inject(DestroyRef).onDestroy(() => unsubscribe())

	if (typeof filter === "function") {
		// Reactive filter: a new counter (and a new subscription) whenever a signal it reads changes.
		effect(() => {
			const next = read()
			untracked(() => {
				unsubscribe()
				unsubscribe = bind(createFetchingCount(client, next), (n) => count.set(n))
			})
		})
	}
	return count.asReadonly()
}

/** How many mutations started with `injectMutation` under this injector's client are pending. Must run in an injection context. */
export function injectIsMutating(): Signal<number> {
	const count = signal(0)
	const unsubscribe = bind(createMutatingCount(injectQueryClient()), (n) => count.set(n))
	inject(DestroyRef).onDestroy(unsubscribe)
	return count.asReadonly()
}
