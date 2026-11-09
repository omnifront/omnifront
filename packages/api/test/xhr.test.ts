import { afterEach, describe, expect, it, vi } from "vitest"
import { createApi } from "../src"
import { xhrAdapter } from "../src/xhr"

/** A minimal XMLHttpRequest stand-in: enough to drive the adapter's wiring in Node. */
class FakeXHR {
	static last: FakeXHR
	headers: Record<string, string> = {}
	upload: { onprogress?: (e: unknown) => void } = {}
	onload?: () => void
	onerror?: () => void
	onabort?: () => void
	onprogress?: (e: unknown) => void
	responseType = ""
	status = 200
	statusText = "OK"
	response: unknown = '{"ok":true}'
	sent: unknown
	opened: [string, string] | undefined
	constructor() {
		FakeXHR.last = this
	}
	open(method: string, url: string) {
		this.opened = [method, url]
	}
	setRequestHeader(k: string, v: string) {
		this.headers[k] = v
	}
	getAllResponseHeaders() {
		return "Content-Type: application/json\r\nX-Count:  3\r\n"
	}
	send(body: unknown) {
		this.sent = body
	}
	abort() {
		this.onabort?.()
	}
}

afterEach(() => vi.unstubAllGlobals())

describe("xhrAdapter", () => {
	it("sends the request and resolves with parsed headers; JSON is parsed by the client", async () => {
		vi.stubGlobal("XMLHttpRequest", FakeXHR)
		const api = createApi({ adapter: xhrAdapter, baseURL: "http://x.test" })
		const pending = api.post<{ ok: boolean }>("/up", { a: 1 })
		await Promise.resolve()
		await Promise.resolve()
		const xhr = FakeXHR.last
		expect(xhr.opened).toEqual(["POST", "http://x.test/up"])
		expect(xhr.headers["content-type"]).toBe("application/json")
		expect(xhr.responseType).toBe("text")
		expect(xhr.sent).toBe('{"a":1}')
		xhr.onload?.()
		const res = await pending
		expect(res.data).toEqual({ ok: true })
		expect(res.headers).toEqual({ "content-type": "application/json", "x-count": "3" })
	})

	it("reports upload and download progress, with total only when computable", async () => {
		vi.stubGlobal("XMLHttpRequest", FakeXHR)
		const up: unknown[] = []
		const down: unknown[] = []
		const pending = createApi({ adapter: xhrAdapter }).get("/x", {
			onUploadProgress: (p) => up.push(p),
			onDownloadProgress: (p) => down.push(p),
			responseType: "blob",
		})
		await Promise.resolve()
		await Promise.resolve()
		const xhr = FakeXHR.last
		expect(xhr.responseType).toBe("blob")
		xhr.upload.onprogress?.({ loaded: 5, total: 10, lengthComputable: true })
		xhr.upload.onprogress?.({ loaded: 6, total: 0, lengthComputable: false })
		xhr.onprogress?.({ loaded: 1, total: 2, lengthComputable: true })
		xhr.response = "blob"
		xhr.onload?.()
		await pending
		expect(up).toEqual([
			{ loaded: 5, total: 10 },
			{ loaded: 6, total: undefined },
		])
		expect(down).toEqual([{ loaded: 1, total: 2 }])
	})

	it("maps errors: network, abort, and unsupported stream", async () => {
		vi.stubGlobal("XMLHttpRequest", FakeXHR)
		const api = createApi({ adapter: xhrAdapter })
		const net = api.get("/x")
		await Promise.resolve()
		await Promise.resolve()
		FakeXHR.last.onerror?.()
		await expect(net).rejects.toMatchObject({ code: "NETWORK" })

		const controller = new AbortController()
		const aborted = api.get("/x", { signal: controller.signal })
		await Promise.resolve()
		await Promise.resolve()
		controller.abort()
		await expect(aborted).rejects.toMatchObject({ code: "ABORT" })

		await expect(api.get("/x", { responseType: "stream" })).rejects.toMatchObject({ code: "NETWORK" })
	})

	it("sends no body for GET", async () => {
		vi.stubGlobal("XMLHttpRequest", FakeXHR)
		const pending = createApi({ adapter: xhrAdapter }).get("/x")
		await Promise.resolve()
		await Promise.resolve()
		expect(FakeXHR.last.sent).toBeNull()
		FakeXHR.last.onload?.()
		await pending
	})
})
