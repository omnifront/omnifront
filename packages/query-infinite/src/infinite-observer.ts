import { BaseSubscribable } from "@omnifront/core"
import {
	QueryObserver,
	type DefaultError,
	type FetchOptions,
	type QueryClient,
	type QueryFnContext,
	type QueryObserverOptions,
	type QueryResult,
} from "@omnifront/query"

/** What an infinite query stores in the cache: every page loaded so far, and the cursor each used. */
export interface InfiniteData<TPage, TPageParam> {
	pages: TPage[]
	pageParams: TPageParam[]
}

export interface InfiniteQueryFnContext<TPageParam> extends QueryFnContext {
	/** The cursor / page number of the page to load. */
	pageParam: TPageParam
}

export interface InfiniteQueryObserverOptions<TPage, TError = DefaultError, TPageParam = unknown>
	extends Omit<QueryObserverOptions<InfiniteData<TPage, TPageParam>, TError>, "queryFn"> {
	/** Load ONE page. */
	queryFn: (context: InfiniteQueryFnContext<TPageParam>) => Promise<TPage>
	/** The cursor of the first page. */
	initialPageParam: TPageParam
	/** The cursor of the page after `lastPage`; `undefined` or `null` means there is none. */
	getNextPageParam: (
		lastPage: TPage,
		allPages: TPage[],
		lastPageParam: TPageParam,
		allPageParams: TPageParam[],
	) => TPageParam | undefined | null
	/** The cursor of the page before `firstPage`; leave out for forward-only lists. */
	getPreviousPageParam?: (
		firstPage: TPage,
		allPages: TPage[],
		firstPageParam: TPageParam,
		allPageParams: TPageParam[],
	) => TPageParam | undefined | null
	/**
	 * Keep at most this many pages in the cache. Loading a page past the limit drops the page at the
	 * opposite end (so a refetch stays cheap); with `getPreviousPageParam` the dropped pages can be
	 * loaded again by going back.
	 */
	maxPages?: number | undefined
}

export interface InfiniteQueryResult<TPage, TError = DefaultError, TPageParam = unknown> extends QueryResult<InfiniteData<TPage, TPageParam>, TError> {
	hasNextPage: boolean
	hasPreviousPage: boolean
	/** A `fetchNextPage` request is in flight (as opposed to a refetch of everything). */
	isFetchingNextPage: boolean
	isFetchingPreviousPage: boolean
}

interface Slot<TPage, TError, TPageParam> {
	source?: QueryResult<InfiniteData<TPage, TPageParam>, TError>
	direction?: "next" | "previous" | undefined
	result?: InfiniteQueryResult<TPage, TError, TPageParam>
}

const noop = (): void => {}

/**
 * A list that grows page by page. It is a thin layer over a normal `QueryObserver`: the cache entry
 * holds `{ pages, pageParams }`, so staleness, retries, focus refetch, invalidation, hydration and
 * persistence all work unchanged. A refetch reloads every page loaded so far, in order.
 */
export class InfiniteQueryObserver<TPage, TError = DefaultError, TPageParam = unknown> extends BaseSubscribable<
	InfiniteQueryResult<TPage, TError, TPageParam>
> {
	private readonly inner: QueryObserver<InfiniteData<TPage, TPageParam>, TError>
	private direction: "next" | "previous" | undefined
	private stopInner: (() => void) | undefined
	private readonly live: Slot<TPage, TError, TPageParam> = {}
	private readonly server: Slot<TPage, TError, TPageParam> = {}

	constructor(
		private readonly client: QueryClient,
		private options: InfiniteQueryObserverOptions<TPage, TError, TPageParam>,
	) {
		super()
		this.inner = new QueryObserver(client, this.innerOptions())
	}

	getSnapshot(): InfiniteQueryResult<TPage, TError, TPageParam> {
		return this.view(this.live, this.inner.getSnapshot())
	}

	getServerSnapshot(): InfiniteQueryResult<TPage, TError, TPageParam> {
		return this.view(this.server, this.inner.getServerSnapshot())
	}

	/** Load the page after the last one. Resolves when done; a failure is in the result's `error`, never thrown. */
	fetchNextPage(): Promise<void> {
		return this.more("next")
	}

	/** Load the page before the first one (needs `getPreviousPageParam`). */
	fetchPreviousPage(): Promise<void> {
		return this.more("previous")
	}

	/** Reload every page loaded so far, in order. Rejects on failure. */
	refetch(): Promise<InfiniteData<TPage, TPageParam>> {
		return this.inner.refetch()
	}

	setOptions(options: InfiniteQueryObserverOptions<TPage, TError, TPageParam>): void {
		this.options = options
		this.inner.setOptions(this.innerOptions())
	}

	/** See `QueryObserver.inherit`. */
	inherit(from: InfiniteQueryObserver<TPage, TError, TPageParam>): void {
		this.inner.inherit(from.inner)
	}

	protected override onSubscribe(): void {
		this.stopInner = this.inner.subscribe(() => this.notify())
	}

	protected override onUnsubscribe(): void {
		this.stopInner?.()
		this.stopInner = undefined
	}

	/** The options of the underlying observer: same key and behaviour, but the function loads all pages. */
	private innerOptions(): QueryObserverOptions<InfiniteData<TPage, TPageParam>, TError> {
		// Everything except the page-level functions describes the cache entry and is passed through.
		const rest: Partial<InfiniteQueryObserverOptions<TPage, TError, TPageParam>> = { ...this.options }
		delete rest.queryFn
		delete rest.initialPageParam
		delete rest.getNextPageParam
		delete rest.getPreviousPageParam
		delete rest.maxPages
		return { ...(rest as unknown as Omit<QueryObserverOptions<InfiniteData<TPage, TPageParam>, TError>, "queryFn">), queryFn: this.loadAll }
	}

	private data(): InfiniteData<TPage, TPageParam> | undefined {
		return this.client.getQuery<InfiniteData<TPage, TPageParam>, TError>(this.options.queryKey).getSnapshot().data
	}

	private nextParam(data: InfiniteData<TPage, TPageParam>): TPageParam | undefined | null {
		const { pages, pageParams } = data
		if (pages.length === 0) return undefined // nothing loaded: there is no "last page" to ask about
		const last = pages.length - 1
		return this.options.getNextPageParam(pages[last] as TPage, pages, pageParams[last] as TPageParam, pageParams)
	}

	private previousParam(data: InfiniteData<TPage, TPageParam>): TPageParam | undefined | null {
		const { pages, pageParams } = data
		if (pages.length === 0) return undefined
		return this.options.getPreviousPageParam?.(pages[0] as TPage, pages, pageParams[0] as TPageParam, pageParams)
	}

	// Reload as many pages as we have (at least one), following the cursors from the first one.
	private loadAll = async (context: QueryFnContext): Promise<InfiniteData<TPage, TPageParam>> => {
		const existing = this.data()
		const count = Math.max(existing?.pages.length ?? 1, 1)
		const pages: TPage[] = []
		const pageParams: TPageParam[] = []
		let param: TPageParam | undefined | null = existing?.pageParams[0] ?? this.options.initialPageParam
		for (let i = 0; i < count && param != null; i++) {
			pages.push(await this.options.queryFn({ ...context, pageParam: param }))
			pageParams.push(param)
			param = this.nextParam({ pages, pageParams })
		}
		return { pages, pageParams }
	}

	// Drop pages beyond maxPages from the end opposite to the direction we just grew in.
	private trim(data: InfiniteData<TPage, TPageParam>, direction: "next" | "previous"): InfiniteData<TPage, TPageParam> {
		const extra = data.pages.length - (this.options.maxPages ?? Infinity)
		if (extra <= 0) return data
		return direction === "next"
			? { pages: data.pages.slice(extra), pageParams: data.pageParams.slice(extra) }
			: { pages: data.pages.slice(0, -extra), pageParams: data.pageParams.slice(0, -extra) }
	}

	private async more(direction: "next" | "previous"): Promise<void> {
		const data = this.data()
		if (!data) return this.inner.refetch().then(noop, noop) // nothing loaded yet: load the first page
		const param = direction === "next" ? this.nextParam(data) : this.previousParam(data)
		if (param == null) return
		const query = this.client.getQuery<InfiniteData<TPage, TPageParam>, TError>(this.options.queryKey)
		this.direction = direction
		this.notify()
		try {
			await query.fetch(
				async (context) => {
					const page = await this.options.queryFn({ ...context, pageParam: param })
					const current = query.getSnapshot().data ?? data // it may have changed while we waited
					const grown =
						direction === "next"
							? { pages: [...current.pages, page], pageParams: [...current.pageParams, param] }
							: { pages: [page, ...current.pages], pageParams: [param, ...current.pageParams] }
					return this.trim(grown, direction)
				},
				{ ...this.client.getDefaultOptions().queries, ...this.options, retry: this.options.retry ?? this.client.getDefaultOptions().queries?.retry ?? 3 } as FetchOptions<TError>,
			)
		} catch {
			// The failure is in the query state; the old pages stay.
		} finally {
			this.direction = undefined
			this.notify()
		}
	}

	private view(
		slot: Slot<TPage, TError, TPageParam>,
		result: QueryResult<InfiniteData<TPage, TPageParam>, TError>,
	): InfiniteQueryResult<TPage, TError, TPageParam> {
		if (slot.result && slot.source === result && slot.direction === this.direction) return slot.result
		slot.source = result
		slot.direction = this.direction
		const { data } = result
		const fetching = result.isFetching
		slot.result = {
			...result,
			hasNextPage: !!data && this.nextParam(data) != null,
			hasPreviousPage: !!data && this.previousParam(data) != null,
			isFetchingNextPage: fetching && this.direction === "next",
			isFetchingPreviousPage: fetching && this.direction === "previous",
		}
		return slot.result
	}
}
