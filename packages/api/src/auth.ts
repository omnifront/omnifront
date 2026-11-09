import type { Subscribable } from "@omnifront/core"
import type { Api } from "./client"
import { isApiError } from "./error"
import type { ApiConfig, Headers } from "./types"

/**
 * Add headers computed from any `Subscribable` (a store, say) to every request. The snapshot is read
 * when the request is sent, so a token that changes later is picked up. Returns an unsubscribe function.
 *
 *   withAuth(api, authStore, (s) => (s.token ? { Authorization: `Bearer ${s.token}` } : {}))
 */
export function withAuth<T>(api: Api, source: Subscribable<T>, select: (snapshot: T) => Headers | Record<string, string>): () => void {
	return api.interceptors.request.use((config) => ({
		...config,
		headers: { ...config.headers, ...select(source.getSnapshot()) },
	}))
}

export interface RefreshOptions {
	/** Get a new token (and store it, so `withAuth` sees it). Called once even if many requests fail at the same time. */
	refresh: () => Promise<unknown>
	/** Default: HTTP status 401. */
	shouldRefresh?: ((error: unknown) => boolean) | undefined
}

/**
 * On a 401, refresh once (concurrent failures share one refresh), then repeat the request one time.
 * If the refresh fails, the original error is thrown. Returns an unsubscribe function.
 */
export function refreshOnUnauthorized(api: Api, { refresh, shouldRefresh }: RefreshOptions): () => void {
	let pending: Promise<unknown> | undefined
	return api.interceptors.response.use(undefined, async (error) => {
		const should = shouldRefresh ?? ((e: unknown) => isApiError(e) && e.status === 401)
		if (!isApiError(error) || !should(error) || error.config.meta?.["retriedAfterRefresh"]) throw error
		pending ??= refresh().finally(() => {
			pending = undefined
		})
		try {
			await pending
		} catch {
			throw error
		}
		return api.request({ ...error.config, meta: { ...error.config.meta, retriedAfterRefresh: true } })
	})
}

/**
 * HTTP Basic authentication on every request (axios's `auth` option). Non-ASCII names and passwords
 * are sent as UTF-8. Returns an unsubscribe function.
 */
export function basicAuth(api: Api, credentials: { username: string; password?: string | undefined }): () => void {
	const bytes = new TextEncoder().encode(`${credentials.username}:${credentials.password ?? ""}`)
	const authorization = `Basic ${btoa(String.fromCharCode(...bytes))}`
	return api.interceptors.request.use((config) => ({ ...config, headers: { ...config.headers, authorization } }))
}

export interface XsrfOptions {
	/** Default `"XSRF-TOKEN"`. */
	cookieName?: string | undefined
	/** Default `"X-XSRF-TOKEN"`. */
	headerName?: string | undefined
	/**
	 * Which requests get the header. Default: same-origin ones only, so the token is never sent to
	 * another site. `true` sends it everywhere (axios's `withXSRFToken: true`).
	 */
	send?: boolean | ((config: ApiConfig) => boolean) | undefined
	/** Where to read cookies from. Default `document.cookie` (nothing on the server). */
	cookie?: (() => string) | undefined
}

/**
 * Copy the XSRF cookie into a request header (axios's `xsrfCookieName` / `xsrfHeaderName`). Nothing
 * is added when the cookie is missing. Returns an unsubscribe function.
 */
export function withXsrf(api: Api, options: XsrfOptions = {}): () => void {
	const name = options.cookieName ?? "XSRF-TOKEN"
	// Neither exists on the server: nothing is read and nothing is sent there.
	const page = globalThis as { document?: { cookie: string }; location?: { href: string; origin: string } }
	const read = options.cookie ?? (() => page.document?.cookie ?? "")
	const sameOrigin = (config: ApiConfig): boolean => {
		if (!page.location) return false
		const base = new URL(config.baseURL ?? "", page.location.href)
		// With `allowAbsoluteUrls: false` the request always goes to the base URL's host.
		const target = config.allowAbsoluteUrls === false ? base : new URL(config.url ?? "", base)
		return target.origin === page.location.origin
	}
	return api.interceptors.request.use((config) => {
		const send = options.send ?? sameOrigin
		if (!(typeof send === "function" ? send(config) : send)) return config
		// `document.cookie` separates pairs with "; ".
		const token = `; ${read()}`.split(`; ${name}=`)[1]?.split(";")[0]
		if (!token) return config
		return { ...config, headers: { ...config.headers, [options.headerName ?? "X-XSRF-TOKEN"]: decodeURIComponent(token) } }
	})
}
