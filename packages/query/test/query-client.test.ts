import { describe, expect, it, vi } from "vitest"
import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "../src/query-client"

describe("QueryClient", () => {
	it("shares one cache entry for equivalent keys", async () => {
		const c = new QueryClient({ scheduler: new FakeScheduler() })
		const fn = vi.fn(() => Promise.resolve("x"))
		await Promise.all([
			c.fetchQuery(["todos", { a: 1, b: 2 }], fn),
			c.fetchQuery(["todos", { b: 2, a: 1 }], fn),
		])
		expect(fn).toHaveBeenCalledTimes(1)
		expect(c.getQueryData(["todos", { a: 1, b: 2 }])).toBe("x")
	})

	it("keeps different keys separate", async () => {
		const c = new QueryClient({ scheduler: new FakeScheduler() })
		await c.fetchQuery(["a"], () => Promise.resolve(1))
		await c.fetchQuery(["b"], () => Promise.resolve(2))
		expect(c.getQueryData(["a"])).toBe(1)
		expect(c.getQueryData(["b"])).toBe(2)
	})

	it("returns undefined for unknown keys without creating them", () => {
		const c = new QueryClient()
		expect(c.getQueryState(["nope"])).toBeUndefined()
		expect(c.getQueryData(["nope"])).toBeUndefined()
	})

	it("setQueryData writes to the cache", () => {
		const c = new QueryClient({ scheduler: new FakeScheduler() })
		c.setQueryData(["n"], 5)
		expect(c.getQueryState<number>(["n"])).toMatchObject({ status: "success", data: 5 })
	})

	it("clear empties the cache; default scheduler is used when none is given", () => {
		const c = new QueryClient()
		c.setQueryData(["n"], 5)
		c.clear()
		expect(c.getQueryData(["n"])).toBeUndefined()
	})
})

describe("QueryClient gc", () => {
	it("drops unobserved entries after gcTime and uses the client default", () => {
		const s = new FakeScheduler()
		const c = new QueryClient({ scheduler: s, gcTime: 1000 })
		c.setQueryData(["a"], 1)
		s.advance(999)
		expect(c.getQueryData(["a"])).toBe(1)
		s.advance(1)
		expect(c.getQueryState(["a"])).toBeUndefined()
	})

	it("a replaced entry's old gc timer does not delete the new one", () => {
		const s = new FakeScheduler()
		const c = new QueryClient({ scheduler: s, gcTime: 1000 })
		c.getQuery(["a"])
		const old = c.getQuery(["a"])
		c.clear()
		const fresh = c.getQuery(["a"])
		expect(fresh).not.toBe(old)
		s.advance(1000)
		expect(c.getQueryState(["a"])).toBeUndefined() // fresh entry itself expired
	})

	it("lengthens gcTime of an existing entry when asked", () => {
		const s = new FakeScheduler()
		const c = new QueryClient({ scheduler: s, gcTime: 100 })
		const q = c.getQuery(["a"])
		c.getQuery(["a"], 500)
		const off = q.subscribe(() => {})
		off()
		s.advance(499)
		expect(c.getQueryState(["a"])).toBeDefined()
		s.advance(1)
		expect(c.getQueryState(["a"])).toBeUndefined()
	})
})
