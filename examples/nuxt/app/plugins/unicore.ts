import { QueryClient } from "@unicore/query"
import { dehydrate, hydrate, type DehydratedState } from "@unicore/query/hydration"
import { QueryPlugin } from "@unicore/vue"

// One QueryClient per request on the server (this plugin runs once per request) and one for the
// whole session in the browser. The cache travels in Nuxt's payload.
export default defineNuxtPlugin((nuxtApp) => {
	const client = new QueryClient(import.meta.server ? { gcTime: Infinity } : {})
	nuxtApp.vueApp.use(QueryPlugin, client)

	if (import.meta.server) {
		nuxtApp.hooks.hook("app:rendered", () => {
			nuxtApp.payload.unicore = dehydrate(client) // after rendering: every prefetch has finished
		})
	} else if (nuxtApp.payload.unicore) {
		hydrate(client, nuxtApp.payload.unicore as DehydratedState)
	}
	return { provide: { queryClient: client } }
})
