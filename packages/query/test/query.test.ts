import { describe, expect, it, vi } from "vitest"
import { FakeScheduler } from "@unicore/core/testing"
import { Query } from "../src/query"

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
