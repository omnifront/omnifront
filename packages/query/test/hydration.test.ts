import { FakeScheduler } from "@omnifront/core/testing"
import { describe, expect, it } from "vitest"
import { dehydrate, hydrate } from "../src/hydration"
import { QueryClient } from "../src/query-client"
import { QueryObserver } from "../src/query-observer"

const newClient = (start = 0) => {
	const scheduler = new FakeScheduler()
	scheduler.advance(start)
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}
const wire = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("dehydrate", () => {
	it("captures successful queries with their data and fetch time, and survives JSON", async () => {
		const { client } = newClient(1000)
		await client.fetchQuery(["todos", { page: 1 }], () => Promise.resolve(["a"]))
		const state = wire(dehydrate(client))
		expect(state).toEqual({ queries: [{ queryKey: ["todos", { page: 1 }], data: ["a"], dataUpdatedAt: 1000 }] })
	})

	it("skips queries that are loading, failed or empty", async () => {
		const { client } = newClient()
		client.getQuery(["empty"])
		client.fetchQuery(["loading"], () => new Promise(() => {})).catch(() => {})
		await client.fetchQuery(["failed"], () => Promise.reject(new Error("x"))).catch(() => {})
		expect(dehydrate(client).queries).toEqual([])
	})

	it("shouldDehydrate can widen or narrow the selection", async () => {
		const { client } = newClient()
		await client.fetchQuery(["a"], () => Promise.resolve(1))
		await client.fetchQuery(["private"], () => Promise.resolve(2))
		const state = dehydrate(client, { shouldDehydrate: ({ queryKey }) => queryKey[0] !== "private" })
		expect(state.queries.map((q) => q.queryKey)).toEqual([["a"]])
	})
})

describe("hydrate", () => {
	it("fills an empty cache, keeping the server's fetch time", async () => {
		const server = newClient(1000)
		await server.client.fetchQuery(["k"], () => Promise.resolve("x"))
		const browser = newClient(5000)
		hydrate(browser.client, wire(dehydrate(server.client)))
		expect(browser.client.getQueryState(["k"])).toMatchObject({ status: "success", data: "x", dataUpdatedAt: 1000 })
	})

	it("does not overwrite newer data", async () => {
		const server = newClient(1000)
		await server.client.fetchQuery(["k"], () => Promise.resolve("old"))
		const browser = newClient(5000)
		browser.client.setQueryData(["k"], "new")
		hydrate(browser.client, dehydrate(server.client))
		expect(browser.client.getQueryData(["k"])).toBe("new")
	})

	it("replaces older data", async () => {
		const server = newClient(9000)
		await server.client.fetchQuery(["k"], () => Promise.resolve("fresh"))
		const browser = newClient(9500)
		browser.client.getQuery(["k"]).setData("stale", 2000)
		hydrate(browser.client, dehydrate(server.client))
		expect(browser.client.getQueryData(["k"])).toBe("fresh")
	})

	it("clamps a server time that is ahead of the browser clock", async () => {
		const server = newClient(90_000)
		await server.client.fetchQuery(["k"], () => Promise.resolve(1))
		const browser = newClient(1000)
		hydrate(browser.client, dehydrate(server.client))
		expect(browser.client.getQueryState(["k"])?.dataUpdatedAt).toBe(1000)
	})

	it("accepts null / undefined (a page that prefetched nothing)", () => {
		const { client } = newClient()
		hydrate(client, null)
		hydrate(client, undefined)
		expect(client.getQueries()).toEqual([])
	})

	it("hydrated data is fresh for staleTime and is not refetched on mount", async () => {
		const server = newClient(1000)
		await server.client.fetchQuery(["k"], () => Promise.resolve("x"))
		const browser = newClient(1500)
		hydrate(browser.client, dehydrate(server.client))
		let calls = 0
		const o = new QueryObserver(browser.client, {
			queryKey: ["k"],
			queryFn: () => (calls++, Promise.resolve("y")),
			staleTime: 5000,
		})
		o.subscribe(() => {})
		expect(calls).toBe(0)
		expect(o.getSnapshot()).toMatchObject({ data: "x", isStale: false, isFetching: false })
		browser.scheduler.advance(4500) // 1000 + 5000 reached
		expect(o.getSnapshot().isStale).toBe(true)
	})
})

describe("QueryObserver.getServerSnapshot", () => {
	const make = (client: QueryClient, staleTime: number, extra: object = {}) =>
		new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve("x"), staleTime, ...extra })

	it("does not depend on the clock: the same before and after time passes", async () => {
		const { client, scheduler } = newClient(1000)
		await client.fetchQuery(["k"], () => Promise.resolve("x"))
		const o = make(client, 5000)
		const before = o.getServerSnapshot()
		scheduler.advance(60_000)
		expect(o.getServerSnapshot()).toBe(before)
		expect(before).toMatchObject({ data: "x", isStale: false, isFetching: false })
		expect(o.getSnapshot().isStale).toBe(true) // the live snapshot does move with time
	})

	it("reports staleTime 0 data as stale and fetching, the empty case as loading", async () => {
		const { client } = newClient()
		expect(make(client, 0).getServerSnapshot()).toMatchObject({ status: "loading", isFetching: true, isStale: true })
		await client.fetchQuery(["k"], () => Promise.resolve("x"))
		expect(make(client, 0).getServerSnapshot()).toMatchObject({ status: "success", isStale: true, isFetching: true })
	})

	it("does not claim to fetch when disabled, and treats invalidated data as stale", async () => {
		const { client } = newClient()
		expect(make(client, 0, { enabled: false }).getServerSnapshot()).toMatchObject({ status: "idle", isFetching: false })
		await client.fetchQuery(["k"], () => Promise.resolve("x"))
		client.getQuery(["k"]).invalidate()
		expect(make(client, Infinity).getServerSnapshot()).toMatchObject({ isStale: true })
	})
})
