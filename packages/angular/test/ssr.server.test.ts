// @vitest-environment node
import "@angular/compiler"
import * as ng from "@angular/core"
import { Component } from "@angular/core"
import { bootstrapApplication, type BootstrapContext } from "@angular/platform-browser"
import { provideServerRendering, renderApplication } from "@angular/platform-server"
import { QueryClient } from "@omnifront/query"
import { describe, expect, it } from "vitest"
import { injectQuery, provideOmnifront } from "../src"
import { provideOmnifrontSsr } from "../src/ssr"
import { zonelessProviders } from "./compat"

// Angular 17 cannot run without zone.js (its server renderer included); newer versions need nothing.
if (zonelessProviders().length === 0) await import(/* @vite-ignore */ "zone.js" as string)

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
	standalone: true,
	selector: "app-root",
	template: `<p>{{ todos.status() }}</p><ul>@for (t of todos.data(); track t) { <li>{{ t }}</li> }</ul>`,
})(Todos)

const render = (client: QueryClient) =>
	renderApplication(
		(context: BootstrapContext) =>
			bootstrapApplication(
				Todos,
				{ providers: [...zonelessProviders(), provideServerRendering(), provideOmnifront(client), provideOmnifrontSsr()] },
				context,
			),
		{ document: "<app-root></app-root>" },
	)

// Waiting for queries on the server needs PendingTasks (Angular 19; ExperimentalPendingTasks in 18).
// On 17 provideOmnifrontSsr still transfers state but cannot hold the render open; that is documented.
const canWait = "PendingTasks" in ng || "ExperimentalPendingTasks" in ng

describe.skipIf(!canWait)("Angular server rendering", () => {
	it("waits for the queries, renders their data, and puts the cache into TransferState", async () => {
		const client = new QueryClient({ gcTime: Infinity })
		const html = await render(client)
		expect(html).toContain("<li>server-a</li>")
		expect(html).toContain("<li>server-b</li>")
		expect(html).toContain("success")
		const script = /<script id="ng-state" type="application\/json">(.*?)<\/script>/.exec(html)
		expect(script).not.toBeNull()
		const state = JSON.parse(script?.[1] ?? "{}") as Record<string, { queries: Array<{ queryKey: unknown; data: unknown }> }>
		expect(state["omnifront:query-cache"]?.queries).toMatchObject([{ queryKey: ["todos"], data: ["server-a", "server-b"] }])
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

describe.skipIf(!canWait)("Angular server rendering: failures and dependent queries", () => {
	it("a failing request does not hold the render open through retries", async () => {
		class Failing {
			todos = injectQuery({ queryKey: ["failing"], queryFn: () => Promise.reject(new Error("down")) })
		}
		Component({ standalone: true, selector: "app-root", template: `<p>{{ todos.status() }}</p>` })(Failing)
		const started = Date.now()
		const html = await renderApplication(
			(context: BootstrapContext) =>
				bootstrapApplication(
					Failing,
					{ providers: [...zonelessProviders(), provideServerRendering(), provideOmnifront(new QueryClient({ gcTime: Infinity })), provideOmnifrontSsr()] },
					context,
				),
			{ document: "<app-root></app-root>" },
		)
		expect(html).toContain("error")
		expect(Date.now() - started).toBeLessThan(3000) // default retries would take about 7 seconds
	})

	it("also waits for a query that only starts after another one's data arrived (waterfall)", async () => {
		class Detail {
			detail = injectQuery({
				queryKey: ["detail"],
				queryFn: async () => {
					await new Promise((resolve) => setTimeout(resolve, 10))
					return "detail-data"
				},
			})
		}
		Component({ standalone: true, selector: "app-detail", template: `<p>{{ detail.data() }}</p>` })(Detail)
		class Parent {
			list = injectQuery({ queryKey: ["list"], queryFn: async () => ["x"] })
		}
		Component({
			standalone: true,
			selector: "app-root",
			imports: [Detail],
			template: `@if (list.data()) { <app-detail /> }`,
		})(Parent)
		const html = await renderApplication(
			(context: BootstrapContext) =>
				bootstrapApplication(
					Parent,
					{ providers: [...zonelessProviders(), provideServerRendering(), provideOmnifront(new QueryClient({ gcTime: Infinity })), provideOmnifrontSsr()] },
					context,
				),
			{ document: "<app-root></app-root>" },
		)
		expect(html).toContain("detail-data")
	})
})
