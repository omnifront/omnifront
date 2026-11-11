import { createStore } from "@omnifront/store"
import { describe, expect, it, vi } from "vitest"
import { createApi, isApiError } from "../src"
import { basicAuth, refreshOnUnauthorized, withAuth, withXsrf } from "../src/auth"
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

describe("basicAuth", () => {
	it("adds a Basic authorization header, UTF-8 safe, and can be removed", async () => {
		const adapter = createMockAdapter(() => ({ data: {} }))
		const api = createApi({ adapter })
		const off = basicAuth(api, { username: "ali", password: "pä55" })
		await api.get("/a")
		off()
		await api.get("/b")
		basicAuth(api, { username: "only" })
		await api.get("/c")
		expect(adapter.calls[0]!.headers["authorization"]).toBe(`Basic ${Buffer.from("ali:pä55", "utf8").toString("base64")}`)
		expect(adapter.calls[1]!.headers["authorization"]).toBeUndefined()
		expect(adapter.calls[2]!.headers["authorization"]).toBe(`Basic ${Buffer.from("only:").toString("base64")}`)
	})
})

describe("withXsrf", () => {
	it("copies the cookie into the header when asked to send", async () => {
		const adapter = createMockAdapter(() => ({ data: {} }))
		const api = createApi({ adapter })
		let cookie = "a=1; XSRF-TOKEN=tok%20en; b=2"
		const off = withXsrf(api, { send: true, cookie: () => cookie })
		await api.get("/a")
		cookie = "a=1"
		await api.get("/b")
		off()
		withXsrf(api, { send: (config) => !!config.url?.startsWith("/mine"), cookie: () => "csrf=x", cookieName: "csrf", headerName: "X-CSRF" })
		await api.get("/mine/1")
		await api.get("/other")
		expect(adapter.calls[0]!.headers["x-xsrf-token"]).toBe("tok en")
		expect(adapter.calls[1]!.headers["x-xsrf-token"]).toBeUndefined()
		expect(adapter.calls[2]!.headers["x-csrf"]).toBe("x")
		expect(adapter.calls[3]!.headers["x-csrf"]).toBeUndefined()
	})

	it("by default sends to the page's own origin only, reading document.cookie", async () => {
		const adapter = createMockAdapter(() => ({ data: {} }))
		const api = createApi({ adapter })
		withXsrf(api)
		await api.get("/server-side") // no location, no document: nothing is added
		vi.stubGlobal("location", { href: "https://app.test/page", origin: "https://app.test" })
		await api.get("/no-document")
		vi.stubGlobal("document", { cookie: "XSRF-TOKEN=t" })
		await api.get("/same")
		await api.get("https://app.test/abs")
		await api.get("https://evil.test/steal")
		await api.get("//evil.test/steal")
		await api.get("/x", { baseURL: "https://other.test" })
		await api.get("https://evil.test/x", { baseURL: "https://app.test/api", allowAbsoluteUrls: false })
		vi.unstubAllGlobals()
		expect(adapter.calls.map((c) => c.headers["x-xsrf-token"])).toEqual([undefined, undefined, "t", "t", undefined, undefined, undefined, "t"])
	})
})
