import { QueryClient } from "@omnifront/query"
import { QueryPlugin } from "@omnifront/vue"
import { createApp } from "vue"
import { setupOffline } from "@omnifront/example-shared"
import App from "./App.vue"

const client = new QueryClient()
// Serial adds (scope) and the offline switch of the demo; no persistence in this example.
setupOffline(client)
createApp(App).use(QueryPlugin, client).mount("#root")
