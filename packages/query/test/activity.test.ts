import { FakeScheduler } from "@omnifront/core/testing"
import { describe, expect, it, vi } from "vitest"
import { createFetchingCount, createMutatingCount, trackMutation } from "../src/activity"
import { Mutation } from "../src/mutation"
import { QueryClient } from "../src/query-client"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const deferred = <T>() => {
	let resolve!: (v: T) => void
	let reject!: (e: unknown) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}
const setup = (gcTime = Infinity) => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime }) }
}

describe("QueryClient.onChange", () => {
	it("runs after any entry changes and once on clear; the returned function stops it", async () => {
		const { client } = setup()
		const listener = vi.fn()
		const off = client.onChange(listener)
		client.setQueryData(["a"], 1)
		expect(listener).toHaveBeenCalledTimes(1)
		await client.fetchQuery(["b"], () => Promise.resolve(2)) // fetching, then success
		expect(listener).toHaveBeenCalledTimes(3)
		client.clear()
		expect(listener).toHaveBeenCalledTimes(4)
		off()
		client.setQueryData(["c"], 3)
		expect(listener).toHaveBeenCalledTimes(4)
	})
})

describe("createFetchingCount", () => {
	it("counts queries while they fetch and notifies only when the number changes", async () => {
		const { client } = setup()
		const count = createFetchingCount(client)
		const listener = vi.fn()
		const off = count.subscribe(listener)
		expect(count.getSnapshot()).toBe(0)

		const a = deferred<string>()
		const b = deferred<string>()
		const pa = client.fetchQuery(["a"], () => a.promise)
		await flush()
		expect(count.getSnapshot()).toBe(1)
		const pb = client.fetchQuery(["b"], () => b.promise)
		await flush()
		expect(count.getSnapshot()).toBe(2)
		expect(listener).toHaveBeenCalledTimes(2)

		a.resolve("x")
		await pa
		await flush()
		expect(count.getSnapshot()).toBe(1)
		b.reject(new Error("boom")) // a failed fetch also stops counting
		await pb.catch(() => {})
		await flush()
		expect(count.getSnapshot()).toBe(0)
		expect(listener).toHaveBeenCalledTimes(4)

		// Changes that do not move the number stay silent (here: writing data into an idle entry).
		client.setQueryData(["c"], 1)
		await flush()
		expect(listener).toHaveBeenCalledTimes(4)
		off()
	})

	it("stops counting a cancelled fetch", async () => {
		const { client } = setup()
		const count = createFetchingCount(client)
		const off = count.subscribe(() => {})
		const p = client.fetchQuery(["a"], () => new Promise<string>(() => {}))
		await flush()
		expect(count.getSnapshot()).toBe(1)
		client.cancelQuery(["a"])
		await p.catch(() => {})
		await flush()
		expect(count.getSnapshot()).toBe(0)
		off()
	})

	it("filters by key prefix, or by exact key", async () => {
		const { client } = setup()
		const all = createFetchingCount(client)
		const todos = createFetchingCount(client, { queryKey: ["todos"] })
		const one = createFetchingCount(client, { queryKey: ["todos", 1], exact: true })
		const offs = [all, todos, one].map((c) => c.subscribe(() => {}))
		const hang = () => new Promise<string>(() => {})
		void client.fetchQuery(["todos"], hang)
		void client.fetchQuery(["todos", 1], hang)
		void client.fetchQuery(["todos", 2], hang)
		void client.fetchQuery(["users"], hang)
		await flush()
		expect([all, todos, one].map((c) => c.getSnapshot())).toEqual([4, 3, 1])
		offs.forEach((off) => off())
	})

	it("reads fresh values while nobody is subscribed, and is 0 on the server", async () => {
		const { client } = setup()
		const count = createFetchingCount(client)
		expect(count.getSnapshot()).toBe(0)
		void client.fetchQuery(["a"], () => new Promise<string>(() => {}))
		expect(count.getSnapshot()).toBe(1)
		expect(count.getServerSnapshot?.()).toBe(0)
	})

	it("attaches to the client only while somebody listens", () => {
		const { client } = setup()
		const detach = vi.fn()
		const onChange = vi.spyOn(client, "onChange").mockReturnValue(detach)
		const count = createFetchingCount(client)
		expect(onChange).not.toHaveBeenCalled()
		const off1 = count.subscribe(() => {})
		const off2 = count.subscribe(() => {})
		expect(onChange).toHaveBeenCalledTimes(1)
		off1()
		expect(detach).not.toHaveBeenCalled() // one listener left
		off2()
		expect(detach).toHaveBeenCalledTimes(1)
	})

	it("does not keep cache entries alive: gc still removes unobserved ones", async () => {
		const { client, scheduler } = setup(1000)
		const count = createFetchingCount(client)
		const off = count.subscribe(() => {})
		await client.fetchQuery(["a"], () => Promise.resolve(1))
		const entry = client.getQueries()[0]?.query
		expect(entry?.hasListeners).toBe(false)
		scheduler.advance(1000)
		expect(client.getQueries()).toHaveLength(0)
		off()
	})

	it("follows clear() while a fetch is in flight", async () => {
		const { client } = setup()
		const count = createFetchingCount(client)
		const off = count.subscribe(() => {})
		void client.fetchQuery(["a"], () => new Promise<string>(() => {})).catch(() => {})
		await flush()
		expect(count.getSnapshot()).toBe(1)
		client.clear()
		await flush()
		expect(count.getSnapshot()).toBe(0)
		off()
	})
})

describe("createMutatingCount / trackMutation", () => {
	it("counts a tracked mutation while it is pending", async () => {
		const { client } = setup()
		const count = createMutatingCount(client)
		const listener = vi.fn()
		const off = count.subscribe(listener)
		const d = deferred<string>()
		const mutation = new Mutation<string, void>({ mutationFn: () => d.promise })
		trackMutation(client, mutation)
		expect(count.getSnapshot()).toBe(0) // tracked but idle

		const run = mutation.mutateAsync()
		await flush()
		expect(count.getSnapshot()).toBe(1)
		d.resolve("ok")
		await run
		await flush()
		expect(count.getSnapshot()).toBe(0)
		expect(listener).toHaveBeenCalledTimes(2)
		off()
	})

	it("counts failures as finished, and each mutation separately", async () => {
		const { client } = setup()
		const count = createMutatingCount(client)
		const off = count.subscribe(() => {})
		const d1 = deferred<string>()
		const d2 = deferred<string>()
		const m1 = new Mutation<string, void>({ mutationFn: () => d1.promise })
		const m2 = new Mutation<string, void>({ mutationFn: () => d2.promise })
		trackMutation(client, m1)
		trackMutation(client, m2)
		const r1 = m1.mutateAsync().catch(() => {})
		m2.mutate()
		await flush()
		expect(count.getSnapshot()).toBe(2)
		d1.reject(new Error("x"))
		await r1
		await flush()
		expect(count.getSnapshot()).toBe(1)
		d2.resolve("y")
		await flush()
		expect(count.getSnapshot()).toBe(0)
		off()
	})

	it("keeps counting a pending mutation after it is untracked, until it settles", async () => {
		const { client } = setup()
		const count = createMutatingCount(client)
		const off = count.subscribe(() => {})
		const d = deferred<string>()
		const mutation = new Mutation<string, void>({ mutationFn: () => d.promise })
		const untrack = trackMutation(client, mutation)
		mutation.mutate()
		await flush()
		untrack() // e.g. the component unmounted mid-request
		untrack() // calling it twice is harmless
		await flush()
		expect(count.getSnapshot()).toBe(1)
		d.resolve("done")
		await flush()
		expect(count.getSnapshot()).toBe(0)
		// Released for good: later runs of the same slot no longer count.
		mutation.mutate()
		await flush()
		expect(count.getSnapshot()).toBe(0)
		off()
	})

	it("untracking an idle mutation stops counting right away", async () => {
		const { client } = setup()
		const count = createMutatingCount(client)
		const off = count.subscribe(() => {})
		const mutation = new Mutation<string, void>({ mutationFn: () => new Promise<string>(() => {}) })
		trackMutation(client, mutation)()
		mutation.mutate()
		await flush()
		expect(count.getSnapshot()).toBe(0)
		off()
	})

	it("keeps clients apart, reads fresh when unsubscribed, and is 0 on the server", async () => {
		const a = setup().client
		const b = setup().client
		const countA = createMutatingCount(a)
		const countB = createMutatingCount(b)
		const mutation = new Mutation<string, void>({ mutationFn: () => new Promise<string>(() => {}) })
		trackMutation(a, mutation)
		mutation.mutate()
		await flush()
		expect(countA.getSnapshot()).toBe(1)
		expect(countB.getSnapshot()).toBe(0)
		expect(countA.getServerSnapshot?.()).toBe(0)
	})
})
