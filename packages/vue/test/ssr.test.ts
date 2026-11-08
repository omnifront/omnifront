import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "@unicore/query"
import { dehydrate, hydrate } from "@unicore/query/hydration"
import { createSSRApp, defineComponent, h, nextTick } from "vue"
import { renderToString } from "vue/server-renderer"
import { afterEach, describe, expect, it, vi } from "vitest"
import { QueryPlugin, useQuery } from "../src"

const wire = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const newClient = (clock: number) => {
	const scheduler = new FakeScheduler()
	scheduler.advance(clock)
	return new QueryClient({ scheduler, gcTime: Infinity })
}
const flush = async () => {
	await new Promise((resolve) => setTimeout(resolve, 0))
	await nextTick()
}

afterEach(() => vi.unstubAllGlobals())

/** The component prints everything that depends on the clock, to make any mismatch visible. */
const makeApp = (staleTime: number) =>
	defineComponent({
		setup() {
			const q = useQuery({ queryKey: ["todos"], queryFn: () => Promise.resolve(["a", "b"]), staleTime })
			return () =>
				h("section", [
					h("p", `status=${q.status.value} stale=${q.isStale.value} fetching=${q.isFetching.value}`),
					h("ul", (q.data.value ?? []).map((t) => h("li", t))),
				])
		},
	})

describe("Vue SSR round trip", () => {
	it.each([
		["fresh data, browser clock far ahead", 5000, 500_000],
		["fresh data, browser clock behind", 5000, 10],
		["staleTime 0 (refetches on mount)", 0, 1100],
	])("renders on the server, hydrates in the browser without a mismatch (%s)", async (_name, staleTime, browserClock) => {
		// Server: no window. Vue waits for onServerPrefetch, so the HTML already has the data.
		const server = newClient(1000)
		vi.stubGlobal("window", undefined)
		const html = await renderToString(createSSRApp(makeApp(staleTime)).use(QueryPlugin, server))
		vi.unstubAllGlobals()
		expect(html).toContain("<li>a</li>")
		const state = wire(dehydrate(server))

		// Browser: hydrate the cache first, then the app, and listen for Vue's hydration warnings.
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
		const browser = newClient(browserClock)
		hydrate(browser, state)
		const container = document.createElement("div")
		container.innerHTML = html
		document.body.append(container)
		const app = createSSRApp(makeApp(staleTime)).use(QueryPlugin, browser)
		app.mount(container)
		await flush()
		const warnings = warn.mock.calls.map((call) => String(call[0]))
		warn.mockRestore()
		expect(warnings.filter((w) => /hydrat/i.test(w))).toEqual([])
		expect(container.querySelectorAll("li")).toHaveLength(2)
		app.unmount()
		container.remove()
	})
})
