import { FakeScheduler } from "@omnifront/core/testing"
import { describe, expect, it, vi } from "vitest"
import { prefetchQuery } from "../src/prefetch"
import { QueryClient } from "../src/query-client"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const setup = () => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}

describe("prefetchQuery", () => {
	it("fills the cache so a later read needs no fetch", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve("data"))
		await prefetchQuery(client, { queryKey: ["k"], queryFn })
		expect(client.getQueryData(["k"])).toBe("data")
		expect(queryFn).toHaveBeenCalledOnce()
	})

	it("skips the fetch while the data is fresh, fetches again once it is older than staleTime", async () => {
		const { client, scheduler } = setup()
		const queryFn = vi.fn(() => Promise.resolve("data"))
		const options = { queryKey: ["k"], queryFn, staleTime: 1000 }
		await prefetchQuery(client, options)
		scheduler.advance(999)
		await prefetchQuery(client, options)
		expect(queryFn).toHaveBeenCalledOnce()
		scheduler.advance(1)
		await prefetchQuery(client, options)
		expect(queryFn).toHaveBeenCalledTimes(2)
	})

	it("with the default staleTime of 0 it always fetches", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve("data"))
		await prefetchQuery(client, { queryKey: ["k"], queryFn })
		await prefetchQuery(client, { queryKey: ["k"], queryFn })
		expect(queryFn).toHaveBeenCalledTimes(2)
	})

	it("fetches invalidated data even when it is young", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve("data"))
		const options = { queryKey: ["k"], queryFn, staleTime: 10_000 }
		await prefetchQuery(client, options)
		client.getQuery(["k"]).invalidate()
		await prefetchQuery(client, options)
		expect(queryFn).toHaveBeenCalledTimes(2)
	})

	it("joins a request that is already running", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve("data"))
		await Promise.all([
			prefetchQuery(client, { queryKey: ["k"], queryFn }),
			prefetchQuery(client, { queryKey: ["k"], queryFn }),
			client.fetchQuery(["k"], queryFn),
		])
		expect(queryFn).toHaveBeenCalledOnce()
	})

	it("never rejects; the error stays in the cache", async () => {
		const { client } = setup()
		const error = new Error("down")
		await expect(prefetchQuery(client, { queryKey: ["k"], queryFn: () => Promise.reject(error) })).resolves.toBeUndefined()
		expect(client.getQuery(["k"]).getSnapshot()).toMatchObject({ status: "error", error })
	})

	it("passes retry options through", async () => {
		const { client, scheduler } = setup()
		let calls = 0
		const done = prefetchQuery(client, {
			queryKey: ["k"],
			queryFn: () => (++calls < 3 ? Promise.reject(new Error("x")) : Promise.resolve("ok")),
			retry: 2,
			retryDelay: 100,
		})
		await flush()
		scheduler.advance(100)
		await flush()
		expect(calls).toBe(2)
		scheduler.advance(100)
		await done
		expect(client.getQueryData(["k"])).toBe("ok")
		expect(calls).toBe(3)
	})
})
