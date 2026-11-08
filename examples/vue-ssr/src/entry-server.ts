import { QueryClient } from "@unicore/query"
import { dehydrate } from "@unicore/query/hydration"
import { QueryPlugin } from "@unicore/vue"
import { createSSRApp } from "vue"
import { renderToString } from "vue/server-renderer"
import App from "./App.vue"

/** One QueryClient per request; never share it between requests. */
export async function render() {
	const client = new QueryClient({ gcTime: Infinity })
	const html = await renderToString(createSSRApp(App).use(QueryPlugin, client))
	return { html, state: dehydrate(client) } // dehydrate AFTER rendering: every prefetch has finished
}
