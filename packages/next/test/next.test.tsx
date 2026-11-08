import { render, screen, act } from "@testing-library/react"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createServerQueryClient, dehydrate, getQueryClient, hydrate, QueryClient } from "../src"
import { HydrationBoundary, UnicoreProvider, useQuery, useQueryClient } from "../src/client"

afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
})

describe("server entry", () => {
	it("creates a new client per call and never schedules gc timers", async () => {
		vi.useFakeTimers()
		const a = createServerQueryClient()
		expect(createServerQueryClient()).not.toBe(a)
		a.setQueryData(["k"], 1)
		await a.fetchQuery(["j"], () => Promise.resolve(2))
		expect(vi.getTimerCount()).toBe(0)
	})

	it("getQueryClient returns a QueryClient (React cache dedupes it per request inside Next)", () => {
		expect(getQueryClient()).toBeInstanceOf(QueryClient)
	})

	it("re-exports dehydrate / hydrate that round-trip", async () => {
		const server = createServerQueryClient()
		await server.fetchQuery(["k"], () => Promise.resolve("x"))
		const browser = new QueryClient()
		hydrate(browser, JSON.parse(JSON.stringify(dehydrate(server))))
		expect(browser.getQueryData(["k"])).toBe("x")
	})
})

describe("client entry", () => {
	function Show() {
		const q = useQuery({ queryKey: ["todos"], queryFn: () => Promise.resolve(["a"]), staleTime: 60_000 })
		return createElement("p", null, q.data?.join(",") ?? q.status)
	}

	it("UnicoreProvider gives each render tree its own client and HydrationBoundary fills it", () => {
		const server = createServerQueryClient()
		server.setQueryData(["todos"], ["from-server"])
		const state = JSON.parse(JSON.stringify(dehydrate(server)))
		const ui = createElement(UnicoreProvider, null, createElement(HydrationBoundary, { state }, createElement(Show)))
		expect(renderToString(ui)).toBe("<p>from-server</p>")
		expect(renderToString(ui)).toBe("<p>from-server</p>")
	})

	it("shares one client across the tree in the browser", async () => {
		let seen: QueryClient | undefined
		function Probe() {
			seen = useQueryClient()
			return null
		}
		const { rerender } = render(createElement(UnicoreProvider, { gcTime: 1000 }, createElement(Probe)))
		const first = seen
		rerender(createElement(UnicoreProvider, { gcTime: 1000 }, createElement(Probe)))
		expect(seen).toBe(first)
		await act(async () => {})
		render(createElement(UnicoreProvider, null, createElement(Show)))
		expect(screen.getAllByText(/loading|a/).length).toBeGreaterThan(0)
	})

	it("on the server (no window) the provider's client schedules no gc timers", () => {
		vi.useFakeTimers()
		vi.stubGlobal("window", undefined)
		function Fill() {
			useQueryClient().setQueryData(["k"], 1)
			return null
		}
		renderToString(createElement(UnicoreProvider, null, createElement(Fill)))
		expect(vi.getTimerCount()).toBe(0)
	})
})

describe("without React.cache (React 18)", () => {
	it("still loads, and getQueryClient falls back to a new client per call", async () => {
		vi.resetModules()
		vi.doMock("react", async (original) => ({ ...(await original<typeof import("react")>()), cache: undefined }))
		const mod = await import("../src/index")
		expect(mod.getQueryClient()).toBeInstanceOf(mod.QueryClient)
		expect(mod.getQueryClient()).not.toBe(mod.getQueryClient())
		vi.doUnmock("react")
		vi.resetModules()
	})
})
