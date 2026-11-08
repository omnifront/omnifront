import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { dehydrate } from "@omnifront/query/hydration"
import { act } from "@testing-library/react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HydrationBoundary, QueryProvider, useQuery } from "../src"

const key = ["todos"]
const wire = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const newClient = (clock: number) => {
	const scheduler = new FakeScheduler()
	scheduler.advance(clock)
	return new QueryClient({ scheduler, gcTime: Infinity })
}

function Todos({ staleTime }: { staleTime: number }) {
	const q = useQuery({ queryKey: key, queryFn: () => Promise.resolve(["a", "b"]), staleTime })
	return (
		<section>
			<p>
				{`status=${q.status} stale=${q.isStale} fetching=${q.isFetching}`}
			</p>
			<ul>{q.data?.map((t) => <li key={t}>{t}</li>)}</ul>
		</section>
	)
}

const tree = (client: QueryClient, state: unknown, staleTime: number) => (
	<QueryProvider client={client}>
		<HydrationBoundary state={state as never}>
			<Todos staleTime={staleTime} />
		</HydrationBoundary>
	</QueryProvider>
)

/** Render on a "server", ship the HTML + dehydrated JSON, hydrate on a "browser" with a skewed clock. */
async function roundTrip(opts: { prefetch: boolean; staleTime: number; browserClock: number }) {
	const server = newClient(1000)
	if (opts.prefetch) await server.fetchQuery(key, () => Promise.resolve(["a", "b"]))
	const state = wire(dehydrate(server))
	const html = renderToString(tree(newClient(1000), state, opts.staleTime)) // a fresh client per request

	const container = document.createElement("div")
	container.innerHTML = html
	document.body.append(container)

	const errors: unknown[] = []
	const consoleError = vi.spyOn(console, "error").mockImplementation((...args) => void errors.push(args))
	const browser = newClient(opts.browserClock)
	await act(async () => {
		hydrateRoot(container, tree(browser, state, opts.staleTime), { onRecoverableError: (e) => errors.push(e) })
	})
	consoleError.mockRestore()
	return { html, container, errors, browser }
}

afterEach(() => (document.body.innerHTML = ""))

describe("SSR hydration", () => {
	it.each([
		["fresh data, browser clock far ahead", 5000, 500_000],
		["fresh data, browser clock slightly ahead", 5000, 1200],
		["fresh data, browser clock behind the server", 5000, 10],
		["staleTime 0 (refetches on mount)", 0, 1100],
	])("prefetched on the server: no mismatch (%s)", async (_name, staleTime, browserClock) => {
		const { html, container, errors } = await roundTrip({ prefetch: true, staleTime, browserClock })
		expect(html).toContain("<li>a</li>")
		expect(errors).toEqual([])
		expect(container.querySelectorAll("li")).toHaveLength(2)
	})

	it("not prefetched: server renders loading, the browser hydrates without mismatch and then fetches", async () => {
		const { html, container, errors } = await roundTrip({ prefetch: false, staleTime: 5000, browserClock: 70_000 })
		expect(html).toContain("status=loading")
		expect(errors).toEqual([])
		await act(async () => void (await new Promise((r) => setTimeout(r, 0))))
		expect(container.querySelectorAll("li")).toHaveLength(2)
	})

	it("hydrated fresh data is not fetched again on mount", async () => {
		const server = newClient(1000)
		await server.fetchQuery(key, () => Promise.resolve(["a"]))
		const state = wire(dehydrate(server))
		const fn = vi.fn(() => Promise.resolve(["b"]))
		function Probe() {
			const q = useQuery({ queryKey: key, queryFn: fn, staleTime: 60_000 })
			return <p>{q.data?.join(",")}</p>
		}
		const ui = (client: QueryClient) => (
			<QueryProvider client={client}>
				<HydrationBoundary state={state}>
					<Probe />
				</HydrationBoundary>
			</QueryProvider>
		)
		const container = document.createElement("div")
		container.innerHTML = renderToString(ui(newClient(1000)))
		document.body.append(container)
		const errors: unknown[] = []
		await act(async () => {
			hydrateRoot(container, ui(newClient(2000)), { onRecoverableError: (e) => errors.push(e) })
		})
		expect(errors).toEqual([])
		expect(fn).not.toHaveBeenCalled()
		expect(container.textContent).toBe("a")
	})

	it("HydrationBoundary without state renders its children", () => {
		const html = renderToString(
			<QueryProvider client={newClient(0)}>
				<HydrationBoundary>
					<p>hi</p>
				</HydrationBoundary>
			</QueryProvider>,
		)
		expect(html).toBe("<p>hi</p>")
	})
})
