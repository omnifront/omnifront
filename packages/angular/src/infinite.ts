import { DestroyRef, computed, effect, inject, signal, untracked, type Signal } from "@angular/core"
import type { QueryStatus } from "@unicore/query"
import {
	InfiniteQueryObserver,
	type InfiniteData,
	type InfiniteQueryObserverOptions,
	type InfiniteQueryResult,
} from "@unicore/query-infinite"
import { injectQueryClient } from "./provide"

export type { InfiniteData, InfiniteQueryObserverOptions, InfiniteQueryResult }

export interface InjectInfiniteQueryResult<TPage, TPageParam = unknown> {
	result: Signal<InfiniteQueryResult<TPage, TPageParam>>
	status: Signal<QueryStatus>
	data: Signal<InfiniteData<TPage, TPageParam> | undefined>
	error: Signal<unknown>
	isFetching: Signal<boolean>
	isStale: Signal<boolean>
	hasNextPage: Signal<boolean>
	hasPreviousPage: Signal<boolean>
	isFetchingNextPage: Signal<boolean>
	isFetchingPreviousPage: Signal<boolean>
	/** Load the next page. Never rejects; a failure shows up in `error`. */
	fetchNextPage: () => Promise<void>
	fetchPreviousPage: () => Promise<void>
	refetch: () => Promise<InfiniteData<TPage, TPageParam>>
}

/** Like `injectQuery`, but the data is `{ pages, pageParams }` and you can load more. Must run in an injection context. */
export function injectInfiniteQuery<TPage, TPageParam = unknown>(
	options: InfiniteQueryObserverOptions<TPage, TPageParam> | (() => InfiniteQueryObserverOptions<TPage, TPageParam>),
): InjectInfiniteQueryResult<TPage, TPageParam> {
	// Fail fast on the server instead of retrying with backoff (see injectQuery).
	const read = () => {
		const o = typeof options === "function" ? options() : options
		return typeof window === "undefined" ? { ...o, retry: o.retry ?? false } : o
	}
	const observer = new InfiniteQueryObserver(injectQueryClient(), untracked(read))
	const result = signal(observer.getSnapshot())
	inject(DestroyRef).onDestroy(observer.subscribe(() => result.set(observer.getSnapshot())))
	result.set(observer.getSnapshot())
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
		hasNextPage: computed(() => result().hasNextPage),
		hasPreviousPage: computed(() => result().hasPreviousPage),
		isFetchingNextPage: computed(() => result().isFetchingNextPage),
		isFetchingPreviousPage: computed(() => result().isFetchingPreviousPage),
		fetchNextPage: () => observer.fetchNextPage(),
		fetchPreviousPage: () => observer.fetchPreviousPage(),
		refetch: () => observer.refetch(),
	}
}
