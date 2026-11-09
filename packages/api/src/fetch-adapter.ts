import type { ApiRequest, Headers, RawResponse } from "./types"

async function readWithProgress(res: Response, request: ApiRequest): Promise<Uint8Array> {
	const total = Number(res.headers.get("content-length")) || undefined
	const reader = res.body!.getReader()
	const chunks: Uint8Array[] = []
	let loaded = 0
	for (;;) {
		const { done, value } = await reader.read()
		if (done) break
		chunks.push(value)
		loaded += value.length
		request.onDownloadProgress!({ loaded, total })
	}
	const bytes = new Uint8Array(loaded)
	let offset = 0
	for (const chunk of chunks) {
		bytes.set(chunk, offset)
		offset += chunk.length
	}
	return bytes
}

async function readBody(res: Response, request: ApiRequest): Promise<unknown> {
	const { responseType } = request
	if (responseType === "stream") return res.body
	if (request.onDownloadProgress && res.body) {
		const bytes = await readWithProgress(res, request)
		if (responseType === "arrayBuffer") return bytes.buffer
		if (responseType === "blob") return new Blob([bytes as BlobPart], { type: res.headers.get("content-type") ?? "" })
		return new TextDecoder().decode(bytes)
	}
	if (responseType === "arrayBuffer") return res.arrayBuffer()
	if (responseType === "blob") return res.blob()
	return res.text()
}

/** Default adapter, built on `fetch`. Upload progress is not available here (use `@omnifront/api/xhr`). */
export async function fetchAdapter(request: ApiRequest): Promise<RawResponse> {
	const doFetch = request.fetch ?? fetch
	const init: RequestInit = {
		...(request.withCredentials ? { credentials: "include" } : {}),
		...request.fetchOptions,
		method: request.method,
		headers: request.headers,
		signal: request.signal,
	}
	if (request.body !== undefined && request.body !== null) {
		init.body = request.body
		// Node's fetch requires this for stream bodies.
		if (typeof ReadableStream !== "undefined" && request.body instanceof ReadableStream) {
			;(init as { duplex?: string }).duplex = "half"
		}
	}
	const res = await doFetch(request.url, init)
	const headers: Headers = {}
	res.headers.forEach((value, key) => {
		headers[key.toLowerCase()] = value
	})
	return { status: res.status, statusText: res.statusText, headers, data: await readBody(res, request) }
}
