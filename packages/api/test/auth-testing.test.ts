import { createStore } from "@omnifront/store"
import { describe, expect, it } from "vitest"
import { createApi, isApiError } from "../src"
import { refreshOnUnauthorized, withAuth } from "../src/auth"
import { createMockAdapter } from "../src/testing"

describe("createMockAdapter", () => {
	it("matches METHOD /path routes without the query string and ignores the host", async () => {
		const adapter = createMockAdapter({
			"GET /todos": { data: [{ id: 1 }], headers: { "x-total": "1" } },
			"POST /todos": (req) => ({ status: 201, data: { echoed: req.body } }),
			"GET /text": { data: "plain" },
		})
		const api = createApi({ baseURL: "http://any.test", adapter })
		const list = await api.get<{ id: number }[]>("/todos", { params: { a: 1 } })
		expect(list.data).toEqual([{ id: 1 }])
		expect(list.headers["x-total"]).toBe("1")
		expect((await api.post<{ echoed: string }>("/todos", { t: 1 })).data).toEqual({ echoed: '{"t":1}' })
		expect((await api.get("/text", { responseType: "text" })).data).toBe("plain")
		expect(adapter.calls.map((c) => `${c.method} ${c.url}`)).toEqual([
			"GET http://any.test/todos?a=1",
			"POST http://any.test/todos",
			"GET http://any.test/text",
		])
	})

	it("unmatched routes reply 404; a function handler and error replies work", async () => {
		const api = createApi({ adapter: createMockAdapter({}) })
		await expect(api.get("/nope")).rejects.toMatchObject({ code: "HTTP", status: 404 })
		const fn = createApi({ adapter: createMockAdapter(() => ({ data: { ok: true } })) })
		expect((await fn.get("/any")).data).toEqual({ ok: true })
		const offline = createApi({ adapter: createMockAdapter(() => ({ error: new TypeError("offline") })) })
		await expect(offline.get("/any")).rejects.toMatchObject({ code: "NETWORK" })
		const empty = createApi({ adapter: createMockAdapter(() => ({ status: 204 })) })
		expect((await empty.get("/any")).data).toBeUndefined()
	})
})

describe("withAuth", () => {
	it("reads the store snapshot when each request is sent", async () => {
		const auth = createStore<{ token: string | null }>(() => ({ token: null }))
		const adapter = createMockAdapter(() => ({ data: {} }))
		const api = createApi({ adapter })
		const off = withAuth(api, auth, (s) => (s.token ? { Authorization: `Bearer ${s.token}` } : {}))
		await api.get("/a")
		auth.setState({ token: "t1" })
		await api.get("/a")
		off()
		await api.get("/a")
		expect(adapter.calls.map((c) => c.headers["authorization"])).toEqual([undefined, "Bearer t1", undefined])
	})
})

describe("refreshOnUnauthorized", () => {
	function setup(options: { refreshFails?: boolean } = {}) {
		const auth = createStore<{ token: string }>(() => ({ token: "old" }))
		let refreshes = 0
		const adapter = createMockAdapter((req) =>
			req.headers["authorization"] === "Bearer new" ? { data: { ok: true } } : { status: 401, data: { message: "expired" } },
		)
		const api = createApi({ adapter })
		withAuth(api, auth, (s) => ({ Authorization: `Bearer ${s.token}` }))
		refreshOnUnauthorized(api, {
			refresh: async () => {
				refreshes++
				await Promise.resolve()
				if (options.refreshFails) throw new Error("refresh failed")
				auth.setState({ token: "new" })
			},
		})
		return { api, adapter, refreshes: () => refreshes }
	}

	it("refreshes once for concurrent 401s, then repeats each request with the new token", async () => {
		const { api, adapter, refreshes } = setup()
		const results = await Promise.all([api.get("/a"), api.get("/b"), api.get("/c")])
		expect(results.map((r) => r.data)).toEqual([{ ok: true }, { ok: true }, { ok: true }])
		expect(refreshes()).toBe(1)
		expect(adapter.calls).toHaveLength(6)
	})

	it("throws the original 401 when the refresh fails, and refreshes again next time", async () => {
		const { api, refreshes } = setup({ refreshFails: true })
		const error = await api.get("/a").catch((e: unknown) => e)
		expect(isApiError(error) && error.status).toBe(401)
		await api.get("/a").catch(() => {})
		expect(refreshes()).toBe(2)
	})

	it("does not loop: a 401 after the retry is returned as an error", async () => {
		const adapter = createMockAdapter(() => ({ status: 401 }))
		const api = createApi({ adapter })
		let refreshes = 0
		refreshOnUnauthorized(api, { refresh: async () => void refreshes++ })
		await expect(api.get("/a")).rejects.toMatchObject({ status: 401 })
		expect(refreshes).toBe(1)
		expect(adapter.calls).toHaveLength(2)
	})

	it("ignores other errors and supports shouldRefresh", async () => {
		const adapter = createMockAdapter((req) => ({ status: req.url.endsWith("/forbidden") ? 403 : 500 }))
		const api = createApi({ adapter })
		let refreshes = 0
		const off = refreshOnUnauthorized(api, {
			refresh: async () => void refreshes++,
			shouldRefresh: (e) => isApiError(e) && e.status === 403,
		})
		await expect(api.get("/server")).rejects.toMatchObject({ status: 500 })
		expect(refreshes).toBe(0)
		await expect(api.get("/forbidden")).rejects.toMatchObject({ status: 403 })
		expect(refreshes).toBe(1)
		off()
		await expect(api.get("/forbidden")).rejects.toMatchObject({ status: 403 })
		expect(refreshes).toBe(1)
		// A non-ApiError (like a thrown string) is passed through untouched.
		const bad = createApi({ adapter: () => Promise.reject(new Error("x")) })
		refreshOnUnauthorized(bad, { refresh: async () => {} })
		await expect(bad.get("/a")).rejects.toMatchObject({ code: "NETWORK" })
	})
})
