import { mountDevtools } from "@omnifront/devtools/panel"
import { persistQueryClient } from "@omnifront/persist"
import { QueryClient } from "@omnifront/query"
import { QueryProvider } from "@omnifront/react"
import { createRoot } from "react-dom/client"
import { App } from "./App"

const client = new QueryClient()

// The cache survives reloads (stale data is shown at once and refetched), and the inspector is one call.
persistQueryClient(client, { storage: localStorage, buster: "example-react-1", throttle: 300 })
mountDevtools(client)

createRoot(document.getElementById("root")!).render(
	<QueryProvider client={client}>
		<App />
	</QueryProvider>,
)
