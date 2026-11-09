import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { describe, expect, expectTypeOf, it, vi } from "vitest"
import {
	InfiniteQueryObserver,
	ensureInfiniteQueryData,
	fetchInfiniteQuery,
	infiniteQueryOptions,
	prefetchInfiniteQuery,
	type InfiniteData,
} from "../src"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const setup = () => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}
// Three pages: 0, 1, 2.
const feed = (queryFn = vi.fn(({ pageParam }: { pageParam: number }) => Promise.resolve(`page ${pageParam}`))) => ({
	queryKey: ["feed"] as const,
	queryFn,
	initialPageParam: 0,
	getNextPageParam: (_last: string, _all: string[], param: number) => (param < 2 ? param + 1 : undefined),
})

describe("fetchInfiniteQuery", () => {
	it("loads one page by default, or `pages` pages, stopping when there is no next page", async () => {
		const { client } = setup()
		expect(await fetchInfiniteQuery(client, feed())).toEqual({ pages: ["page 0"], pageParams: [0] })
		expect(await fetchInfiniteQuery(client, { ...feed(), pages: 2 })).toEqual({
			pages: ["page 0", "page 1"],
			pageParams: [0, 1],
		})
		const all = await fetchInfiniteQuery(client, { ...feed(), pages: 10 })
		expect(all.pageParams).toEqual([0, 1, 2])
		expect(client.getQueryData(["feed"])).toBe(all)
	})

	it("returns fresh cached pages without fetching; refetches stale or invalidated ones", async () => {
		const { client, scheduler } = setup()
		const options = { ...feed(), staleTime: 1000 }
		const first = await fetchInfiniteQuery(client, options)
		scheduler.advance(999)
		expect(await fetchInfiniteQuery(client, options)).toBe(first)
		expect(options.queryFn).toHaveBeenCalledOnce()
		scheduler.advance(1)
		await fetchInfiniteQuery(client, options)
		expect(options.queryFn).toHaveBeenCalledTimes(2)
		await client.invalidateQueries()
		await fetchInfiniteQuery(client, options)
		expect(options.queryFn).toHaveBeenCalledTimes(3)
		await fetchInfiniteQuery(client, feed(options.queryFn)) // default staleTime 0
		expect(options.queryFn).toHaveBeenCalledTimes(4)
	})

	it("rejects on failure, retrying as asked", async () => {
		const { client, scheduler } = setup()
		const queryFn = vi.fn(() => Promise.reject(new Error("down")))
		const promise = fetchInfiniteQuery(client, { ...feed(queryFn as never), retry: 1, retryDelay: 5 })
		promise.catch(() => {})
		await flush()
		scheduler.advance(5)
		await expect(promise).rejects.toThrow("down")
		expect(queryFn).toHaveBeenCalledTimes(2)
	})

	it("fills the cache for an observer that mounts later", async () => {
		const { client } = setup()
		const options = { ...feed(), staleTime: Infinity }
		await fetchInfiniteQuery(client, { ...options, pages: 2 })
		const observer = new InfiniteQueryObserver(client, options)
		const off = observer.subscribe(() => {})
		expect(observer.getSnapshot().data?.pages).toEqual(["page 0", "page 1"])
		expect(observer.getSnapshot().hasNextPage).toBe(true)
		expect(options.queryFn).toHaveBeenCalledTimes(2)
		off()
	})
})

describe("prefetchInfiniteQuery / ensureInfiniteQueryData", () => {
	it("prefetch never rejects", async () => {
		const { client } = setup()
		await expect(prefetchInfiniteQuery(client, feed(vi.fn(() => Promise.reject(new Error("x"))) as never))).resolves.toBeUndefined()
		expect(client.getQueryState(["feed"])?.status).toBe("error")
		await prefetchInfiniteQuery(client, feed())
		expect(client.getQueryData<InfiniteData<string, number>>(["feed"])?.pages).toEqual(["page 0"])
	})

	it("ensure fetches once, then returns the cache however old", async () => {
		const { client, scheduler } = setup()
		const options = feed()
		const first = await ensureInfiniteQueryData(client, options)
		scheduler.advance(60_000)
		expect(await ensureInfiniteQueryData(client, options)).toBe(first)
		expect(options.queryFn).toHaveBeenCalledOnce()
	})
})

describe("infiniteQueryOptions", () => {
	it("returns the same object and types the cache through its key", () => {
		const { client } = setup()
		const input = feed()
		const options = infiniteQueryOptions(input)
		expect(options).toBe(input)
		expectTypeOf(client.getQueryData(options.queryKey)).toEqualTypeOf<InfiniteData<string, number> | undefined>()
		expectTypeOf(new InfiniteQueryObserver(client, options)).toEqualTypeOf<InfiniteQueryObserver<string, Error, number>>()
		expectTypeOf(fetchInfiniteQuery(client, options)).resolves.toEqualTypeOf<InfiniteData<string, number>>()
	})
})
