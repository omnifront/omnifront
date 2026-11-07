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
