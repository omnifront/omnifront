import type { QueryClient } from "@unicore/query"
import { inject, provide, type InjectionKey, type Plugin } from "vue"

const QueryClientKey: InjectionKey<QueryClient> = Symbol("unicore:query-client")

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

export function useQueryClient(): QueryClient {
	const client = inject(QueryClientKey, undefined)
	if (!client) throw new Error("useQueryClient: install the plugin with app.use(QueryPlugin, client)")
	return client
}
