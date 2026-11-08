import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { dehydrate, hydrate } from "@omnifront/query/hydration"
import { describe, expect, expectTypeOf, it, vi } from "vitest"
import { InfiniteQueryObserver, type InfiniteData, type InfiniteQueryObserverOptions } from "../src/infinite-observer"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const setup = () => new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })

// A server with 3 pages of numbers: page n has [n*10, n*10+1].
interface Page {
	items: number[]
	next: number | null
	prev: number | null
}
const pageOf = (n: number): Page => ({ items: [n * 10, n * 10 + 1], next: n < 3 ? n + 1 : null, prev: n > 1 ? n - 1 : null })
const makeOptions = (overrides: Partial<InfiniteQueryObserverOptions<Page, number>> = {}) => {
	const queryFn = vi.fn(({ pageParam }: { pageParam: number }) => Promise.resolve(pageOf(pageParam)))
	const options: InfiniteQueryObserverOptions<Page, number> = {
		queryKey: ["items"],
		queryFn,
		initialPageParam: 1,
		getNextPageParam: (last) => last.next,
		getPreviousPageParam: (first) => first.prev,
		staleTime: Infinity,
		retry: false,
		...overrides,
	}
	return { options, queryFn }
}

describe("InfiniteQueryObserver", () => {
	it("loads the first page on subscribe, then more with fetchNextPage", async () => {
		const client = setup()
		const { options, queryFn } = makeOptions()
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		expect(o.getSnapshot().data).toEqual({ pages: [pageOf(1)], pageParams: [1] })
		expect(o.getSnapshot()).toMatchObject({ hasNextPage: true, hasPreviousPage: false, status: "success" })

		await o.fetchNextPage()
		await o.fetchNextPage()
		expect(o.getSnapshot().data?.pages.map((p) => p.items[0])).toEqual([10, 20, 30])
		expect(o.getSnapshot().data?.pageParams).toEqual([1, 2, 3])
		expect(o.getSnapshot().hasNextPage).toBe(false)
		expect(queryFn).toHaveBeenCalledTimes(3)

		await o.fetchNextPage() // nothing left: no request
		expect(queryFn).toHaveBeenCalledTimes(3)
	})

	it("tracks isFetchingNextPage while loading a page, and the snapshot is stable", async () => {
		const client = setup()
		let release!: () => void
		const gate = new Promise<void>((r) => (release = r))
		const { options } = makeOptions({
			queryFn: async ({ pageParam }) => {
				if (pageParam === 2) await gate
				return pageOf(pageParam)
			},
		})
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		const pending = o.fetchNextPage()
		expect(o.getSnapshot()).toMatchObject({ isFetching: true, isFetchingNextPage: true, isFetchingPreviousPage: false })
		expect(o.getSnapshot()).toBe(o.getSnapshot())
		release()
		await pending
		expect(o.getSnapshot()).toMatchObject({ isFetching: false, isFetchingNextPage: false })
		expect(o.getSnapshot().data?.pages).toHaveLength(2)
	})

	it("fetchPreviousPage prepends, using getPreviousPageParam", async () => {
		const client = setup()
		const { options } = makeOptions({ initialPageParam: 2 })
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		expect(o.getSnapshot()).toMatchObject({ hasPreviousPage: true, hasNextPage: true })
		await o.fetchPreviousPage()
		expect(o.getSnapshot().data).toMatchObject({ pageParams: [1, 2] })
		expect(o.getSnapshot().hasPreviousPage).toBe(false)
		await o.fetchPreviousPage() // none left
		expect(o.getSnapshot().data?.pages).toHaveLength(2)
	})

	it("without getPreviousPageParam there is never a previous page", async () => {
		const client = setup()
		const { options } = makeOptions()
		delete options.getPreviousPageParam
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		expect(o.getSnapshot().hasPreviousPage).toBe(false)
		await o.fetchPreviousPage()
		expect(o.getSnapshot().data?.pages).toHaveLength(1)
	})

	it("refetch reloads all loaded pages in order and replaces them", async () => {
		const client = setup()
		let version = 1
		const order: number[] = []
		const { options } = makeOptions({
			queryFn: ({ pageParam }) => {
				order.push(pageParam)
				return Promise.resolve({ ...pageOf(pageParam), items: [pageParam * 100 + version] })
			},
		})
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		await o.fetchNextPage()
		await o.fetchNextPage()
		order.length = 0
		version = 2
		await o.refetch()
		expect(order).toEqual([1, 2, 3])
		expect(o.getSnapshot().data?.pages.map((p) => p.items[0])).toEqual([102, 202, 302])
		expect(o.getSnapshot().data?.pageParams).toEqual([1, 2, 3])
	})

	it("a failing page keeps the loaded pages and reports the error without throwing", async () => {
		const client = setup()
		const { options } = makeOptions({
			queryFn: ({ pageParam }) => (pageParam === 2 ? Promise.reject(new Error("page 2 failed")) : Promise.resolve(pageOf(pageParam))),
		})
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		await expect(o.fetchNextPage()).resolves.toBeUndefined()
		expect(o.getSnapshot()).toMatchObject({ status: "error", isFetchingNextPage: false, hasNextPage: true })
		expect(o.getSnapshot().data?.pages).toHaveLength(1)
		expect((o.getSnapshot().error as Error).message).toBe("page 2 failed")
	})

	it("retries a failing page like any query", async () => {
		const client = setup()
		const scheduler = client.scheduler as FakeScheduler
		let calls = 0
		const { options } = makeOptions({
			retry: 2,
			retryDelay: 10,
			queryFn: ({ pageParam }) => (pageParam === 2 && ++calls < 3 ? Promise.reject(new Error("flaky")) : Promise.resolve(pageOf(pageParam))),
		})
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		const pending = o.fetchNextPage()
		await flush()
		scheduler.advance(10)
		await flush()
		scheduler.advance(10)
		await pending
		expect(o.getSnapshot().data?.pages).toHaveLength(2)
	})

	it("concurrent fetchNextPage calls share one request", async () => {
		const client = setup()
		const { options, queryFn } = makeOptions()
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		await Promise.all([o.fetchNextPage(), o.fetchNextPage()])
		expect(queryFn).toHaveBeenCalledTimes(2)
		expect(o.getSnapshot().data?.pages).toHaveLength(2)
	})

	it("fetchNextPage before anything is loaded loads the first page", async () => {
		const client = setup()
		const { options } = makeOptions({ enabled: false })
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await o.fetchNextPage()
		expect(o.getSnapshot().data?.pages).toHaveLength(1)
	})

	it("works with cursors that are not numbers (and 0 as a first cursor)", async () => {
		const client = setup()
		const pages: Record<string, { rows: string[]; cursor: string | null }> = {
			a: { rows: ["1"], cursor: "b" },
			b: { rows: ["2"], cursor: null },
		}
		const o = new InfiniteQueryObserver<{ rows: string[]; cursor: string | null }, string>(client, {
			queryKey: ["cursors"],
			queryFn: ({ pageParam }) => Promise.resolve(pages[pageParam] as { rows: string[]; cursor: string | null }),
			initialPageParam: "a",
			getNextPageParam: (last) => last.cursor,
			retry: false,
		})
		o.subscribe(() => {})
		await flush()
		await o.fetchNextPage()
		expect(o.getSnapshot().data?.pages.flatMap((p) => p.rows)).toEqual(["1", "2"])

		const zero = new InfiniteQueryObserver<number, number>(client, {
			queryKey: ["zero"],
			queryFn: ({ pageParam }) => Promise.resolve(pageParam),
			initialPageParam: 0,
			getNextPageParam: (last) => (last < 1 ? last + 1 : undefined),
			retry: false,
		})
		zero.subscribe(() => {})
		await flush()
		await zero.fetchNextPage()
		expect(zero.getSnapshot().data?.pageParams).toEqual([0, 1])
	})

	it("follows a key change, and keepPreviousData-style inherit carries data over", async () => {
		const client = setup()
		const { options } = makeOptions()
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		o.setOptions({ ...options, queryKey: ["items", "other"] })
		await flush()
		expect(client.getQueryData(["items", "other"])).toBeDefined()
		expect(client.getQueryData(["items"])).toBeDefined()

		const next = new InfiniteQueryObserver(client, { ...options, queryKey: ["x"], placeholderData: (previous) => previous })
		next.inherit(o)
		expect(next.getSnapshot()).toBeDefined()
	})

	it("pages survive dehydrate / hydrate, so SSR and persistence work", async () => {
		const server = setup()
		const { options } = makeOptions()
		const so = new InfiniteQueryObserver(server, options)
		so.subscribe(() => {})
		await flush()
		await so.fetchNextPage()
		const browser = setup()
		hydrate(browser, JSON.parse(JSON.stringify(dehydrate(server))))
		const bo = new InfiniteQueryObserver(browser, options)
		expect(bo.getServerSnapshot()).toMatchObject({ hasNextPage: true, status: "success" })
		expect(bo.getServerSnapshot().data?.pages).toHaveLength(2)
		expect(bo.getServerSnapshot()).toBe(bo.getServerSnapshot())
		expectTypeOf(bo.getSnapshot().data).toEqualTypeOf<InfiniteData<Page, number> | undefined>()
	})

	it("stops listening to the cache when nobody subscribes", async () => {
		const client = setup()
		const { options } = makeOptions()
		const o = new InfiniteQueryObserver(client, options)
		const off = o.subscribe(() => {})
		expect(client.getQuery(["items"]).hasListeners).toBe(true)
		off()
		expect(client.getQuery(["items"]).hasListeners).toBe(false)
	})
})

describe("InfiniteQueryObserver with no pages", () => {
	it("never calls the cursor functions when the cache holds an empty page list", () => {
		const client = setup()
		const { options } = makeOptions()
		const getNextPageParam = vi.fn(options.getNextPageParam)
		const getPreviousPageParam = vi.fn(options.getPreviousPageParam)
		client.setQueryData(["items"], { pages: [], pageParams: [] })
		const o = new InfiniteQueryObserver(client, { ...options, getNextPageParam, getPreviousPageParam })
		expect(o.getSnapshot()).toMatchObject({ hasNextPage: false, hasPreviousPage: false })
		expect(getNextPageParam).not.toHaveBeenCalled()
		expect(getPreviousPageParam).not.toHaveBeenCalled()
	})
})

describe("maxPages", () => {
	it("drops the oldest page when going forward, and the refetch then only reloads the kept pages", async () => {
		const client = setup()
		const { options, queryFn } = makeOptions({ maxPages: 2 })
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		await o.fetchNextPage()
		await o.fetchNextPage()
		expect(o.getSnapshot().data?.pageParams).toEqual([2, 3])
		expect(o.getSnapshot()).toMatchObject({ hasPreviousPage: true, hasNextPage: false })
		queryFn.mockClear()
		await o.refetch()
		expect(queryFn.mock.calls.map(([ctx]) => ctx.pageParam)).toEqual([2, 3])
	})

	it("drops the newest page when going back, and going back reloads what was dropped", async () => {
		const client = setup()
		const { options } = makeOptions({ maxPages: 2, initialPageParam: 3 })
		const o = new InfiniteQueryObserver(client, { ...options, getNextPageParam: (last) => last.next })
		o.subscribe(() => {})
		await flush()
		await o.fetchPreviousPage()
		await o.fetchPreviousPage()
		expect(o.getSnapshot().data?.pageParams).toEqual([1, 2])
		expect(o.getSnapshot().hasNextPage).toBe(true)
		await o.fetchNextPage()
		expect(o.getSnapshot().data?.pageParams).toEqual([2, 3])
	})

	it("changes nothing while under the limit", async () => {
		const client = setup()
		const { options } = makeOptions({ maxPages: 5 })
		const o = new InfiniteQueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		await o.fetchNextPage()
		expect(o.getSnapshot().data?.pageParams).toEqual([1, 2])
	})
})
