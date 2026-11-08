import { QueryClient } from "@omnifront/query"
import { hydrate, type DehydratedState } from "@omnifront/query/hydration"
import { QueryPlugin } from "@omnifront/vue"
import { createSSRApp } from "vue"
import App from "./App.vue"

const client = new QueryClient()
hydrate(client, (window as unknown as { __OMNIFRONT__?: DehydratedState }).__OMNIFRONT__) // before the app
createSSRApp(App).use(QueryPlugin, client).mount("#app")
