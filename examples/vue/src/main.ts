import { QueryClient } from "@unicore/query"
import { QueryPlugin } from "@unicore/vue"
import { createApp } from "vue"
import App from "./App.vue"

createApp(App).use(QueryPlugin, new QueryClient()).mount("#root")
