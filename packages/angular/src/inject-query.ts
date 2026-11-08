import { DestroyRef, computed, effect, inject, signal, untracked, type Signal } from "@angular/core"
import { QueryObserver, type QueryObserverOptions, type QueryResult, type QueryStatus } from "@unicore/query"
import { injectQueryClient } from "./provide"

export interface InjectQueryResult<TData> {
	/** The whole result; the signals below are slices of it. */
	result: Signal<QueryResult<TData>>
	status: Signal<QueryStatus>
	data: Signal<TData | undefined>
	error: Signal<unknown>
	isFetching: Signal<boolean>
	isStale: Signal<boolean>
	isInvalidated: Signal<boolean>
	isPlaceholderData: Signal<boolean>
	failureCount: Signal<number>
	dataUpdatedAt: Signal<number | undefined>
	refetch: () => Promise<TData>
}

/**
 * Must run in an injection context (e.g. a component field: `todos = injectQuery(() => ({ ... }))`).
 * Pass a function that reads signals to make options reactive: when a signal it reads changes, the
 * query switches, just like a changing key in React or Vue.
 */
export function injectQuery<TData>(
	options: QueryObserverOptions<TData> | (() => QueryObserverOptions<TData>),
): InjectQueryResult<TData> {
	// On the server a failing request must not hold the render open through retries with backoff
	// (~7 s by default): fail fast and let the browser retry. An explicit `retry` is respected.
	const read = () => {
		const o = typeof options === "function" ? options() : options
		return typeof window === "undefined" ? { ...o, retry: o.retry ?? false } : o
	}
	const observer = new QueryObserver(injectQueryClient(), untracked(read))

	// A signal holding the immutable snapshot. Signals compare by reference, so it only notifies
	// consumers when the snapshot really changed, which is the Subscribable guarantee.
	const result = signal(observer.getSnapshot())
	const unsubscribe = observer.subscribe(() => result.set(observer.getSnapshot()))
	result.set(observer.getSnapshot()) // subscribing may have started a fetch

	// DestroyRef fires when the owner (component, route injector, ...) is destroyed; the last
	// unsubscribe then lets the cache entry start its gc timer.
	inject(DestroyRef).onDestroy(unsubscribe)

	// Reactive options. `untracked` keeps the observer's own work from becoming effect dependencies
	// (and allows the signal write below inside an effect on older Angular versions).
	effect(() => {
		const next = read()
		untracked(() => {
			observer.setOptions(next)
			result.set(observer.getSnapshot())
		})
	})

	return {
		result,
		status: computed(() => result().status),
		data: computed(() => result().data),
		error: computed(() => result().error),
		isFetching: computed(() => result().isFetching),
		isStale: computed(() => result().isStale),
		isInvalidated: computed(() => result().isInvalidated),
		isPlaceholderData: computed(() => result().isPlaceholderData),
		failureCount: computed(() => result().failureCount),
		dataUpdatedAt: computed(() => result().dataUpdatedAt),
		refetch: () => observer.refetch(),
	}
}
