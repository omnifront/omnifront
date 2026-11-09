import type { Adapter, ApiRequest, RawResponse } from "./types"

export interface MockReply {
	status?: number
	statusText?: string
	headers?: Record<string, string>
	/** Objects are JSON-encoded for `responseType: "json"`. */
	data?: unknown
	/** Fail instead of replying (e.g. `new TypeError("offline")` for a network error). */
	error?: unknown
}

export type MockHandler = (request: ApiRequest) => MockReply | Promise<MockReply>

export interface MockAdapter extends Adapter {
	/** Every request the adapter received, in order. */
	readonly calls: ApiRequest[]
}

/**
 * An adapter for tests: no network. Pass a function, or routes keyed by `"METHOD /path"`
 * (the path is matched without the query string). Unmatched requests reply 404.
 *
 *   createApi({ adapter: createMockAdapter({ "GET /todos": { data: [] } }) })
 */
export function createMockAdapter(routes: MockHandler | Record<string, MockReply | MockHandler>): MockAdapter {
	const calls: ApiRequest[] = []
	const adapter = (async (request: ApiRequest): Promise<RawResponse> => {
		calls.push(request)
		let reply: MockReply
		if (typeof routes === "function") {
			reply = await routes(request)
		} else {
			const path = request.url.split("?")[0]!.replace(/^[a-z]+:\/\/[^/]+/i, "")
			const route = routes[`${request.method} ${path}`]
			reply = typeof route === "function" ? await route(request) : (route ?? { status: 404 })
		}
		if (reply.error !== undefined) throw reply.error
		const encode = request.responseType === "json" && reply.data !== undefined && typeof reply.data !== "string"
		return {
			status: reply.status ?? 200,
			statusText: reply.statusText ?? "",
			headers: reply.headers ?? {},
			data: encode ? JSON.stringify(reply.data) : reply.data,
		}
	}) as MockAdapter
	Object.defineProperty(adapter, "calls", { value: calls })
	return adapter
}
