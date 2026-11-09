import type { Scheduler } from "@omnifront/core"

export type Method = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS"
export type ResponseType = "json" | "text" | "blob" | "arrayBuffer" | "stream"
export type Params = Record<string, unknown>
/** Header names are always lower-cased. */
export type Headers = Record<string, string>

export interface Progress {
	loaded: number
	/** Unknown when the server sends no length. */
	total: number | undefined
}

export type ApiErrorCode = "HTTP" | "TIMEOUT" | "ABORT" | "NETWORK" | "PARSE"

export interface RetryConfig {
	/** Retries after the first attempt. */
	attempts: number
	/** Ms to wait before retry number `attempt` (1-based). Default: 1s, 2s, 4s ... capped at 30s. */
	backoff?: ((attempt: number) => number) | undefined
	/** Default: network errors, timeouts, 5xx and 429, on idempotent methods only. */
	retryOn?: ((error: import("./error").ApiError) => boolean) | undefined
}

export interface ApiConfig {
	baseURL?: string | undefined
	/**
	 * Default `true`: an absolute `url` is used as it is, ignoring `baseURL`. Set `false` to always
	 * prefix `baseURL`, so a URL that comes from user input cannot send the request (and its
	 * credentials) to another host.
	 */
	allowAbsoluteUrls?: boolean | undefined
	url?: string | undefined
	method?: Method | undefined
	headers?: Record<string, string> | undefined
	params?: Params | undefined
	/** Query string serializer. Default handles arrays (`a=1&a=2`) and nested objects (`a[b]=1`). */
	paramsSerializer?: ((params: Params) => string) | undefined
	/** Request body: JSON-encoded unless it is a string, FormData, Blob, URLSearchParams, buffer or stream. */
	data?: unknown
	/** Ms, per attempt. 0 or undefined = none. */
	timeout?: number | undefined
	/** Message of the `TIMEOUT` error. Default: "Timeout of <n>ms exceeded". */
	timeoutErrorMessage?: string | undefined
	/** Send cookies and HTTP auth on cross-origin requests (`credentials: "include"`). */
	withCredentials?: boolean | undefined
	/** Passed to `fetch` as they are: `credentials`, `cache`, `mode`, `redirect`, `keepalive`, `referrer`, `integrity`, `priority`... */
	fetchOptions?: FetchOptions | undefined
	signal?: AbortSignal | undefined
	responseType?: ResponseType | undefined
	/** Resolve for statuses where this returns true. Default: 200-299. */
	validateStatus?: ((status: number) => boolean) | undefined
	transformRequest?: Transform | readonly Transform[] | undefined
	transformResponse?: Transform | readonly Transform[] | undefined
	/** The `reviver` argument of `JSON.parse` for JSON responses (to turn date strings into Dates, say). */
	parseReviver?: ((this: unknown, key: string, value: unknown) => unknown) | undefined
	retry?: RetryConfig | undefined
	onDownloadProgress?: ((progress: Progress) => void) | undefined
	/** Only reported by the XHR adapter (`@omnifront/api/xhr`); `fetch` cannot. */
	onUploadProgress?: ((progress: Progress) => void) | undefined
	adapter?: Adapter | undefined
	/** Custom `fetch` for the default adapter (tests, SSR, polyfills). */
	fetch?: typeof fetch | undefined
	scheduler?: Scheduler | undefined
	/** Free-form data carried along with the request, visible to interceptors. */
	meta?: Record<string, unknown> | undefined
}

/** `fetch` options the client does not manage itself. */
export type FetchOptions = Omit<RequestInit, "method" | "headers" | "body" | "signal">

export type Transform = (data: unknown, headers: Headers) => unknown

/** What an adapter receives: everything is resolved already. */
export interface ApiRequest {
	url: string
	method: Method
	headers: Headers
	body: BodyInit | null | undefined
	signal: AbortSignal
	responseType: ResponseType
	onDownloadProgress: ((progress: Progress) => void) | undefined
	onUploadProgress: ((progress: Progress) => void) | undefined
	fetch: typeof fetch | undefined
	withCredentials: boolean | undefined
	fetchOptions: FetchOptions | undefined
}

/** For `responseType: "json"` an adapter returns the body as text; the client parses it. */
export interface RawResponse {
	status: number
	statusText: string
	headers: Headers
	data: unknown
}

export type Adapter = (request: ApiRequest) => Promise<RawResponse>

export interface ApiResponse<T = unknown> {
	data: T
	status: number
	statusText: string
	headers: Headers
	config: ApiConfig
}
