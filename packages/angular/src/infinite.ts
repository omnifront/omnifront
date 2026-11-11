import { DestroyRef, computed, effect, inject, signal, untracked, type Signal } from "@angular/core"
import type { DefaultError, QueryStatus } from "@omnifront/query"
import {
	InfiniteQueryObserver,
	type InfiniteData,
	type InfiniteQueryObserverOptions,
	type InfiniteQueryResult,
} from "@omnifront/query-infinite"
import { injectQueryClient } from "./provide"

export type { InfiniteData, InfiniteQueryObserverOptions, InfiniteQueryResult }

export type InjectInfiniteQueryOptions<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>> =
	InfiniteQueryObserverOptions<TPage, TError, TPageParam> & {
		/**
		 * Derive what the component needs from the loaded pages (`pages.flat()`, say). `data` (also inside
		 * `result`, and what `refetch` resolves with) is the derived value; the cache keeps the pages. It
		 * runs inside a `computed`, so signals it reads are tracked.
		 */
		select?: ((data: InfiniteData<TPage, TPageParam>) => TData) | undefined
	}

export interface InjectInfiniteQueryResult<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>> {
	result: Signal<Omit<InfiniteQueryResult<TPage, TError, TPageParam>, "data"> & { data: TData | undefined }>
	status: Signal<QueryStatus>
	data: Signal<TData | undefined>
	error: Signal<TError | undefined>
	isFetching: Signal<boolean>
	isStale: Signal<boolean>
	isPending: Signal<boolean>
	isLoading: Signal<boolean>
	isRefetching: Signal<boolean>
	isSuccess: Signal<boolean>
	isError: Signal<boolean>
	isLoadingError: Signal<boolean>
	isRefetchError: Signal<boolean>
	hasNextPage: Signal<boolean>
	hasPreviousPage: Signal<boolean>
	isFetchingNextPage: Signal<boolean>
	isFetchingPreviousPage: Signal<boolean>
	/** Load the next page. Never rejects; a failure shows up in `error`. */
	fetchNextPage: () => Promise<void>
	fetchPreviousPage: () => Promise<void>
	refetch: () => Promise<TData>
}

/** Like `injectQuery`, but the data is `{ pages, pageParams }` and you can load more. Must run in an injection context. */
export function injectInfiniteQuery<TPage, TError = DefaultError, TPageParam = unknown, TData = InfiniteData<TPage, TPageParam>>(
	options:
		| InjectInfiniteQueryOptions<TPage, TError, TPageParam, TData>
		| (() => InjectInfiniteQueryOptions<TPage, TError, TPageParam, TData>),
): InjectInfiniteQueryResult<TPage, TError, TPageParam, TData> {
	// Fail fast on the server instead of retrying with backoff (see injectQuery).
	const read = () => {
		const o = typeof options === "function" ? options() : options
		return typeof window === "undefined" ? { ...o, retry: o.retry ?? false } : o
	}
	const observer = new InfiniteQueryObserver(injectQueryClient(), untracked(read))
	const raw = signal(observer.getSnapshot())
	inject(DestroyRef).onDestroy(observer.subscribe(() => raw.set(observer.getSnapshot())))
	raw.set(observer.getSnapshot())
	effect(() => {
		const next = read()
		untracked(() => {
			observer.setOptions(next)
			raw.set(observer.getSnapshot())
		})
	})
	// `select` runs inside a computed: Angular memoizes it and tracks whatever signals it reads.
	const selected = (data: InfiniteData<TPage, TPageParam> | undefined): TData | undefined => {
		const { select } = read()
		return select && data !== undefined ? select(data) : (data as TData | undefined)
	}
	const result = computed(() => ({ ...raw(), data: selected(raw().data) }))
	const fields: Record<string, Signal<unknown>> = {}
	for (const key of Object.keys(raw()) as Array<keyof InfiniteQueryResult<TPage, TError, TPageParam>>) {
		fields[key] = computed(() => raw()[key])
	}
	return {
		...(fields as unknown as Omit<InjectInfiniteQueryResult<TPage, TError, TPageParam, TData>, "result" | "data" | "fetchNextPage" | "fetchPreviousPage" | "refetch">),
		result,
		data: computed(() => result().data),
		fetchNextPage: () => observer.fetchNextPage(),
		fetchPreviousPage: () => observer.fetchPreviousPage(),
		refetch: () => observer.refetch().then((data) => selected(data) as TData),
	}
}
