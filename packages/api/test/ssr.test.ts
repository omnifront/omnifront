import { QueryClient } from "@omnifront/query"
import { dehydrate, hydrate } from "@omnifront/query/hydration"
import { describe, expect, it, vi } from "vitest"
import { createApi } from "../src"

/** What a server does per request: its own client, forwarding that request's cookie. */
function serverFetch(cookie: string, log: string[]): typeof fetch {
	return (async (input: RequestInfo | URL, init?: RequestInit) => {
		const headers = new Headers(init?.headers)
		log.push(`${String(input)} cookie=${cookie} sent=${headers.get("cookie") ?? "-"}`)
		return new Response(JSON.stringify({ user: cookie }), { headers: { "content-type": "application/json" } })
	}) as typeof fetch
}

describe("server rendering", () => {
	it("one instance per request keeps each user's headers apart, even when requests overlap", async () => {
		const log: string[] = []
		const makeApi = (cookie: string) =>
			createApi({ baseURL: "http://internal.test", headers: { cookie }, fetch: serverFetch(cookie, log) })
		const [a, b] = await Promise.all([makeApi("user=a").get<{ user: string }>("/me"), makeApi("user=b").get<{ user: string }>("/me")])
		expect(a.data.user).toBe("user=a")
		expect(b.data.user).toBe("user=b")
		expect(log.sort()).toEqual([
			"http://internal.test/me cookie=user=a sent=user=a",
			"http://internal.test/me cookie=user=b sent=user=b",
		])
	})

	it("a query prefetched through api.queryOptions is dehydrated, and the browser does not fetch it again", async () => {
		const serverCalls = vi.fn()
		const serverApi = createApi({
			baseURL: "http://internal.test",
			fetch: (async () => (serverCalls(), new Response(JSON.stringify([1, 2, 3])))) as unknown as typeof fetch,
		})
		const server = new QueryClient({ gcTime: Infinity })
		const todos = serverApi.queryOptions<number[]>("/todos", { params: { page: 1 } })
		await server.fetchQuery(todos.queryKey, todos.queryFn)
		const state = JSON.parse(JSON.stringify(dehydrate(server))) // what travels in the HTML

		const browserCalls = vi.fn()
		const browserApi = createApi({ fetch: (async () => (browserCalls(), new Response("[]"))) as unknown as typeof fetch })
		const browser = new QueryClient()
		hydrate(browser, state)
		const same = browserApi.queryOptions<number[]>("/todos", { params: { page: 1 } })
		expect(same.queryKey).toEqual(todos.queryKey)
		expect(browser.getQuery<number[]>(same.queryKey).getSnapshot()).toMatchObject({ status: "success", data: [1, 2, 3] })
		expect(serverCalls).toHaveBeenCalledOnce()
		expect(browserCalls).not.toHaveBeenCalled()
	})

	it("a failed server request rejects with a serializable-enough ApiError and does not poison the cache", async () => {
		const api = createApi({ fetch: (async () => new Response("{}", { status: 500 })) as unknown as typeof fetch })
		const server = new QueryClient({ gcTime: Infinity })
		const options = api.queryOptions("/boom")
		await expect(server.fetchQuery(options.queryKey, options.queryFn)).rejects.toMatchObject({ code: "HTTP", status: 500 })
		expect(JSON.parse(JSON.stringify(dehydrate(server))).queries ?? []).toEqual([])
	})
})
