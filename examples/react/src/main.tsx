import { QueryClient } from "@unicore/query"
import { QueryProvider } from "@unicore/react"
import { createRoot } from "react-dom/client"
import { App } from "./App"

const client = new QueryClient()

createRoot(document.getElementById("root")!).render(
	<QueryProvider client={client}>
		<App />
	</QueryProvider>,
)
