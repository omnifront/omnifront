import type { ApiConfig, Headers, Params, Transform } from "./types"

const ABSOLUTE = /^([a-z][a-z\d+\-.]*:)?\/\//i

function pairs(key: string, value: unknown, out: string[]): void {
	if (value === undefined || value === null) return
	if (Array.isArray(value)) {
		for (const item of value) pairs(key, item, out)
	} else if (value instanceof Date) {
		out.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.toISOString())}`)
	} else if (typeof value === "object") {
		for (const [k, v] of Object.entries(value)) pairs(`${key}[${k}]`, v, out)
	} else {
		out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
	}
}

export function serializeParams(params: Params): string {
	const out: string[] = []
	for (const [k, v] of Object.entries(params)) pairs(k, v, out)
	return out.join("&")
}

export function buildURL(config: ApiConfig): string {
	let url = config.url ?? ""
	if (config.baseURL && !ABSOLUTE.test(url)) url = `${config.baseURL.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`
	const query = config.params ? (config.paramsSerializer ?? serializeParams)(config.params) : ""
	return query ? `${url}${url.includes("?") ? "&" : "?"}${query}` : url
}

export function normalizeHeaders(headers: Record<string, string> | undefined): Headers {
	const out: Headers = {}
	if (headers) for (const [k, v] of Object.entries(headers)) out[k.toLowerCase()] = v
	return out
}

/** Later configs win; headers and params merge; `undefined` never overrides. */
export function mergeConfig(...configs: (ApiConfig | undefined)[]): ApiConfig {
	const out: Record<string, unknown> = {}
	let headers: Headers = {}
	let params: Params | undefined
	let meta: Record<string, unknown> | undefined
	for (const config of configs) {
		if (!config) continue
		for (const [k, v] of Object.entries(config)) {
			if (v === undefined || k === "headers" || k === "params" || k === "meta") continue
			out[k] = v
		}
		headers = { ...headers, ...normalizeHeaders(config.headers) }
		if (config.params) params = { ...params, ...config.params }
		if (config.meta) meta = { ...meta, ...config.meta }
	}
	out.headers = headers
	if (params) out.params = params
	if (meta) out.meta = meta
	return out as ApiConfig
}

export function applyTransforms(
	data: unknown,
	headers: Headers,
	transform: Transform | readonly Transform[] | undefined,
): unknown {
	if (!transform) return data
	for (const fn of Array.isArray(transform) ? (transform as readonly Transform[]) : [transform as Transform]) {
		data = fn(data, headers)
	}
	return data
}

function isRaw(data: unknown): data is BodyInit {
	if (typeof data === "string") return true
	const is = (name: string): boolean => {
		const ctor = (globalThis as Record<string, unknown>)[name]
		return typeof ctor === "function" && data instanceof (ctor as new () => unknown)
	}
	return (
		is("FormData") ||
		is("Blob") ||
		is("URLSearchParams") ||
		is("ArrayBuffer") ||
		is("ReadableStream") ||
		ArrayBuffer.isView(data)
	)
}

/** Turn `data` into a fetch body, setting `content-type` for JSON when it is not set already. */
export function encodeBody(data: unknown, headers: Headers): BodyInit | undefined {
	if (data === undefined || data === null) return undefined
	if (isRaw(data)) return data
	if (!headers["content-type"]) headers["content-type"] = "application/json"
	return JSON.stringify(data)
}
