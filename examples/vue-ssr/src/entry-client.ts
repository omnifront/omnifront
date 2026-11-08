import { QueryClient } from "@unicore/query"
import { hydrate, type DehydratedState } from "@unicore/query/hydration"
import { QueryPlugin } from "@unicore/vue"
import { createSSRApp } from "vue"
import App from "./App.vue"

const client = new QueryClient()
hydrate(client, (window as unknown as { __UNICORE__?: DehydratedState }).__UNICORE__) // before the app
createSSRApp(App).use(QueryPlugin, client).mount("#app")
