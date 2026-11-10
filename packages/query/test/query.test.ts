import { describe, expect, it, vi } from "vitest"
import { FakeScheduler } from "@omnifront/core/testing"
import { CancelledError, Query } from "../src/query"

const deferred = <T>() => {
	let resolve!: (v: T) => void
	let reject!: (e: unknown) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

describe("Query", () => {
	it("starts idle", () => {
		const q = new Query<number>(new FakeScheduler())
		expect(q.getSnapshot()).toMatchObject({ status: "idle", data: undefined, isFetching: false })
	})

	it("goes loading -> success and stamps dataUpdatedAt", async () => {
		const s = new FakeScheduler()
		s.advance(100)
		const q = new Query<number>(s)
		const d = deferred<number>()
		const p = q.fetch(() => d.promise)
		expect(q.getSnapshot()).toMatchObject({ status: "loading", isFetching: true })
		d.resolve(7)
		await p
		expect(q.getSnapshot()).toEqual({
			status: "success",
			data: 7,
			error: undefined,
			isFetching: false,
			isPaused: false,
			isInvalidated: false,
			failureCount: 0,
			dataUpdatedAt: 100,
		})
	})

	it("deduplicates concurrent fetches", async () => {
		const q = new Query<number>(new FakeScheduler())
		const fn = vi.fn(() => Promise.resolve(1))
		const [a, b] = [q.fetch(fn), q.fetch(fn)]
		expect(a).toBe(b)
		await a
		expect(fn).toHaveBeenCalledTimes(1)
		await q.fetch(fn)
		expect(fn).toHaveBeenCalledTimes(2)
	})

	it("ends in error state and rejects; a later fetch can recover", async () => {
		const q = new Query<number>(new FakeScheduler())
		await expect(q.fetch(() => Promise.reject(new Error("no")))).rejects.toThrow("no")
		expect(q.getSnapshot()).toMatchObject({ status: "error", isFetching: false })
		await q.fetch(() => Promise.resolve(2))
		expect(q.getSnapshot()).toMatchObject({ status: "success", data: 2, error: undefined })
	})

	it("turns a synchronous throw in fn into an error state", async () => {
		const q = new Query<number>(new FakeScheduler())
		await expect(
			q.fetch(() => {
				throw new Error("sync")
			}),
		).rejects.toThrow("sync")
		expect(q.getSnapshot().status).toBe("error")
	})

	it("keeps old data and status while refetching", async () => {
		const q = new Query<number>(new FakeScheduler())
		q.setData(1)
		const d = deferred<number>()
		const p = q.fetch(() => d.promise)
		expect(q.getSnapshot()).toMatchObject({ status: "success", data: 1, isFetching: true })
		d.resolve(2)
		await p
		expect(q.getSnapshot().data).toBe(2)
	})

	it("returns the same snapshot reference until something changes", () => {
		const q = new Query<number>(new FakeScheduler())
		const a = q.getSnapshot()
		expect(q.getSnapshot()).toBe(a)
		q.setData(1)
		expect(q.getSnapshot()).not.toBe(a)
	})

	it("notifies subscribers once per state change", async () => {
		const q = new Query<number>(new FakeScheduler())
		const l = vi.fn()
		q.subscribe(l)
		await q.fetch(() => Promise.resolve(1))
		expect(l).toHaveBeenCalledTimes(2) // loading, then success
	})
})

describe("Query gc", () => {
	it("calls onGc after gcTime when nobody observes it", () => {
		const s = new FakeScheduler()
		const onGc = vi.fn()
		new Query(s, { gcTime: 100, onGc })
		s.advance(99)
		expect(onGc).not.toHaveBeenCalled()
		s.advance(1)
		expect(onGc).toHaveBeenCalledTimes(1)
	})

	it("subscribing cancels gc; the last unsubscribe restarts it", () => {
		const s = new FakeScheduler()
		const onGc = vi.fn()
		const q = new Query(s, { gcTime: 100, onGc })
		const off = q.subscribe(() => {})
		s.advance(500)
		expect(onGc).not.toHaveBeenCalled()
		off()
		s.advance(100)
		expect(onGc).toHaveBeenCalledTimes(1)
	})

	it("never collects with gcTime Infinity; the longest gcTime wins", () => {
		const s = new FakeScheduler()
		const onGc = vi.fn()
		const q = new Query(s, { gcTime: Infinity, onGc })
		s.advance(1e12)
		expect(onGc).not.toHaveBeenCalled()
		const q2 = new Query(s, { gcTime: 100, onGc })
		q2.updateGcTime(50)
		q2.updateGcTime(300)
		const off = q2.subscribe(() => {})
		off()
		s.advance(299)
		expect(onGc).not.toHaveBeenCalled()
		s.advance(1)
		expect(onGc).toHaveBeenCalledTimes(1)
		expect(q.getSnapshot().status).toBe("idle")
	})

	it("destroy cancels the pending gc timer", () => {
		const s = new FakeScheduler()
		const q = new Query(s, { gcTime: 100 })
		q.destroy()
		expect(s.pendingTimers).toBe(0)
	})
})

const never = <T>() => new Promise<T>(() => {})
const flush = () => new Promise<void>((r) => setTimeout(r, 0))

describe("Query retry", () => {
	it("retries with backoff until it succeeds and exposes failureCount meanwhile", async () => {
		const s = new FakeScheduler()
		const q = new Query<number>(s, { gcTime: Infinity })
		let calls = 0
		const p = q.fetch(() => (++calls < 3 ? Promise.reject(new Error("x")) : Promise.resolve(9)), { retry: 3 })
		await flush()
		expect(q.getSnapshot()).toMatchObject({ status: "loading", isFetching: true, failureCount: 1 })
		s.advance(1000)
		await flush()
		expect(q.getSnapshot().failureCount).toBe(2)
		s.advance(2000)
		await expect(p).resolves.toBe(9)
		expect(q.getSnapshot()).toMatchObject({ status: "success", data: 9, failureCount: 0 })
		expect(s.pendingTimers).toBe(0)
	})

	it("rejects with the last error once retries are exhausted", async () => {
		const s = new FakeScheduler()
		const q = new Query<number>(s, { gcTime: Infinity })
		let calls = 0
		const p = q.fetch(() => Promise.reject(new Error(`e${++calls}`)), { retry: 1, retryDelay: 10 })
		const assertion = expect(p).rejects.toThrow("e2")
		await flush()
		s.advance(10)
		await assertion
		expect(q.getSnapshot()).toMatchObject({ status: "error", isFetching: false })
	})

	it("does not retry by default", async () => {
		const q = new Query<number>(new FakeScheduler())
		const fn = vi.fn(() => Promise.reject(new Error("x")))
		await expect(q.fetch(fn)).rejects.toThrow()
		expect(fn).toHaveBeenCalledTimes(1)
	})
})

describe("Query cancel", () => {
	it("aborts the signal, rejects with CancelledError and restores a fresh entry to idle", async () => {
		const q = new Query<number>(new FakeScheduler())
		let signal!: AbortSignal
		const p = q.fetch((ctx) => {
			signal = ctx.signal
			return never<number>()
		})
		q.cancel()
		await expect(p).rejects.toBeInstanceOf(CancelledError)
		expect(signal.aborted).toBe(true)
		expect(q.getSnapshot()).toMatchObject({ status: "idle", isFetching: false, failureCount: 0 })
	})

	it("restores the previous data when cancelling a refetch", async () => {
		const q = new Query<number>(new FakeScheduler())
		q.setData(1)
		const p = q.fetch(() => never<number>())
		q.cancel()
		await expect(p).rejects.toBeInstanceOf(CancelledError)
		expect(q.getSnapshot()).toMatchObject({ status: "success", data: 1, isFetching: false })
	})

	it("cancels a pending retry timer", async () => {
		const s = new FakeScheduler()
		const q = new Query<number>(s, { gcTime: Infinity })
		const fn = vi.fn(() => Promise.reject(new Error("x")))
		const p = q.fetch(fn, { retry: 5 })
		const assertion = expect(p).rejects.toBeInstanceOf(CancelledError)
		await flush()
		expect(s.pendingTimers).toBe(1)
		q.cancel()
		await assertion
		expect(s.pendingTimers).toBe(0)
		s.advance(100_000)
		expect(fn).toHaveBeenCalledTimes(1)
	})

	it("ignores a late result from a cancelled request and lets a new fetch start", async () => {
		const q = new Query<number>(new FakeScheduler())
		let resolveOld!: (v: number) => void
		const old = q.fetch(() => new Promise<number>((r) => (resolveOld = r)))
		const oldAssertion = expect(old).rejects.toBeInstanceOf(CancelledError)
		q.cancel()
		await oldAssertion
		const next = q.fetch(() => Promise.resolve(2))
		resolveOld(1)
		await expect(next).resolves.toBe(2)
		expect(q.getSnapshot().data).toBe(2)
	})

	it("does nothing when nothing is in flight; destroy cancels work", async () => {
		const q = new Query<number>(new FakeScheduler())
		q.cancel()
		const p = q.fetch(() => never<number>())
		const assertion = expect(p).rejects.toBeInstanceOf(CancelledError)
		q.destroy()
		await assertion
	})
})
