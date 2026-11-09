import type { ApiRequest, Headers, RawResponse } from "./types"

function parseHeaders(raw: string): Headers {
	const headers: Headers = {}
	for (const line of raw.trim().split(/[\r\n]+/)) {
		const i = line.indexOf(":")
		if (i > 0) headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim()
	}
	return headers
}

/**
 * Adapter built on `XMLHttpRequest`, for what `fetch` cannot do: upload progress (`onUploadProgress`).
 * Browser only. `responseType: "stream"` is not supported. Use: `createApi({ adapter: xhrAdapter })`.
 */
export function xhrAdapter(request: ApiRequest): Promise<RawResponse> {
	return new Promise((resolve, reject) => {
		if (request.responseType === "stream") {
			reject(new TypeError('xhrAdapter does not support responseType "stream"'))
			return
		}
		const xhr = new XMLHttpRequest()
		xhr.open(request.method, request.url, true)
		for (const [name, value] of Object.entries(request.headers)) xhr.setRequestHeader(name, value)
		xhr.responseType = request.responseType === "json" ? "text" : request.responseType.toLowerCase() as XMLHttpRequestResponseType
		xhr.withCredentials = request.fetchOptions?.credentials ? request.fetchOptions.credentials === "include" : !!request.withCredentials
		if (request.onUploadProgress) {
			const report = request.onUploadProgress
			xhr.upload.onprogress = (e) => report({ loaded: e.loaded, total: e.lengthComputable ? e.total : undefined })
		}
		if (request.onDownloadProgress) {
			const report = request.onDownloadProgress
			xhr.onprogress = (e) => report({ loaded: e.loaded, total: e.lengthComputable ? e.total : undefined })
		}
		xhr.onload = () =>
			resolve({
				status: xhr.status,
				statusText: xhr.statusText,
				headers: parseHeaders(xhr.getAllResponseHeaders()),
				data: xhr.response,
			})
		xhr.onerror = () => reject(new TypeError("Network error"))
		xhr.onabort = () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" }))
		request.signal.addEventListener("abort", () => xhr.abort(), { once: true })
		xhr.send((request.body ?? null) as XMLHttpRequestBodyInit | null)
	})
}
