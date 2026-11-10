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

export interface InjectInfiniteQueryResult<TPage, TError = DefaultError, TPageParam = unknown> {
	result: Signal<InfiniteQueryResult<TPage, TError, TPageParam>>
	status: Signal<QueryStatus>
	data: Signal<InfiniteData<TPage, TPageParam> | undefined>
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
	refetch: () => Promise<InfiniteData<TPage, TPageParam>>
}

/** Like `injectQuery`, but the data is `{ pages, pageParams }` and you can load more. Must run in an injection context. */
export function injectInfiniteQuery<TPage, TError = DefaultError, TPageParam = unknown>(
	options: InfiniteQueryObserverOptions<TPage, TError, TPageParam> | (() => InfiniteQueryObserverOptions<TPage, TError, TPageParam>),
): InjectInfiniteQueryResult<TPage, TError, TPageParam> {
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
	const fields: Record<string, Signal<unknown>> = {}
	for (const key of Object.keys(result()) as Array<keyof InfiniteQueryResult<TPage, TError, TPageParam>>) {
		fields[key] = computed(() => result()[key])
	}
	return {
		...(fields as unknown as Omit<InjectInfiniteQueryResult<TPage, TError, TPageParam>, "result" | "fetchNextPage" | "fetchPreviousPage" | "refetch">),
		result,
		fetchNextPage: () => observer.fetchNextPage(),
		fetchPreviousPage: () => observer.fetchPreviousPage(),
		refetch: () => observer.refetch(),
	}
}
