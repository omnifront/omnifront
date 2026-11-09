import { QueryClient } from "@omnifront/query"
import { describe, expect, it } from "vitest"
import { createApi } from "../src"
import { createMockAdapter } from "../src/testing"

describe("with @omnifront/query", () => {
	it("queryOptions drive fetchQuery, share the cache key and dedupe", async () => {
		const adapter = createMockAdapter({ "GET /todos": { data: [{ id: 1 }] } })
		const api = createApi({ adapter })
		const client = new QueryClient()
		const todos = api.queryOptions<{ id: number }[]>("/todos", { params: { done: false } })
		const [a, b] = await Promise.all([
			client.fetchQuery(todos.queryKey, todos.queryFn),
			client.fetchQuery(todos.queryKey, todos.queryFn),
		])
		expect(a).toEqual([{ id: 1 }])
		expect(b).toBe(a)
		expect(adapter.calls).toHaveLength(1)
	})

	it("api.queryKey prefix invalidates queries made with queryOptions", async () => {
		const adapter = createMockAdapter({ "GET /todos": { data: [] } })
		const api = createApi({ adapter })
		const client = new QueryClient()
		const todos = api.queryOptions("/todos", { params: { page: 1 } })
		await client.fetchQuery(todos.queryKey, todos.queryFn)
		expect(client.getQuery(todos.queryKey).getSnapshot().isInvalidated).toBe(false)
		await client.invalidateQueries({ queryKey: api.queryKey("/todos") })
		expect(client.getQuery(todos.queryKey).getSnapshot().isInvalidated).toBe(true)
	})

	it("cancelling the query aborts the HTTP request", async () => {
		const seen: AbortSignal[] = []
		const adapter = createMockAdapter(
			(req) =>
				new Promise((_, reject) => {
					seen.push(req.signal)
					req.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))
				}),
		)
		const api = createApi({ adapter })
		const client = new QueryClient()
		const slow = api.queryOptions("/slow")
		const pending = client.fetchQuery(slow.queryKey, slow.queryFn).catch((e: unknown) => e)
		await Promise.resolve()
		client.cancelQuery(slow.queryKey)
		await pending
		expect(seen[0]?.aborted).toBe(true)
	})
})
