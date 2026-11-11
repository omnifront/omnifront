import { FakeScheduler } from "@omnifront/core/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError, createApi, isApiError, isCancel, mergeConfig } from "../src"
import { createMockAdapter } from "../src/testing"
import { xhrAdapter } from "../src/xhr"

const reply = (body: unknown = {}) => new Response(JSON.stringify(body), { status: 200 })
const spyFetch = () => vi.fn<(url: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(() => Promise.resolve(reply()))

afterEach(() => vi.unstubAllGlobals())

describe("withCredentials / fetchOptions", () => {
	it("passes fetchOptions through and maps withCredentials to credentials: include", async () => {
		const fetch = spyFetch()
		const api = createApi({ fetch: fetch as typeof globalThis.fetch, fetchOptions: { cache: "no-store" } })
		await api.get("/plain")
		await api.get("/cookies", { withCredentials: true })
		await api.get("/explicit", { withCredentials: true, fetchOptions: { credentials: "omit", redirect: "manual" } })
		await api.get("/off", { withCredentials: false })
		const inits = fetch.mock.calls.map(([, init]) => init!)
		expect(inits[0]).toMatchObject({ cache: "no-store", method: "GET" })
		expect(inits[0]!.credentials).toBeUndefined()
		expect(inits[1]!.credentials).toBe("include")
		// fetchOptions is the more specific setting and wins; the per-request object replaces the default one.
		expect(inits[2]).toMatchObject({ credentials: "omit", redirect: "manual" })
		expect(inits[2]!.cache).toBeUndefined()
		expect(inits[3]!.credentials).toBeUndefined()
	})

	it("fetchOptions cannot override what the client manages", async () => {
		const fetch = spyFetch()
		const api = createApi({ fetch: fetch as typeof globalThis.fetch })
		await api.post("/x", { a: 1 }, { fetchOptions: { method: "DELETE", body: "nope" } as never })
		const init = fetch.mock.calls[0]![1]!
		expect(init.method).toBe("POST")
		expect(init.body).toBe('{"a":1}')
	})

	it("the XHR adapter sets withCredentials from either option", async () => {
		const seen: boolean[] = []
		class FakeXHR {
			withCredentials = false
			upload = {}
			status = 200
			statusText = "OK"
			response = "{}"
			responseType = ""
			onload?: () => void
			open() {}
			setRequestHeader() {}
			getAllResponseHeaders() {
				return ""
			}
			send() {
				seen.push(this.withCredentials)
				this.onload?.()
			}
		}
		vi.stubGlobal("XMLHttpRequest", FakeXHR)
		const api = createApi({ adapter: xhrAdapter })
		await api.get("/a")
		await api.get("/b", { withCredentials: true })
		await api.get("/c", { fetchOptions: { credentials: "include" } })
		await api.get("/d", { withCredentials: true, fetchOptions: { credentials: "same-origin" } })
		expect(seen).toEqual([false, true, true, false])
	})
})

describe("allowAbsoluteUrls / getUri", () => {
	it("an absolute url bypasses baseURL unless allowAbsoluteUrls is false", () => {
		const api = createApi({ baseURL: "https://api.test/v1" })
		expect(api.getUri({ url: "/todos", params: { a: [1, 2] } })).toBe("https://api.test/v1/todos?a=1&a=2")
		expect(api.getUri({ url: "https://evil.test/x" })).toBe("https://evil.test/x")
		expect(api.getUri({ url: "//evil.test/x" })).toBe("//evil.test/x")
		expect(api.getUri({ url: "https://evil.test/x", allowAbsoluteUrls: false })).toBe("https://api.test/v1/https://evil.test/x")
		const strict = api.extend({ allowAbsoluteUrls: false })
		expect(strict.getUri({ url: "//evil.test/x" })).toBe("https://api.test/v1/evil.test/x")
		expect(strict.getUri()).toBe("https://api.test/v1/")
		expect(createApi().getUri()).toBe("")
	})

	it("requests follow the same rule", async () => {
		const adapter = createMockAdapter(() => ({ data: {} }))
		const api = createApi({ adapter, baseURL: "https://api.test", allowAbsoluteUrls: false })
		await api.get("https://evil.test/steal")
		expect(adapter.calls[0]!.url).toBe("https://api.test/https://evil.test/steal")
	})
})

describe("request interceptors: runWhen", () => {
	it("skips the interceptor when runWhen returns false, and survives extend()", async () => {
		const adapter = createMockAdapter(() => ({ data: {} }))
		const api = createApi({ adapter })
		api.interceptors.request.use((c) => ({ ...c, headers: { ...c.headers, "x-write": "1" } }), {
			runWhen: (c) => c.method !== "GET",
		})
		api.interceptors.request.use((c) => ({ ...c, headers: { ...c.headers, "x-always": "1" } }))
		api.interceptors.request.use((c) => c, {})
		await api.get("/a")
		await api.post("/b")
		await api.extend().post("/c")
		expect(adapter.calls.map((c) => [c.headers["x-write"], c.headers["x-always"]])).toEqual([
			[undefined, "1"],
			["1", "1"],
			["1", "1"],
		])
	})
})

describe("timeoutErrorMessage / parseReviver / isCancel / mergeConfig", () => {
	it("uses the custom timeout message", async () => {
		const scheduler = new FakeScheduler()
		const hang = (request: { signal: AbortSignal }) =>
			new Promise<never>((_, reject) => request.signal.addEventListener("abort", () => reject(new Error("aborted"))))
		const api = createApi({ adapter: hang, scheduler, timeout: 50 })
		const plain = api.get("/a")
		const custom = api.get("/b", { timeoutErrorMessage: "Too slow" })
		custom.catch(() => {})
		plain.catch(() => {})
		await new Promise((resolve) => setTimeout(resolve, 0)) // the request is dispatched after the interceptor chain
		scheduler.advance(50)
		await expect(plain).rejects.toMatchObject({ code: "TIMEOUT", message: "Timeout of 50ms exceeded" })
		await expect(custom).rejects.toMatchObject({ code: "TIMEOUT", message: "Too slow" })
		expect(isCancel(await custom.catch((e: unknown) => e))).toBe(false)
	})

	it("parseReviver revives JSON responses", async () => {
		const adapter = createMockAdapter(() => ({ data: { at: "1970-01-01T00:00:00.000Z", n: 1 } }))
		const api = createApi({
			adapter,
			parseReviver: (key, value) => (key === "at" ? new Date(value as string) : value),
		})
		const { data } = await api.get<{ at: Date; n: number }>("/x")
		expect(data.at).toBeInstanceOf(Date)
		expect(data.n).toBe(1)
	})

	it("isCancel is true only for an aborted request", async () => {
		const controller = new AbortController()
		controller.abort()
		const api = createApi({ adapter: createMockAdapter(() => ({ status: 500 })) })
		const aborted = await api.get("/a", { signal: controller.signal }).catch((e: unknown) => e)
		const failed = await api.get("/b").catch((e: unknown) => e)
		expect(isCancel(aborted)).toBe(true)
		expect(isApiError(failed) && !isCancel(failed)).toBe(true)
		expect(isCancel(new Error("x"))).toBe(false)
		expect(aborted).toBeInstanceOf(ApiError)
	})

	it("mergeConfig is exported: later configs win, headers and params merge", () => {
		expect(mergeConfig({ baseURL: "/a", headers: { A: "1" }, params: { x: 1 } }, { timeout: 5, headers: { b: "2" }, params: { y: 2 } })).toEqual({
			baseURL: "/a",
			timeout: 5,
			headers: { a: "1", b: "2" },
			params: { x: 1, y: 2 },
		})
	})
})
