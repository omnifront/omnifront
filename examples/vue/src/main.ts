import { QueryClient } from "@omnifront/query"
import { QueryPlugin } from "@omnifront/vue"
import { createApp } from "vue"
import App from "./App.vue"

createApp(App).use(QueryPlugin, new QueryClient()).mount("#root")
