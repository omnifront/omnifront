import { defaultScheduler } from "@omnifront/core"
import { ApiError } from "./error"
import { fetchAdapter } from "./fetch-adapter"
import { applyTransforms, buildURL, encodeBody, mergeConfig, normalizeHeaders } from "./request"
import type { ApiConfig, ApiRequest, ApiResponse, Method, Params, RawResponse, Headers } from "./types"

type RequestHandler = (config: ApiConfig) => ApiConfig | Promise<ApiConfig>
interface RequestHandlerOptions {
	/** Skip the interceptor for requests where this returns false. */
	runWhen?: ((config: ApiConfig) => boolean) | undefined
}
type RequestEntry = [RequestHandler, RequestHandlerOptions?]
type ResponseHandler = (response: ApiResponse) => ApiResponse | Promise<ApiResponse>
type ErrorHandler = (error: unknown) => ApiResponse | Promise<ApiResponse>

/** Interceptors run in the order they were added (FIFO), on both the request and the response side. */
export class Interceptors<T extends unknown[]> {
	/** @internal */
	readonly handlers: (T | undefined)[] = []

	/** Returns a function that removes the interceptor again. */
	use(...handler: T): () => void {
		const index = this.handlers.push(handler) - 1
		return () => {
			this.handlers[index] = undefined
		}
	}
}

const IDEMPOTENT = new Set<Method>(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"])

function defaultRetryOn(error: ApiError, method: Method): boolean {
	if (!IDEMPOTENT.has(method)) return false
	return (
		error.code === "NETWORK" ||
		error.code === "TIMEOUT" ||
		(error.code === "HTTP" && (error.status! >= 500 || error.status === 429))
	)
}

export interface Api {
	readonly defaults: ApiConfig
	readonly interceptors: {
		request: Interceptors<RequestEntry>
		response: Interceptors<[ResponseHandler?, ErrorHandler?]>
	}
	/** The full URL a request with this config would use (base URL and query string included); nothing is sent. */
	getUri(config?: ApiConfig): string
	request<T = unknown>(config: ApiConfig): Promise<ApiResponse<T>>
	get<T = unknown>(url: string, config?: ApiConfig): Promise<ApiResponse<T>>
	delete<T = unknown>(url: string, config?: ApiConfig): Promise<ApiResponse<T>>
	head<T = unknown>(url: string, config?: ApiConfig): Promise<ApiResponse<T>>
	options<T = unknown>(url: string, config?: ApiConfig): Promise<ApiResponse<T>>
	post<T = unknown>(url: string, data?: unknown, config?: ApiConfig): Promise<ApiResponse<T>>
	put<T = unknown>(url: string, data?: unknown, config?: ApiConfig): Promise<ApiResponse<T>>
	patch<T = unknown>(url: string, data?: unknown, config?: ApiConfig): Promise<ApiResponse<T>>
	/** A child instance: merged defaults, and a copy of the interceptors added so far. */
	extend(config?: ApiConfig): Api
	/** The query key `queryOptions` uses for this path (use it for `invalidateQueries`). */
	queryKey(path: string, params?: Params): readonly unknown[]
	/** Shape-compatible with `useQuery` / `injectQuery` / `QueryClient.fetchQuery`; the abort signal is wired through. */
	queryOptions<T = unknown>(
		path: string,
		config?: ApiConfig,
	): { queryKey: readonly unknown[]; queryFn: (context: { signal: AbortSignal }) => Promise<T> }
	/** Shape-compatible with `useMutation`. `path` may depend on the variables (`(v) => \`/todos/${v.id}\``). */
	mutationOptions<TData = unknown, TVariables = void>(
		method: Method,
		path: string | ((variables: TVariables) => string),
		config?: ApiConfig,
	): { mutationFn: (variables: TVariables) => Promise<TData> }
}

function sleep(ms: number, config: ApiConfig): Promise<void> {
	const scheduler = config.scheduler ?? defaultScheduler
	return new Promise((resolve, reject) => {
		const signal = config.signal
		const onAbort = (): void => {
			scheduler.clearTimeout(handle)
			reject(new ApiError("Request aborted", "ABORT", config))
		}
		const handle = scheduler.setTimeout(() => {
			signal?.removeEventListener("abort", onAbort)
			resolve()
		}, ms)
		signal?.addEventListener("abort", onAbort, { once: true })
	})
}

async function attempt(config: ApiConfig): Promise<ApiResponse> {
	const scheduler = config.scheduler ?? defaultScheduler
	const headers: Headers = normalizeHeaders(config.headers)
	const data = applyTransforms(config.data, headers, config.transformRequest)
	const body = encodeBody(data, headers)
	const method = config.method ?? "GET"
	const responseType = config.responseType ?? "json"

	const controller = new AbortController()
	const user = config.signal
	if (user?.aborted) throw new ApiError("Request aborted", "ABORT", config)
	const onUserAbort = (): void => controller.abort()
	user?.addEventListener("abort", onUserAbort, { once: true })
	let timedOut = false
	const timer = config.timeout
		? scheduler.setTimeout(() => {
				timedOut = true
				controller.abort()
			}, config.timeout)
		: undefined

	const request: ApiRequest = {
		url: buildURL(config),
		method,
		headers,
		body,
		signal: controller.signal,
		responseType,
		onDownloadProgress: config.onDownloadProgress,
		onUploadProgress: config.onUploadProgress,
		fetch: config.fetch,
		withCredentials: config.withCredentials,
		fetchOptions: config.fetchOptions,
	}

	try {
		let raw: RawResponse
		try {
			raw = await (config.adapter ?? fetchAdapter)(request)
		} catch (error) {
			if (error instanceof ApiError) throw error
			if (timedOut) {
				throw new ApiError(config.timeoutErrorMessage ?? `Timeout of ${config.timeout}ms exceeded`, "TIMEOUT", config, undefined, {
					cause: error,
				})
			}
			if (user?.aborted || (error as Error | undefined)?.name === "AbortError") {
				throw new ApiError("Request aborted", "ABORT", config, undefined, { cause: error })
			}
			throw new ApiError("Network error", "NETWORK", config, undefined, { cause: error })
		}

		const ok = (config.validateStatus ?? ((s: number) => s >= 200 && s < 300))(raw.status)
		let parsed = raw.data
		if (responseType === "json" && typeof parsed === "string") {
			try {
				parsed = parsed === "" ? undefined : JSON.parse(parsed, config.parseReviver)
			} catch (error) {
				// A non-JSON error body (an HTML 502 page, say) stays as text; a bad success body is a PARSE error.
				if (ok) {
					const failed: ApiResponse = { ...raw, data: parsed, config }
					throw new ApiError("Response is not valid JSON", "PARSE", config, failed, { cause: error })
				}
			}
		}
		const response: ApiResponse = {
			data: applyTransforms(parsed, raw.headers, config.transformResponse),
			status: raw.status,
			statusText: raw.statusText,
			headers: raw.headers,
			config,
		}
		if (!ok) throw new ApiError(`Request failed with status ${raw.status}`, "HTTP", config, response)
		return response
	} finally {
		user?.removeEventListener("abort", onUserAbort)
		if (timer !== undefined) scheduler.clearTimeout(timer)
	}
}

async function dispatch(config: ApiConfig): Promise<ApiResponse> {
	const method = config.method ?? "GET"
	const retry = config.retry
	for (let n = 1; ; n++) {
		try {
			return await attempt(config)
		} catch (error) {
			if (!retry || n > retry.attempts || !(error instanceof ApiError)) throw error
			if (!(retry.retryOn ?? ((e: ApiError) => defaultRetryOn(e, method)))(error)) throw error
			await sleep(retry.backoff ? retry.backoff(n) : Math.min(1000 * 2 ** (n - 1), 30_000), config)
		}
	}
}

export function createApi(defaults: ApiConfig = {}): Api {
	return build(mergeConfig(defaults), [], [])
}

function build(
	defaults: ApiConfig,
	requestHandlers: RequestEntry[],
	responseHandlers: [ResponseHandler?, ErrorHandler?][],
): Api {
	const interceptors = {
		request: new Interceptors<RequestEntry>(),
		response: new Interceptors<[ResponseHandler?, ErrorHandler?]>(),
	}
	interceptors.request.handlers.push(...requestHandlers)
	interceptors.response.handlers.push(...responseHandlers)

	const request = <T>(config: ApiConfig): Promise<ApiResponse<T>> => {
		let chain: Promise<unknown> = Promise.resolve(mergeConfig(defaults, config))
		for (const h of interceptors.request.handlers) {
			if (h) chain = chain.then((c) => (h[1]?.runWhen?.(c as ApiConfig) === false ? c : h[0](c as ApiConfig)))
		}
		chain = chain.then((c) => dispatch(c as ApiConfig))
		for (const h of interceptors.response.handlers) if (h) chain = chain.then(h[0] as ((value: unknown) => unknown) | undefined, h[1])
		return chain as Promise<ApiResponse<T>>
	}
	const withUrl = <T>(method: Method, url: string, config?: ApiConfig, data?: unknown): Promise<ApiResponse<T>> =>
		request<T>({ ...config, url, method, ...(data === undefined ? {} : { data }) })
	const queryKey = (path: string, params?: Params): readonly unknown[] => (params ? [path, params] : [path])

	const api: Api = {
		defaults,
		interceptors,
		getUri: (config) => buildURL(mergeConfig(defaults, config)),
		request,
		get: (url, config) => withUrl("GET", url, config),
		delete: (url, config) => withUrl("DELETE", url, config),
		head: (url, config) => withUrl("HEAD", url, config),
		options: (url, config) => withUrl("OPTIONS", url, config),
		post: (url, data, config) => withUrl("POST", url, config, data),
		put: (url, data, config) => withUrl("PUT", url, config, data),
		patch: (url, data, config) => withUrl("PATCH", url, config, data),
		extend: (config) =>
			build(
				mergeConfig(defaults, config),
				interceptors.request.handlers.filter((h) => h) as RequestEntry[],
				interceptors.response.handlers.filter((h) => h) as [ResponseHandler?, ErrorHandler?][],
			),
		queryKey,
		queryOptions: <T>(path: string, config?: ApiConfig) => ({
			queryKey: queryKey(path, config?.params),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				request<T>({ ...config, url: path, method: "GET", signal }).then((r) => r.data),
		}),
		mutationOptions: <TData, TVariables>(
			method: Method,
			path: string | ((variables: TVariables) => string),
			config?: ApiConfig,
		) => ({
			mutationFn: (variables: TVariables) =>
				request<TData>({
					...config,
					method,
					url: typeof path === "function" ? path(variables) : path,
					data: variables === undefined ? config?.data : variables,
				}).then((r) => r.data),
		}),
	}
	return api
}
