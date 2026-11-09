import type { QueryClient } from "@omnifront/query"
import { hasInjectionContext, inject, provide, type InjectionKey, type Plugin } from "vue"

const QueryClientKey: InjectionKey<QueryClient> = Symbol("omnifront:query-client")

/**
 * App-wide install: `app.use(QueryPlugin, client)`.
 * (Vue plugins are objects with `install`; `app.provide` makes the client injectable everywhere.)
 */
export const QueryPlugin: Plugin<[QueryClient]> = {
	install(app, client) {
		app.provide(QueryClientKey, client)
	},
}

/** Scoped install: call in a component's setup() to give its subtree a different client. */
export function provideQueryClient(client: QueryClient): void {
	provide(QueryClientKey, client)
}

/** Like `useQueryClient`, but `undefined` instead of throwing, also outside setup (hooks that work without a plugin). */
export function useOptionalQueryClient(): QueryClient | undefined {
	return hasInjectionContext() ? inject(QueryClientKey, undefined) : undefined
}

export function useQueryClient(): QueryClient {
	const client = inject(QueryClientKey, undefined)
	if (!client) throw new Error("useQueryClient: install the plugin with app.use(QueryPlugin, client)")
	return client
}
