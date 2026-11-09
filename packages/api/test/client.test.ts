import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, createApi, isApiError, type Api } from "../src"
import { json, startServer, type TestServer } from "./server"

let server: TestServer
let api: Api

beforeEach(async () => {
	server = await startServer((req, res) => {
		const path = req.url.split("?")[0]
		if (path === "/echo") return json(res, { method: req.method, url: req.url, body: req.body, headers: req.headers })
		if (path === "/text") {
			res.writeHead(200, { "content-type": "text/plain" })
			return res.end("hello")
		}
		if (path === "/empty") {
			res.writeHead(204)
			return res.end()
		}
		if (path === "/bad-json") {
			res.writeHead(200)
			return res.end("{nope")
		}
		if (path === "/html-500") {
			res.writeHead(500)
			return res.end("<html>oops</html>")
		}
		if (path === "/404") return json(res, { message: "missing" }, 404)
		if (path === "/slow") return void setTimeout(() => json(res, { slow: true }), 300)
		if (path === "/bytes") {
			res.writeHead(200, { "content-length": "6" })
			res.write(Buffer.from([1, 2, 3]))
			return void setTimeout(() => res.end(Buffer.from([4, 5, 6])), 20)
		}
		res.writeHead(404)
		res.end()
	})
	api = createApi({ baseURL: server.url })
})
afterEach(() => server.close())

describe("requests", () => {
	it("GET builds the url from baseURL, path and params", async () => {
		const res = await api.get<{ url: string }>("/echo", { params: { a: [1, 2], b: "x" } })
		expect(res.status).toBe(200)
		expect(res.data.url).toBe("/echo?a=1&a=2&b=x")
		expect(res.headers["content-type"]).toContain("application/json")
		expect(res.config.url).toBe("/echo")
	})

	it.each(["post", "put", "patch"] as const)("%s sends JSON", async (method) => {
		const res = await api[method]<{ method: string; body: string; headers: Record<string, string> }>("/echo", { a: 1 })
		expect(res.data.method).toBe(method.toUpperCase())
		expect(res.data.body).toBe('{"a":1}')
		expect(res.data.headers["content-type"]).toBe("application/json")
	})

	it("delete, head and options use their methods", async () => {
		expect((await api.delete<{ method: string }>("/echo")).data.method).toBe("DELETE")
		expect((await api.options<{ method: string }>("/echo")).status).toBe(200)
		const head = await api.head("/echo")
		expect(head.status).toBe(200)
		expect(head.data).toBeUndefined()
		expect(server.seen.map((s) => s.method)).toEqual(["DELETE", "OPTIONS", "HEAD"])
	})

	it("merges default, instance and request headers", async () => {
		const a = createApi({ baseURL: server.url, headers: { "X-One": "1", "X-Two": "2" } })
		const res = await a.get<{ headers: Record<string, string> }>("/echo", { headers: { "x-two": "override" } })
		expect(res.data.headers["x-one"]).toBe("1")
		expect(res.data.headers["x-two"]).toBe("override")
	})

	it("reads text, blob, arrayBuffer and handles empty bodies", async () => {
		expect((await api.get("/text", { responseType: "text" })).data).toBe("hello")
		expect((await api.get("/empty")).data).toBeUndefined()
		const blob = (await api.get<Blob>("/text", { responseType: "blob" })).data
		expect(await blob.text()).toBe("hello")
		const buf = (await api.get<ArrayBuffer>("/bytes", { responseType: "arrayBuffer" })).data
		expect([...new Uint8Array(buf)]).toEqual([1, 2, 3, 4, 5, 6])
	})

	it("streams the body when asked", async () => {
		const stream = (await api.get<ReadableStream<Uint8Array>>("/bytes", { responseType: "stream" })).data
		const chunks: number[] = []
		for await (const chunk of stream as unknown as AsyncIterable<Uint8Array>) chunks.push(...chunk)
		expect(chunks).toEqual([1, 2, 3, 4, 5, 6])
	})

	it("reports download progress", async () => {
		const progress: { loaded: number; total: number | undefined }[] = []
		const res = await api.get<ArrayBuffer>("/bytes", { responseType: "arrayBuffer", onDownloadProgress: (p) => progress.push(p) })
		expect(res.data.byteLength).toBe(6)
		expect(progress[progress.length - 1]).toEqual({ loaded: 6, total: 6 })
		const blob = await api.get<Blob>("/bytes", { responseType: "blob", onDownloadProgress: () => {} })
		expect(blob.data.size).toBe(6)
		const text = await api.get("/text", { responseType: "text", onDownloadProgress: () => {} })
		expect(text.data).toBe("hello")
	})

	it("sends stream, FormData and URLSearchParams bodies", async () => {
		const form = new FormData()
		form.set("a", "1")
		const sent = await api.post<{ headers: Record<string, string>; body: string }>("/echo", form)
		expect(sent.data.headers["content-type"]).toContain("multipart/form-data")
		const body = new ReadableStream<Uint8Array>({
			start(c) {
				c.enqueue(new TextEncoder().encode("streamed"))
				c.close()
			},
		})
		const streamed = await api.post<{ body: string }>("/echo", body, { headers: { "content-type": "text/plain" } })
		expect(streamed.data.body).toBe("streamed")
	})

	it("applies transformRequest and transformResponse", async () => {
		const res = await api.post<{ body: string }>("/echo", { a: 1 }, {
			transformRequest: (d) => ({ wrapped: d }),
			transformResponse: [(d) => ({ ...(d as object), t1: true }), (d) => ({ ...(d as object), t2: true })],
		})
		expect(res.data).toMatchObject({ body: '{"wrapped":{"a":1}}', t1: true, t2: true })
	})

	it("uses an injected fetch", async () => {
		const fake = vi.fn(async () => new Response('{"fake":true}', { status: 200 }))
		const res = await createApi({ fetch: fake as unknown as typeof fetch }).get("http://x.test/a")
		expect(res.data).toEqual({ fake: true })
		expect(fake).toHaveBeenCalledOnce()
	})
})

describe("errors", () => {
	it("non-2xx is an HTTP ApiError with status and parsed data", async () => {
		const error = await api.get("/404").catch((e: unknown) => e)
		expect(isApiError(error)).toBe(true)
		const e = error as ApiError<{ message: string }>
		expect(e).toBeInstanceOf(ApiError)
		expect(e.code).toBe("HTTP")
		expect(e.status).toBe(404)
		expect(e.data).toEqual({ message: "missing" })
		expect(e.config.url).toBe("/404")
		expect(e.response?.status).toBe(404)
	})

	it("keeps a non-JSON error body as text, but a bad success body is a PARSE error", async () => {
		const http = (await api.get("/html-500").catch((e: unknown) => e)) as ApiError
		expect(http.code).toBe("HTTP")
		expect(http.data).toBe("<html>oops</html>")
		const parse = (await api.get("/bad-json").catch((e: unknown) => e)) as ApiError
		expect(parse.code).toBe("PARSE")
		expect(parse.data).toBe("{nope")
		expect(parse.cause).toBeInstanceOf(SyntaxError)
	})

	it("validateStatus can accept any status", async () => {
		const res = await api.get<{ message: string }>("/404", { validateStatus: () => true })
		expect(res.status).toBe(404)
		expect(res.data.message).toBe("missing")
	})

	it("a refused connection is a NETWORK error with the cause", async () => {
		const dead = await startServer(() => {})
		const url = dead.url
		await dead.close()
		const error = (await createApi({ baseURL: url }).get("/x").catch((e: unknown) => e)) as ApiError
		expect(error.code).toBe("NETWORK")
		expect(error.status).toBeUndefined()
		expect(error.cause).toBeDefined()
	})

	it("times out per attempt", async () => {
		const error = (await api.get("/slow", { timeout: 30 }).catch((e: unknown) => e)) as ApiError
		expect(error.code).toBe("TIMEOUT")
		expect(error.message).toContain("30ms")
	})

	it("aborts with the caller's signal, before and during the request", async () => {
		const controller = new AbortController()
		const pending = api.get("/slow", { signal: controller.signal })
		controller.abort()
		expect(((await pending.catch((e: unknown) => e)) as ApiError).code).toBe("ABORT")
		const before = (await api.get("/slow", { signal: controller.signal }).catch((e: unknown) => e)) as ApiError
		expect(before.code).toBe("ABORT")
	})

	it("an adapter that throws an AbortError without a signal is still ABORT", async () => {
		const a = createApi({
			adapter: () => Promise.reject(Object.assign(new Error("x"), { name: "AbortError" })),
		})
		expect(((await a.get("/x").catch((e: unknown) => e)) as ApiError).code).toBe("ABORT")
	})

	it("an ApiError thrown by an adapter passes through", async () => {
		const a = createApi({
			adapter: (r) => Promise.reject(new ApiError("custom", "NETWORK", { url: r.url })),
		})
		expect(((await a.get("/x").catch((e: unknown) => e)) as ApiError).message).toBe("custom")
	})
})

describe("retry", () => {
	function flaky(failures: number, status = 503) {
		let calls = 0
		return createApi({
			baseURL: "http://x.test",
			fetch: (async () => {
				calls++
				return calls <= failures ? new Response("{}", { status }) : new Response('{"ok":true}')
			}) as unknown as typeof fetch,
			retry: { attempts: 2, backoff: () => 0 },
		}).extend({ meta: { calls: () => calls } })
	}
	const callsOf = (a: Api): number => (a.defaults.meta!["calls"] as () => number)()

	it("is off by default", async () => {
		let calls = 0
		const a = createApi({
			fetch: (async () => (calls++, new Response("{}", { status: 503 }))) as unknown as typeof fetch,
		})
		await expect(a.get("http://x.test/a")).rejects.toBeInstanceOf(ApiError)
		expect(calls).toBe(1)
	})

	it("retries 5xx on idempotent methods until it succeeds", async () => {
		const a = flaky(2)
		expect((await a.get("/a")).data).toEqual({ ok: true })
		expect(callsOf(a)).toBe(3)
	})

	it("gives up after `attempts` retries", async () => {
		const a = flaky(5)
		await expect(a.get("/a")).rejects.toMatchObject({ status: 503 })
		expect(callsOf(a)).toBe(3)
	})

	it("does not retry 4xx or non-idempotent methods by default", async () => {
		const a = flaky(5, 400)
		await expect(a.get("/a")).rejects.toMatchObject({ status: 400 })
		expect(callsOf(a)).toBe(1)
		const b = flaky(5)
		await expect(b.post("/a", {})).rejects.toMatchObject({ status: 503 })
		expect(callsOf(b)).toBe(1)
	})

	it("retries network errors and timeouts, and 429", async () => {
		let calls = 0
		const a = createApi({
			retry: { attempts: 3, backoff: () => 0 },
			fetch: (async () => {
				calls++
				if (calls === 1) throw new TypeError("offline")
				if (calls === 2) return new Response("{}", { status: 429 })
				return new Response('{"ok":1}')
			}) as unknown as typeof fetch,
		})
		expect((await a.get("http://x.test/a")).data).toEqual({ ok: 1 })
		expect(calls).toBe(3)
	})

	it("honours retryOn and the default backoff schedule", async () => {
		let calls = 0
		const waits: number[] = []
		const a = createApi({
			retry: { attempts: 3, retryOn: (e) => e.status === 418 },
			scheduler: {
				now: () => 0,
				setTimeout: (fn, ms) => (waits.push(ms), fn(), 0),
				clearTimeout: () => {},
			},
			fetch: (async () => (calls++, new Response("{}", { status: calls < 4 ? 418 : 200 }))) as unknown as typeof fetch,
		})
		await a.post("http://x.test/a", {})
		expect(calls).toBe(4)
		expect(waits).toEqual([1000, 2000, 4000])
	})

	it("stops waiting when the caller aborts", async () => {
		const controller = new AbortController()
		const a = createApi({
			retry: { attempts: 3, backoff: () => 10_000 },
			fetch: (async () => new Response("{}", { status: 503 })) as unknown as typeof fetch,
		})
		const pending = a.get("http://x.test/a", { signal: controller.signal })
		setTimeout(() => controller.abort(), 20)
		expect(((await pending.catch((e: unknown) => e)) as ApiError).code).toBe("ABORT")
	})
})

describe("interceptors", () => {
	it("run FIFO on both sides, can modify and can be removed", async () => {
		const order: string[] = []
		api.interceptors.request.use((c) => (order.push("req1"), { ...c, headers: { ...c.headers, "x-1": "a" } }))
		api.interceptors.request.use(async (c) => (order.push("req2"), { ...c, headers: { ...c.headers, "x-2": "b" } }))
		api.interceptors.response.use((r) => (order.push("res1"), r))
		const eject = api.interceptors.response.use((r) => (order.push("res2"), { ...r, data: { wrapped: r.data } }))
		const first = await api.get<{ wrapped: { headers: Record<string, string> } }>("/echo")
		expect(order).toEqual(["req1", "req2", "res1", "res2"])
		expect(first.data.wrapped.headers).toMatchObject({ "x-1": "a", "x-2": "b" })
		eject()
		const second = await api.get<{ headers: unknown }>("/echo")
		expect(second.data.headers).toBeDefined()
	})

	it("error handlers can recover or rethrow, and a request interceptor can reject", async () => {
		api.interceptors.response.use(undefined, (e) => {
			if (isApiError(e) && e.status === 404) return { data: "recovered", status: 200, statusText: "", headers: {}, config: e.config }
			throw e
		})
		expect((await api.get("/404")).data).toBe("recovered")
		await expect(api.get("/echo", { validateStatus: () => false })).rejects.toBeInstanceOf(ApiError)
		const guarded = api.extend()
		guarded.interceptors.request.use(() => {
			throw new Error("blocked")
		})
		await expect(guarded.get("/echo")).rejects.toThrow("blocked")
	})

	it("extend copies interceptors and defaults; later changes stay separate", async () => {
		api.interceptors.request.use((c) => ({ ...c, headers: { ...c.headers, "x-parent": "1" } }))
		const removed = api.interceptors.request.use((c) => ({ ...c, headers: { ...c.headers, "x-removed": "1" } }))
		removed()
		const child = api.extend({ headers: { "x-child": "1" }, baseURL: server.url })
		child.interceptors.request.use((c) => ({ ...c, headers: { ...c.headers, "x-only-child": "1" } }))
		type Echo = { headers: Record<string, string> }
		const fromChild = (await child.get<Echo>("/echo")).data.headers
		expect(fromChild).toMatchObject({ "x-parent": "1", "x-child": "1", "x-only-child": "1" })
		expect(fromChild["x-removed"]).toBeUndefined()
		const fromParent = (await api.get<Echo>("/echo")).data.headers
		expect(fromParent["x-only-child"]).toBeUndefined()
		expect(fromParent["x-child"]).toBeUndefined()
	})
})

describe("query and mutation options", () => {
	it("queryKey is [path] or [path, params]", () => {
		expect(api.queryKey("/todos")).toEqual(["/todos"])
		expect(api.queryKey("/todos", { done: false })).toEqual(["/todos", { done: false }])
		expect(api.queryOptions("/todos", { params: { done: false } }).queryKey).toEqual(["/todos", { done: false }])
	})

	it("queryFn returns data and passes the abort signal to the request", async () => {
		const options = api.queryOptions<{ method: string }>("/echo")
		expect((await options.queryFn({ signal: new AbortController().signal })).method).toBe("GET")
		const controller = new AbortController()
		const pending = api.queryOptions("/slow").queryFn({ signal: controller.signal })
		controller.abort()
		await expect(pending).rejects.toMatchObject({ code: "ABORT" })
	})

	it("mutationFn sends the variables as the body; path may depend on them", async () => {
		const create = api.mutationOptions<{ body: string; url: string }, { id: number }>("PUT", (v) => `/echo?id=${v.id}`)
		const res = await create.mutationFn({ id: 7 })
		expect(res.url).toBe("/echo?id=7")
		expect(res.body).toBe('{"id":7}')
		const noVars = api.mutationOptions<{ method: string }>("DELETE", "/echo", { data: { fixed: true } })
		expect((await noVars.mutationFn()).method).toBe("DELETE")
		expect(server.seen[server.seen.length - 1]?.body).toBe('{"fixed":true}')
	})
})
