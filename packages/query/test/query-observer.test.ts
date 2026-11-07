import { describe, expect, it, vi } from "vitest"
import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "../src/query-client"
import { QueryObserver } from "../src/query-observer"

const flush = () => new Promise<void>((r) => setTimeout(r, 0))
const setup = (gcTime?: number) => {
	const scheduler = new FakeScheduler()
	const client = new QueryClient({ scheduler, ...(gcTime === undefined ? {} : { gcTime }) })
	return { scheduler, client }
}

describe("QueryObserver", () => {
	it("fetches on first subscribe: loading, then success", async () => {
		const { client } = setup()
		const fn = vi.fn(() => Promise.resolve("x"))
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: fn })
		o.subscribe(() => {})
		expect(o.getSnapshot()).toMatchObject({ status: "loading", isFetching: true })
		await flush()
		expect(o.getSnapshot()).toMatchObject({ status: "success", data: "x", isFetching: false })
		expect(fn).toHaveBeenCalledTimes(1)
	})

	it("snapshot keeps its reference until something changes", async () => {
		const { client } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1), staleTime: 1000 })
		o.subscribe(() => {})
		await flush()
		expect(o.getSnapshot()).toBe(o.getSnapshot())
	})

	it("flips isStale and notifies when staleTime passes", async () => {
		const { client, scheduler } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1), staleTime: 1000 })
		const l = vi.fn()
		o.subscribe(l)
		await flush()
		const fresh = o.getSnapshot()
		expect(fresh.isStale).toBe(false)
		l.mockClear()
		scheduler.advance(999)
		expect(l).not.toHaveBeenCalled()
		scheduler.advance(1)
		expect(l).toHaveBeenCalledTimes(1)
		expect(o.getSnapshot().isStale).toBe(true)
		expect(o.getSnapshot()).not.toBe(fresh)
	})

	it("never goes stale with staleTime Infinity", async () => {
		const { client, scheduler } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1), staleTime: Infinity })
		o.subscribe(() => {})
		await flush()
		scheduler.advance(1e12)
		expect(o.getSnapshot().isStale).toBe(false)
	})

	it("handles staleTime longer than the max timer delay", async () => {
		const { client, scheduler } = setup()
		const staleTime = 2 ** 31 + 1000
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1), staleTime })
		o.subscribe(() => {})
		await flush()
		scheduler.advance(2 ** 31 - 1)
		expect(o.getSnapshot().isStale).toBe(false)
		scheduler.advance(1001)
		expect(o.getSnapshot().isStale).toBe(true)
	})

	it("does not refetch fresh data on a new subscribe, but refetches stale data", async () => {
		const { client, scheduler } = setup()
		const fn = vi.fn(() => Promise.resolve(1))
		const make = () => new QueryObserver(client, { queryKey: ["k"], queryFn: fn, staleTime: 1000 })
		const off = make().subscribe(() => {})
		await flush()
		off()
		make().subscribe(() => {})
		expect(fn).toHaveBeenCalledTimes(1)
		scheduler.advance(1000)
		make().subscribe(() => {})
		expect(fn).toHaveBeenCalledTimes(2)
	})

	it("two observers on the same key share one request", async () => {
		const { client } = setup()
		const fn = vi.fn(() => Promise.resolve(1))
		const a = new QueryObserver(client, { queryKey: ["k"], queryFn: fn })
		const b = new QueryObserver(client, { queryKey: ["k"], queryFn: fn })
		a.subscribe(() => {})
		b.subscribe(() => {})
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
		expect(b.getSnapshot().data).toBe(1)
	})

	it("does not fetch when disabled", () => {
		const { client } = setup()
		const fn = vi.fn(() => Promise.resolve(1))
		new QueryObserver(client, { queryKey: ["k"], queryFn: fn, enabled: false }).subscribe(() => {})
		expect(fn).not.toHaveBeenCalled()
	})

	it("exposes errors in state without an unhandled rejection", async () => {
		const { client } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.reject(new Error("bad")), retry: false })
		o.subscribe(() => {})
		await flush()
		expect(o.getSnapshot()).toMatchObject({ status: "error", isFetching: false })
	})

	it("refetch() runs the query again and rejects on failure", async () => {
		const { client } = setup()
		let n = 0
		const o = new QueryObserver(client, {
			queryKey: ["k"],
			queryFn: () => (++n === 2 ? Promise.reject(new Error("2")) : Promise.resolve(n)),
			staleTime: Infinity,
			retry: false,
		})
		o.subscribe(() => {})
		await flush()
		await expect(o.refetch()).rejects.toThrow("2")
		expect(o.getSnapshot()).toMatchObject({ status: "error", data: 1 })
	})

	it("collects the entry gcTime after the last observer leaves; resubscribing in time keeps it", async () => {
		const { client, scheduler } = setup(1000)
		const make = () => new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1) })
		const off = make().subscribe(() => {})
		await flush()
		off()
		scheduler.advance(999)
		const off2 = make().subscribe(() => {})
		scheduler.advance(5000)
		expect(client.getQueryData(["k"])).toBe(1)
		off2()
		scheduler.advance(1000)
		expect(client.getQueryState(["k"])).toBeUndefined()
	})

	it("unsubscribing stops stale notifications", async () => {
		const { client, scheduler } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1), staleTime: 1000 })
		const l = vi.fn()
		const off = o.subscribe(l)
		await flush()
		off()
		l.mockClear()
		scheduler.advance(5000)
		expect(l).not.toHaveBeenCalled()
	})
})

describe("QueryObserver before mount", () => {
	it("reports loading/isFetching optimistically, with a stable reference", () => {
		const { client } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1) })
		expect(o.getSnapshot()).toMatchObject({ status: "loading", isFetching: true, isStale: true })
		expect(o.getSnapshot()).toBe(o.getSnapshot())
	})

	it("stays idle when disabled, and shows isFetching over stale data", () => {
		const { client } = setup()
		const off = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1), enabled: false })
		expect(off.getSnapshot()).toMatchObject({ status: "idle", isFetching: false })
		client.setQueryData(["d"], "cached")
		const stale = new QueryObserver(client, { queryKey: ["d"], queryFn: () => Promise.resolve("new") })
		expect(stale.getSnapshot()).toMatchObject({ status: "success", data: "cached", isFetching: true })
		const fresh = new QueryObserver(client, { queryKey: ["d"], queryFn: () => Promise.resolve("new"), staleTime: Infinity })
		expect(fresh.getSnapshot()).toMatchObject({ isFetching: false, isStale: false })
	})

	it("returns to the real state once subscribed", () => {
		const { client } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => new Promise<number>(() => {}) })
		const before = o.getSnapshot()
		o.subscribe(() => {})
		expect(o.getSnapshot()).toMatchObject({ status: "loading", isFetching: true })
		expect(o.getSnapshot()).not.toBe(before)
	})
})

describe("QueryObserver.setOptions", () => {
	it("switches to the new key's data, fetches it, and notifies", async () => {
		const { client } = setup()
		const fn = vi.fn((id: number) => Promise.resolve(`item-${id}`))
		const o = new QueryObserver(client, { queryKey: ["item", 1], queryFn: () => fn(1), staleTime: Infinity })
		const l = vi.fn()
		o.subscribe(l)
		await flush()
		l.mockClear()
		o.setOptions({ queryKey: ["item", 2], queryFn: () => fn(2), staleTime: Infinity })
		expect(l).toHaveBeenCalled()
		expect(o.getSnapshot()).toMatchObject({ status: "loading", data: undefined })
		await flush()
		expect(o.getSnapshot().data).toBe("item-2")
		o.setOptions({ queryKey: ["item", 1], queryFn: () => fn(1), staleTime: Infinity })
		expect(o.getSnapshot().data).toBe("item-1") // cached, not stale: no refetch
		expect(fn).toHaveBeenCalledTimes(2)
	})

	it("an inactive observer just points at the new query", async () => {
		const { client } = setup()
		client.setQueryData(["b"], "B")
		const o = new QueryObserver(client, { queryKey: ["a"], queryFn: () => Promise.resolve("A") })
		o.setOptions({ queryKey: ["b"], queryFn: () => Promise.resolve("B") })
		expect(o.getSnapshot().data).toBe("B")
	})

	it("same options on every render never refetch, even when data is stale (staleTime 0)", async () => {
		const { client } = setup()
		const fn = vi.fn(() => Promise.resolve(1))
		const options = { queryKey: ["k"], queryFn: fn }
		const o = new QueryObserver(client, options)
		o.subscribe(() => {})
		await flush()
		for (let i = 0; i < 5; i++) o.setOptions({ ...options })
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
	})

	it("a changed staleTime re-arms the stale timer and notifies", async () => {
		const { client, scheduler } = setup()
		const base = { queryKey: ["k"], queryFn: () => Promise.resolve(1) }
		const o = new QueryObserver(client, { ...base, staleTime: Infinity })
		const l = vi.fn()
		o.subscribe(l)
		await flush()
		l.mockClear()
		o.setOptions({ ...base, staleTime: 500 })
		expect(l).toHaveBeenCalledTimes(1)
		expect(o.getSnapshot().isStale).toBe(false)
		scheduler.advance(500)
		expect(o.getSnapshot().isStale).toBe(true)
	})

	it("same key: re-evaluates fetching when enabled turns on", () => {
		const { client } = setup()
		const fn = vi.fn(() => Promise.resolve(1))
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: fn, enabled: false })
		o.subscribe(() => {})
		expect(fn).not.toHaveBeenCalled()
		o.setOptions({ queryKey: ["k"], queryFn: fn, enabled: true })
		expect(fn).toHaveBeenCalledTimes(1)
	})
})

describe("QueryObserver retry", () => {
	it("retries 3 times by default with exponential backoff, then shows the error", async () => {
		const { client, scheduler } = setup()
		const fn = vi.fn(() => Promise.reject(new Error("down")))
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: fn })
		o.subscribe(() => {})
		await flush()
		expect(o.getSnapshot()).toMatchObject({ status: "loading", isFetching: true, failureCount: 1 })
		for (const wait of [1000, 2000, 4000]) {
			scheduler.advance(wait)
			await flush()
		}
		expect(fn).toHaveBeenCalledTimes(4)
		expect(o.getSnapshot()).toMatchObject({ status: "error", isFetching: false })
	})

	it("honours retry and retryDelay options", async () => {
		const { client, scheduler } = setup()
		const fn = vi.fn(() => Promise.reject(new Error("down")))
		new QueryObserver(client, { queryKey: ["k"], queryFn: fn, retry: 1, retryDelay: 50 }).subscribe(() => {})
		await flush()
		scheduler.advance(49)
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
		scheduler.advance(1)
		await flush()
		expect(fn).toHaveBeenCalledTimes(2)
		scheduler.advance(10_000)
		await flush()
		expect(fn).toHaveBeenCalledTimes(2)
	})

	it("passes an AbortSignal to the query function", async () => {
		const { client } = setup()
		let signal: AbortSignal | undefined
		new QueryObserver(client, {
			queryKey: ["k"],
			queryFn: (ctx) => {
				signal = ctx.signal
				return Promise.resolve(1)
			},
		}).subscribe(() => {})
		await flush()
		expect(signal?.aborted).toBe(false)
	})
})

describe("cancel", () => {
	it("client.cancelQuery aborts the observer's fetch and restores the state", async () => {
		const { client } = setup()
		let signal: AbortSignal | undefined
		const o = new QueryObserver(client, {
			queryKey: ["k"],
			queryFn: (ctx) => {
				signal = ctx.signal
				return new Promise<number>(() => {})
			},
		})
		o.subscribe(() => {})
		expect(o.getSnapshot().isFetching).toBe(true)
		client.cancelQuery(["k"])
		await flush() // the swallowed CancelledError must not surface as unhandled
		expect(signal?.aborted).toBe(true)
		expect(o.getSnapshot()).toMatchObject({ status: "idle", isFetching: false })
	})
})
