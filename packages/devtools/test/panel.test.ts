import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient, QueryObserver } from "@omnifront/query"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mountDevtools, type DevtoolsPanel } from "../src/panel"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const panels: DevtoolsPanel[] = []
const mount = (client: QueryClient, options?: Parameters<typeof mountDevtools>[1]) => {
	const panel = mountDevtools(client, options)
	panels.push(panel)
	const host = document.querySelector("[data-omnifront-devtools]") as HTMLElement
	return { panel, root: host.shadowRoot as ShadowRoot }
}
const newClient = () => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}
const text = (root: ShadowRoot) => root.textContent ?? ""
const click = (root: ShadowRoot, selector: string, index = 0) => (root.querySelectorAll(selector)[index] as HTMLElement).click()

afterEach(() => {
	panels.splice(0).forEach((p) => p.destroy())
	document.body.innerHTML = ""
})

describe("mountDevtools", () => {
	it("starts as a toggle showing the query count; opening lists the entries", () => {
		const { client } = newClient()
		client.setQueryData(["todos"], ["a"])
		client.setQueryData(["user", 1], { name: "Sam" })
		const { root } = mount(client)
		expect(text(root)).toContain("omnifront · 2")
		click(root, ".toggle")
		expect(text(root)).toContain('["todos"]')
		expect(text(root)).toContain('["user",1]')
		expect(text(root)).toContain("2 queries")
	})

	it("says 'query' for exactly one entry", () => {
		const { client } = newClient()
		client.setQueryData(["only"], 1)
		const { root } = mount(client, { initiallyOpen: true })
		expect(text(root)).toContain("1 query")
		expect(text(root)).not.toContain("1 queries")
	})

	it("shows an empty-cache message and a close button", () => {
		const { client } = newClient()
		const { root } = mount(client, { initiallyOpen: true })
		expect(text(root)).toContain("The cache is empty.")
		click(root, "[aria-label=Close]")
		expect(root.querySelector(".toggle")).not.toBeNull()
	})

	it("selecting an entry shows its status and data", () => {
		const { client } = newClient()
		client.setQueryData(["user", 1], { name: "Sam" })
		const { root } = mount(client, { initiallyOpen: true })
		click(root, ".row")
		expect(text(root)).toContain("status: success")
		expect(text(root)).toContain('"name": "Sam"')
		expect(root.querySelector(".row")?.getAttribute("aria-pressed")).toBe("true")
	})

	it("flags fetching, invalidated and observed entries, and shows errors", async () => {
		const { client } = newClient()
		await client.fetchQuery(["bad"], () => Promise.reject(new Error("boom"))).catch(() => {})
		client.setQueryData(["inv"], 1)
		client.getQuery(["inv"]).invalidate()
		client.fetchQuery(["slow"], () => new Promise(() => {})).catch(() => {})
		const off = new QueryObserver(client, { queryKey: ["inv"], queryFn: async () => 1, enabled: false }).subscribe(() => {})
		const { root } = mount(client, { initiallyOpen: true })
		const all = text(root)
		expect(all).toContain("fetching")
		expect(all).toContain("invalidated")
		expect(all).toContain("observed")
		click(root, ".row", 0) // ["bad"]
		expect(text(root)).toContain("error:")
		expect(text(root)).toContain("boom")
		off()
	})

	it("Invalidate refetches an observed entry", async () => {
		const { client } = newClient()
		const fn = vi.fn(() => Promise.resolve(1))
		const off = new QueryObserver(client, { queryKey: ["a"], queryFn: fn, staleTime: Infinity }).subscribe(() => {})
		await flush()
		const { root } = mount(client, { initiallyOpen: true })
		click(root, ".row")
		click(root, ".detail button", 0) // Invalidate
		await flush()
		expect(fn).toHaveBeenCalledTimes(2)
		off()
	})

	it("Cancel aborts a slow request", async () => {
		const { client } = newClient()
		client.fetchQuery(["slow"], () => new Promise(() => {})).catch(() => {})
		expect(client.getQueryState(["slow"])?.isFetching).toBe(true)
		const { root } = mount(client, { initiallyOpen: true })
		click(root, ".row")
		click(root, ".detail button", 1) // Cancel
		expect(client.getQueryState(["slow"])?.isFetching).toBe(false)
	})

	it("updates while open as the cache changes, and stops watching when closed or destroyed", () => {
		const { client, scheduler } = newClient()
		const { panel, root } = mount(client, { initiallyOpen: true, interval: 100 })
		client.setQueryData(["late"], 1)
		scheduler.advance(100)
		expect(text(root)).toContain('["late"]')
		panel.close()
		expect(scheduler.pendingTimers).toBe(0)
		panel.open()
		expect(scheduler.pendingTimers).toBe(1)
		panel.destroy()
		expect(document.querySelector("[data-omnifront-devtools]")).toBeNull()
		expect(scheduler.pendingTimers).toBe(0)
	})

	it("renders data as text only (never HTML) and copes with circular data", () => {
		const { client } = newClient()
		const circular: Record<string, unknown> = { html: "<img src=x onerror=alert(1)>" }
		circular.self = circular
		client.setQueryData(["x"], circular)
		const { root } = mount(client, { initiallyOpen: true })
		click(root, ".row")
		expect(root.querySelector("img")).toBeNull()
		expect(text(root)).toContain("[object Object]")
	})

	it("truncates huge data and attaches into a given container", () => {
		const { client } = newClient()
		client.setQueryData(["big"], "x".repeat(30_000))
		const container = document.createElement("section")
		document.body.append(container)
		const panel = mountDevtools(client, { initiallyOpen: true, container })
		panels.push(panel)
		const root = (container.querySelector("[data-omnifront-devtools]") as HTMLElement).shadowRoot as ShadowRoot
		click(root, ".row")
		expect(text(root)).toContain("(truncated)")
	})

	it("shows 'updated' time for entries that have data", () => {
		const { client } = newClient()
		client.setQueryData(["a"], 1)
		const { root } = mount(client, { initiallyOpen: true })
		click(root, ".row")
		expect(text(root)).toContain("updated:")
	})
})
