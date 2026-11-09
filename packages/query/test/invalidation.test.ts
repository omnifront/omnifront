import { describe, expect, it, vi } from "vitest"
import { FakeScheduler } from "@omnifront/core/testing"
import { Mutation } from "../src/mutation"
import { QueryClient } from "../src/query-client"
import { QueryObserver } from "../src/query-observer"

const flush = () => new Promise<void>((r) => setTimeout(r, 0))
const setup = () => {
	const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
	return client
}
const counter = () => {
	let n = 0
	return vi.fn(() => Promise.resolve(++n))
}

describe("invalidateQueries", () => {
	it("refetches active observers even if the data is fresh", async () => {
		const client = setup()
		const fn = counter()
		const o = new QueryObserver(client, { queryKey: ["todos"], queryFn: fn, staleTime: Infinity })
		o.subscribe(() => {})
		await flush()
		expect(o.getSnapshot()).toMatchObject({ data: 1, isStale: false })
		await client.invalidateQueries({ queryKey: ["todos"] })
		expect(fn).toHaveBeenCalledTimes(2)
		expect(o.getSnapshot()).toMatchObject({ data: 2, isStale: false, isInvalidated: false })
	})

	it("marks the entry invalidated while refetching and keeps the old data visible", async () => {
		const client = setup()
		let release!: () => void
		let n = 0
		const o = new QueryObserver(client, {
			queryKey: ["k"],
			queryFn: () => new Promise<number>((r) => (release = () => r(++n))),
			staleTime: Infinity,
		})
		o.subscribe(() => {})
		release()
		await flush()
		const done = client.invalidateQueries()
		expect(o.getSnapshot()).toMatchObject({ data: 1, isFetching: true, status: "success" })
		release()
		await done
		expect(o.getSnapshot().data).toBe(2)
	})

	it("inactive queries are not fetched, but refetch when next observed", async () => {
		const client = setup()
		const fn = counter()
		const make = () => new QueryObserver(client, { queryKey: ["k"], queryFn: fn, staleTime: Infinity })
		const off = make().subscribe(() => {})
		await flush()
		off()
		await client.invalidateQueries({ queryKey: ["k"] })
		expect(fn).toHaveBeenCalledTimes(1)
		make().subscribe(() => {})
		expect(fn).toHaveBeenCalledTimes(2)
	})

	it("does not refetch disabled observers", async () => {
		const client = setup()
		const fn = counter()
		client.setQueryData(["k"], 0)
		new QueryObserver(client, { queryKey: ["k"], queryFn: fn, enabled: false }).subscribe(() => {})
		await client.invalidateQueries()
		expect(fn).not.toHaveBeenCalled()
		expect(client.getQueryState(["k"])?.isInvalidated).toBe(true)
	})

	it("matches by prefix, exactly, or everything", async () => {
		const client = setup()
		const keys = [["todos"], ["todos", 1], ["users"]]
		const fns = keys.map(() => counter())
		keys.forEach((queryKey, i) => {
			new QueryObserver(client, { queryKey, queryFn: fns[i]!, staleTime: Infinity }).subscribe(() => {})
		})
		await flush()
		await client.invalidateQueries({ queryKey: ["todos"] })
		expect(fns.map((f) => f.mock.calls.length)).toEqual([2, 2, 1])
		await client.invalidateQueries({ queryKey: ["todos"], exact: true })
		expect(fns.map((f) => f.mock.calls.length)).toEqual([3, 2, 1])
		await client.invalidateQueries()
		expect(fns.map((f) => f.mock.calls.length)).toEqual([4, 3, 2])
	})

	it("resolves even when a refetch fails", async () => {
		const client = setup()
		let fail = false
		const o = new QueryObserver(client, {
			queryKey: ["k"],
			queryFn: () => (fail ? Promise.reject(new Error("x")) : Promise.resolve(1)),
			staleTime: Infinity,
			retry: false,
		})
		o.subscribe(() => {})
		await flush()
		fail = true
		await expect(client.invalidateQueries()).resolves.toBeUndefined()
		expect(o.getSnapshot()).toMatchObject({ status: "error", data: 1 })
	})

	it("an invalidation during a fetch triggers one more fetch afterwards, not a loop", async () => {
		const client = setup()
		const gates: Array<() => void> = []
		let n = 0
		const o = new QueryObserver(client, {
			queryKey: ["k"],
			queryFn: () => new Promise<number>((r) => gates.push(() => r(++n))),
			staleTime: Infinity,
		})
		o.subscribe(() => {})
		client.invalidateQueries() // while the first fetch is running
		gates[0]!()
		await flush()
		expect(gates).toHaveLength(2)
		gates[1]!()
		await flush()
		expect(gates).toHaveLength(2)
		expect(o.getSnapshot()).toMatchObject({ data: 2, isInvalidated: false })
	})

	it("cancelling a fetch keeps a prior invalidation", async () => {
		const client = setup()
		client.setQueryData(["k"], 1)
		client.getQuery(["k"]).invalidate()
		const p = client.fetchQuery(["k"], () => new Promise<number>(() => {}))
		client.cancelQuery(["k"])
		await p.catch(() => {})
		expect(client.getQueryState(["k"])?.isInvalidated).toBe(true)
	})
})

describe("Mutation + invalidation", () => {
	it("stays pending until the invalidated queries have refetched", async () => {
		const client = setup()
		let server = ["a"]
		const o = new QueryObserver(client, {
			queryKey: ["todos"],
			queryFn: () => Promise.resolve([...server]),
			staleTime: Infinity,
		})
		o.subscribe(() => {})
		await flush()
		const add = new Mutation<void, Error, string>({
			mutationFn: (item) => {
				server = [...server, item]
				return Promise.resolve()
			},
			onSuccess: () => client.invalidateQueries({ queryKey: ["todos"] }),
		})
		await add.mutateAsync("b")
		expect(add.getSnapshot().status).toBe("success")
		expect(o.getSnapshot().data).toEqual(["a", "b"])
	})
})
