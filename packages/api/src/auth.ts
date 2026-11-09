import type { Subscribable } from "@omnifront/core"
import type { Api } from "./client"
import { isApiError } from "./error"
import type { Headers } from "./types"

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
