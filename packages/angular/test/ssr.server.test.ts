// @vitest-environment node
import "@angular/compiler"
import { Component, provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication, type BootstrapContext } from "@angular/platform-browser"
import { provideServerRendering, renderApplication } from "@angular/platform-server"
import { QueryClient } from "@unicore/query"
import { describe, expect, it } from "vitest"
import { injectQuery, provideUnicore } from "../src"
import { provideUnicoreSsr } from "../src/ssr"

let requests = 0
class Todos {
	todos = injectQuery({
		queryKey: ["todos"],
		queryFn: async () => {
			await new Promise((resolve) => setTimeout(resolve, 20)) // a real, slow request
			return requests++ === 0 ? ["server-a", "server-b"] : ["second-request"]
		},
		staleTime: 60_000,
	})
}
// Applying the decorator by hand: esbuild does not run Angular's decorator transform.
Component({
	selector: "app-root",
	template: `<p>{{ todos.status() }}</p><ul>@for (t of todos.data(); track t) { <li>{{ t }}</li> }</ul>`,
})(Todos)

const render = (client: QueryClient) =>
	renderApplication(
		(context: BootstrapContext) =>
			bootstrapApplication(
				Todos,
				{ providers: [provideZonelessChangeDetection(), provideServerRendering(), provideUnicore(client), provideUnicoreSsr()] },
				context,
			),
		{ document: "<app-root></app-root>" },
	)

describe("Angular server rendering", () => {
	it("waits for the queries, renders their data, and puts the cache into TransferState", async () => {
		const client = new QueryClient({ gcTime: Infinity })
		const html = await render(client)
		expect(html).toContain("<li>server-a</li>")
		expect(html).toContain("<li>server-b</li>")
		expect(html).toContain("success")
		const script = /<script id="ng-state" type="application\/json">(.*?)<\/script>/.exec(html)
		expect(script).not.toBeNull()
		const state = JSON.parse(script?.[1] ?? "{}") as Record<string, { queries: Array<{ queryKey: unknown; data: unknown }> }>
		expect(state["unicore:query-cache"]?.queries).toMatchObject([{ queryKey: ["todos"], data: ["server-a", "server-b"] }])
	})

	it("each request has its own client; nothing leaks from one render into the next", async () => {
		requests = 0
		const first = await render(new QueryClient({ gcTime: Infinity }))
		const second = await render(new QueryClient({ gcTime: Infinity }))
		expect(first).toContain("server-a")
		expect(second).toContain("second-request")
		expect(second).not.toContain("server-a")
	})
})
