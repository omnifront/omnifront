import { DestroyRef, effect, inject, signal, untracked, type Signal } from "@angular/core"
import type { Subscribable } from "@omnifront/core"
import type { InvalidateFilter, MutationState } from "@omnifront/query"
import {
	createFetchingCount,
	createMutatingCount,
	createMutationState,
	type MutationFilters,
	type MutationStateOptions,
} from "@omnifront/query/activity"
import { injectQueryClient } from "./provide"

/**
 * A signal that follows whatever `make` builds (a counter, a list of mutation states) and stops with
 * the injection context's owner (DestroyRef). When `input` is a function reading signals, a new
 * source (and a new subscription) is made whenever one of those signals changes.
 */
function follow<TInput, T>(input: TInput | (() => TInput), make: (input: TInput) => Subscribable<T>, initial: T): Signal<T> {
	const value = signal(initial)
	const read = () => (typeof input === "function" ? (input as () => TInput)() : input)
	const bind = (source: Subscribable<T>): (() => void) => {
		value.set(source.getSnapshot())
		return source.subscribe(() => value.set(source.getSnapshot()))
	}
	let unsubscribe = bind(make(untracked(read)))
	inject(DestroyRef).onDestroy(() => unsubscribe())
	if (typeof input === "function") {
		effect(() => {
			const next = read()
			untracked(() => {
				unsubscribe()
				unsubscribe = bind(make(next))
			})
		})
	}
	return value.asReadonly()
}

/**
 * How many queries are fetching right now (first loads and background refetches), for a global
 * spinner. Pass a filter to count only some: `{ queryKey: ["todos"] }` (prefix) or add `exact: true`.
 * Pass a function that reads signals to make the filter reactive. Must run in an injection context.
 */
export function injectIsFetching(filter?: InvalidateFilter | (() => InvalidateFilter | undefined)): Signal<number> {
	const client = injectQueryClient()
	return follow(filter, (next) => createFetchingCount(client, next), 0)
}

/**
 * How many mutations started with `injectMutation` under this injector's client are pending. Pass
 * filters (or a function reading signals) to count only some. Must run in an injection context.
 */
export function injectIsMutating(filters?: MutationFilters | (() => MutationFilters | undefined)): Signal<number> {
	const client = injectQueryClient()
	return follow(filters, (next) => createMutatingCount(client, next), 0)
}

/**
 * The state of the mutations under this injector's client that pass `filters`, to show elsewhere
 * what a mutation is doing. `select` picks what to keep of each (default: its whole state).
 * Must run in an injection context.
 */
export function injectMutationState<TResult = MutationState<unknown, unknown, unknown>>(
	options?: MutationStateOptions<TResult> | (() => MutationStateOptions<TResult> | undefined),
): Signal<TResult[]> {
	const client = injectQueryClient()
	return follow(options, (next) => createMutationState(client, next), [] as TResult[])
}
