import { FakeScheduler } from "@omnifront/core/testing"
import { describe, expect, it, vi } from "vitest"
import {
	cancelQueries,
	ensureQueryData,
	findQueries,
	getQueriesData,
	invalidateQueries,
	isCancelledError,
	matchQuery,
	refetchQueries,
	setQueriesData,
} from "../src/filters"
import { QueryClient } from "../src/query-client"
import { QueryObserver } from "../src/query-observer"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const setup = () => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}
const keys = (client: QueryClient, filters?: Parameters<typeof findQueries>[1]) =>
	findQueries(client, filters).map((e) => e.key)

describe("findQueries / matchQuery", () => {
	it("filters by key prefix, exact key, activity, staleness, fetch status and predicate", async () => {
		const { client } = setup()
		client.setQueryData(["todos"], [1])
		client.setQueryData(["todos", 1], "one")
		client.setQueryData(["users"], [])
		client.getQuery(["empty"])
		const observer = new QueryObserver(client, { queryKey: ["users"], queryFn: () => Promise.resolve([]), staleTime: Infinity })
		const off = observer.subscribe(() => {})

		expect(keys(client)).toHaveLength(4)
		expect(keys(client, { queryKey: ["todos"] })).toEqual([["todos"], ["todos", 1]])
		expect(keys(client, { queryKey: ["todos"], exact: true })).toEqual([["todos"]])
		expect(keys(client, { type: "active" })).toEqual([["users"]])
		expect(keys(client, { type: "inactive" })).toHaveLength(3)
		expect(keys(client, { type: "all" })).toHaveLength(4)
		expect(keys(client, { stale: true })).toEqual([["empty"]])
		expect(keys(client, { stale: false })).toHaveLength(3)
		expect(keys(client, { predicate: (q) => q.observed && q.state.status === "success" })).toEqual([["users"]])
		expect(keys(client, { predicate: (q) => q.queryKey.length === 2 })).toEqual([["todos", 1]])

		let release!: (v: string) => void
		void client.fetchQuery(["slow"], () => new Promise<string>((r) => (release = r)))
		expect(keys(client, { fetchStatus: "fetching" })).toEqual([["slow"]])
		expect(keys(client, { fetchStatus: "idle" })).toHaveLength(4)
		release("done")
		await flush()
		expect(keys(client, { fetchStatus: "fetching" })).toEqual([])

		const [entry] = client.getQueries()
		expect(matchQuery(entry!, { queryKey: ["nope"] })).toBe(false)
		off()
	})
})

describe("invalidateQueries / refetchQueries", () => {
	it("invalidateQueries marks every match; observed ones refetch", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve("v"))
		const observer = new QueryObserver(client, { queryKey: ["a"], queryFn, staleTime: Infinity })
		const off = observer.subscribe(() => {})
		await flush()
		client.setQueryData(["b"], 1)
		await invalidateQueries(client, { predicate: (q) => q.queryKey[0] !== "zzz" })
		expect(queryFn).toHaveBeenCalledTimes(2)
		expect(client.getQueryState(["b"])?.isInvalidated).toBe(true)
		await invalidateQueries(client)
		expect(queryFn).toHaveBeenCalledTimes(3)
		off()
	})

	it("refetchQueries refetches fresh observed queries and leaves unobserved ones alone", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve("v"))
		const observer = new QueryObserver(client, { queryKey: ["a"], queryFn, staleTime: Infinity })
		const off = observer.subscribe(() => {})
		await flush()
		client.setQueryData(["b"], 1)
		await refetchQueries(client)
		expect(queryFn).toHaveBeenCalledTimes(2)
		expect(client.getQueryState(["b"])?.isInvalidated).toBe(false)
		await refetchQueries(client, { queryKey: ["b"] })
		expect(queryFn).toHaveBeenCalledTimes(2)
		off()
	})
})

describe("invalidateQueries: refetchType", () => {
	it("'none' marks everything outdated without refetching the queries on screen", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve("v"))
		const observer = new QueryObserver(client, { queryKey: ["a"], queryFn, staleTime: Infinity })
		const off = observer.subscribe(() => {})
		await flush()
		client.setQueryData(["b"], 1)
		const told = vi.fn()
		client.onChange(told)
		await invalidateQueries(client, { refetchType: "none" })
		expect(queryFn).toHaveBeenCalledOnce() // not refetched now
		expect(client.getQueryState(["a"])?.isInvalidated).toBe(true)
		expect(client.getQueryState(["b"])?.isInvalidated).toBe(true)
		expect(told).not.toHaveBeenCalled() // quiet: nobody was told
		expect(observer.getSnapshot().isStale).toBe(true)
		// An entry that is already marked is left alone; the default still refetches.
		await invalidateQueries(client, { refetchType: "none" })
		await invalidateQueries(client, { refetchType: "active" })
		expect(queryFn).toHaveBeenCalledTimes(2)
		// It is refetched the next time the page is focused (the data is stale).
		await invalidateQueries(client, { refetchType: "none" })
		expect(queryFn).toHaveBeenCalledTimes(2)
		off()
		const later = new QueryObserver(client, { queryKey: ["a"], queryFn, staleTime: Infinity })
		const offLater = later.subscribe(() => {})
		await flush()
		expect(queryFn).toHaveBeenCalledTimes(3) // mounting again loads it
		offLater()
	})
})

describe("cancelQueries", () => {
	it("aborts matching fetches only", async () => {
		const { client } = setup()
		const never = () => new Promise<string>(() => {})
		const a = client.fetchQuery(["a"], never)
		const b = client.fetchQuery(["b"], never)
		b.catch(() => {})
		cancelQueries(client, { queryKey: ["a"] })
		await expect(a).rejects.toSatisfy(isCancelledError)
		expect(isCancelledError(new Error("x"))).toBe(false)
		expect(client.getQueryState(["a"])?.isFetching).toBe(false)
		expect(client.getQueryState(["b"])?.isFetching).toBe(true)
		cancelQueries(client)
		expect(client.getQueryState(["b"])?.isFetching).toBe(false)
	})
})

describe("getQueriesData / setQueriesData", () => {
	it("reads and updates every match; an undefined result skips the entry", () => {
		const { client } = setup()
		client.setQueryData(["todos", 1], { done: false })
		client.setQueryData(["todos", 2], { done: false })
		client.getQuery(["todos", 3])
		client.setQueryData(["users"], "u")
		expect(getQueriesData(client, { queryKey: ["users"] })).toEqual([[["users"], "u"]])
		expect(getQueriesData(client)).toHaveLength(4)
		const result = setQueriesData<{ done: boolean }>(client, { queryKey: ["todos"] }, (old) => (old ? { done: true } : undefined))
		expect(result).toEqual([
			[["todos", 1], { done: true }],
			[["todos", 2], { done: true }],
			[["todos", 3], undefined],
		])
		expect(client.getQueryState(["todos", 3])?.status).toBe("idle")
		setQueriesData(client, { queryKey: ["users"] }, "v")
		expect(client.getQueryData(["users"])).toBe("v")
	})
})

describe("ensureQueryData", () => {
	it("fetches when there is no data, returns cached data otherwise", async () => {
		const { client, scheduler } = setup()
		const queryFn = vi.fn(() => Promise.resolve("data"))
		expect(await ensureQueryData(client, { queryKey: ["k"], queryFn })).toBe("data")
		scheduler.advance(60_000)
		expect(await ensureQueryData(client, { queryKey: ["k"], queryFn })).toBe("data")
		expect(queryFn).toHaveBeenCalledOnce()
	})

	it("rejects when the fetch fails", async () => {
		const { client } = setup()
		await expect(ensureQueryData(client, { queryKey: ["k"], queryFn: () => Promise.reject(new Error("no")) })).rejects.toThrow("no")
	})

	it("revalidateIfStale refetches stale or invalidated data in the background", async () => {
		const { client, scheduler } = setup()
		let n = 0
		const queryFn = vi.fn(() => Promise.resolve(++n))
		const options = { queryKey: ["k"], queryFn, staleTime: 1000, revalidateIfStale: true }
		expect(await ensureQueryData(client, options)).toBe(1)
		scheduler.advance(500)
		expect(await ensureQueryData(client, options)).toBe(1)
		expect(queryFn).toHaveBeenCalledOnce()
		scheduler.advance(500)
		expect(await ensureQueryData(client, options)).toBe(1)
		await flush()
		expect(client.getQueryData(["k"])).toBe(2)
		await invalidateQueries(client)
		expect(await ensureQueryData(client, options)).toBe(2)
		await flush()
		expect(client.getQueryData(["k"])).toBe(3)
		// A failing background refresh is swallowed; default staleTime is 0.
		const failing = { queryKey: ["k"], queryFn: () => Promise.reject(new Error("x")), revalidateIfStale: true }
		expect(await ensureQueryData(client, failing)).toBe(3)
		await flush()
		expect(client.getQueryState(["k"])?.status).toBe("error")
	})
})
