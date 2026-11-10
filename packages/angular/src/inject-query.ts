import { DestroyRef, computed, effect, inject, signal, untracked, type Signal } from "@angular/core"
import { QueryObserver, type DefaultError, type QueryObserverOptions, type QueryResult, type QueryStatus } from "@omnifront/query"
import { injectQueryClient } from "./provide"

export interface InjectQueryResult<TData, TError = DefaultError> {
	/** The whole result; the signals below are slices of it. */
	/** With `select`, its `data` is the selected value too. */
	result: Signal<QueryResult<TData, TError>>
	status: Signal<QueryStatus>
	data: Signal<TData | undefined>
	error: Signal<TError | undefined>
	isFetching: Signal<boolean>
	isStale: Signal<boolean>
	isInvalidated: Signal<boolean>
	isPlaceholderData: Signal<boolean>
	isPending: Signal<boolean>
	isLoading: Signal<boolean>
	isRefetching: Signal<boolean>
	isSuccess: Signal<boolean>
	isError: Signal<boolean>
	isLoadingError: Signal<boolean>
	isRefetchError: Signal<boolean>
	failureCount: Signal<number>
	failureReason: Signal<TError | undefined>
	dataUpdatedAt: Signal<number | undefined>
	/** Joins a request in flight; `{ cancelRefetch: true }` aborts it and starts over. */
	refetch: (options?: { cancelRefetch?: boolean | undefined }) => Promise<TData>
}

export type InjectQueryOptions<TQueryFnData, TError = DefaultError, TData = TQueryFnData> = QueryObserverOptions<TQueryFnData, TError> & {
	/**
	 * Derive what the component needs from the cached data. `data` (and `refetch`) give the derived
	 * value; the cache keeps the original. It runs inside a `computed`, so signals it reads are tracked.
	 */
	select?: ((data: TQueryFnData) => TData) | undefined
}



/**
 * Must run in an injection context (e.g. a component field: `todos = injectQuery(() => ({ ... }))`).
 * Pass a function that reads signals to make options reactive: when a signal it reads changes, the
 * query switches, just like a changing key in React or Vue.
 */
export function injectQuery<TQueryFnData, TError = DefaultError, TData = TQueryFnData>(
	options: InjectQueryOptions<TQueryFnData, TError, TData> | (() => InjectQueryOptions<TQueryFnData, TError, TData>),
): InjectQueryResult<TData, TError> {
	// On the server a failing request must not hold the render open through retries with backoff
	// (~7 s by default): fail fast and let the browser retry. An explicit `retry` is respected.
	const read = () => {
		const o = typeof options === "function" ? options() : options
		return typeof window === "undefined" ? { ...o, retry: o.retry ?? false } : o
	}
	const observer = new QueryObserver(injectQueryClient(), untracked(read))

	// A signal holding the immutable snapshot. Signals compare by reference, so it only notifies
	// consumers when the snapshot really changed, which is the Subscribable guarantee.
	const raw = signal(observer.getSnapshot())
	const unsubscribe = observer.subscribe(() => raw.set(observer.getSnapshot()))
	raw.set(observer.getSnapshot()) // subscribing may have started a fetch

	// DestroyRef fires when the owner (component, route injector, ...) is destroyed; the last
	// unsubscribe then lets the cache entry start its gc timer.
	inject(DestroyRef).onDestroy(unsubscribe)

	// Reactive options. `untracked` keeps the observer's own work from becoming effect dependencies
	// (and allows the signal write below inside an effect on older Angular versions).
	effect(() => {
		const next = read()
		untracked(() => {
			observer.setOptions(next)
			raw.set(observer.getSnapshot())
		})
	})

	// `select` runs inside a computed: Angular memoizes it and tracks whatever signals it reads.
	const selected = (data: TQueryFnData | undefined): TData | undefined => {
		const { select } = read()
		return select && data !== undefined ? select(data) : (data as TData | undefined)
	}
	const result = computed(() => ({ ...raw(), data: selected(raw().data) }) as QueryResult<TData, TError>)
	const fields: Record<string, Signal<unknown>> = {}
	// One signal per field of the result. The snapshot always has every field, so its keys are the
	// list (`data` gets its own computed below, for `select`).
	for (const key of Object.keys(raw()) as Array<keyof QueryResult<TQueryFnData, TError>>) {
		fields[key] = computed(() => raw()[key])
	}
	return {
		...(fields as unknown as Omit<InjectQueryResult<TData, TError>, "result" | "data" | "refetch">),
		result,
		data: computed(() => result().data),
		refetch: (o) => observer.refetch(o).then((data) => selected(data) as TData),
	}
}
