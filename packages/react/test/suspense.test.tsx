import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "@unicore/query"
import { dehydrate } from "@unicore/query/hydration"
import { act, render, screen } from "@testing-library/react"
import { Component, Suspense, type ReactNode } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToReadableStream } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HydrationBoundary, QueryProvider } from "../src"
import { useSuspenseQuery } from "../src/suspense"

const newClient = (clock = 0) => {
	const scheduler = new FakeScheduler()
	scheduler.advance(clock)
	return new QueryClient({ scheduler, gcTime: Infinity })
}
const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))))

class Boundary extends Component<{ children: ReactNode; onError?: (e: unknown) => void }, { error: unknown }> {
	state = { error: undefined as unknown }
	static getDerivedStateFromError(error: unknown) {
		return { error }
	}
	componentDidCatch(error: unknown) {
		this.props.onError?.(error)
	}
	reset = () => this.setState({ error: undefined })
	render() {
		return this.state.error === undefined ? (
			this.props.children
		) : (
			<div>
				<p>failed: {String((this.state.error as Error).message)}</p>
				<button onClick={this.reset}>reset</button>
			</div>
		)
	}
}

function Todos({ queryFn, staleTime }: { queryFn: () => Promise<string[]>; staleTime?: number }) {
	const todos = useSuspenseQuery({ queryKey: ["todos"], queryFn, retry: false, ...(staleTime === undefined ? {} : { staleTime }) })
	return <ul>{todos.data.map((t) => <li key={t}>{t}</li>)}</ul>
}
const app = (client: QueryClient, ui: ReactNode) => (
	<QueryProvider client={client}>
		<Boundary>
			<Suspense fallback={<p>loading</p>}>{ui}</Suspense>
		</Boundary>
	</QueryProvider>
)

afterEach(() => vi.restoreAllMocks())

describe("useSuspenseQuery", () => {
	it("shows the fallback while loading, then renders with data (typed as defined)", async () => {
		const client = newClient()
		const queryFn = vi.fn(() => Promise.resolve(["a", "b"]))
		render(app(client, <Todos queryFn={queryFn} />))
		expect(screen.getByText("loading")).toBeTruthy()
		await flush()
		expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["a", "b"])
		expect(queryFn).toHaveBeenCalledTimes(1)
	})

	it("does not fetch again right after resolving (default staleTime is 1s)", async () => {
		const client = newClient()
		const queryFn = vi.fn(() => Promise.resolve(["a"]))
		render(app(client, <Todos queryFn={queryFn} />))
		await flush()
		await flush()
		expect(queryFn).toHaveBeenCalledTimes(1)
	})

	it("renders at once when the cache already has data, and shares one request between components", async () => {
		const warm = newClient()
		warm.setQueryData(["todos"], ["cached"])
		render(app(warm, <Todos queryFn={() => Promise.resolve(["x"])} staleTime={Infinity} />))
		expect(screen.getByText("cached")).toBeTruthy()

		const client = newClient()
		const queryFn = vi.fn(() => Promise.resolve(["shared"]))
		render(
			app(
				client,
				<>
					<Todos queryFn={queryFn} />
					<Todos queryFn={queryFn} />
				</>,
			),
		)
		await flush()
		expect(queryFn).toHaveBeenCalledTimes(1)
		expect(screen.getAllByText("shared")).toHaveLength(2)
	})

	it("throws a failed load to the error boundary; reset after invalidateQueries retries", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {})
		const client = newClient()
		let fail = true
		const queryFn = vi.fn(() => (fail ? Promise.reject(new Error("boom")) : Promise.resolve(["ok"])))
		render(app(client, <Todos queryFn={queryFn} />))
		await flush()
		expect(screen.getByText("failed: boom")).toBeTruthy()
		expect(queryFn).toHaveBeenCalledTimes(1) // the error is shown, not retried in a loop

		fail = false
		await act(async () => {
			await client.invalidateQueries({ queryKey: ["todos"] })
			screen.getByText("reset").click()
		})
		await flush()
		expect(screen.getByText("ok")).toBeTruthy()
		expect(queryFn).toHaveBeenCalledTimes(2)
		spy.mockRestore()
	})

	it("suspends again when the key changes", async () => {
		const client = newClient()
		function Item({ id }: { id: number }) {
			const q = useSuspenseQuery({ queryKey: ["item", id], queryFn: () => Promise.resolve(`item-${id}`), retry: false })
			return <p>{q.data}</p>
		}
		const { rerender } = render(app(client, <Item id={1} />))
		await flush()
		expect(screen.getByText("item-1")).toBeTruthy()
		rerender(app(client, <Item id={2} />))
		await flush()
		expect(screen.getByText("item-2")).toBeTruthy()
	})
})

describe("useSuspenseQuery with streaming SSR", () => {
	it.each([
		["browser clock close to the server's: data stays fresh, no refetch", 1500, true],
		["browser clock far ahead: hydrates cleanly, then refetches the (by its clock) old data", 900_000, false],
	])("the server waits for the data and the browser hydrates it without a mismatch (%s)", async (_name, browserClock, staysFresh) => {
		// Server: React streams HTML once every suspended component has its data.
		const server = newClient(1000)
		const queryFn = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 10))
			return ["from-server"]
		})
		const stream = await renderToReadableStream(app(server, <Todos queryFn={queryFn} staleTime={5000} />))
		await stream.allReady
		const html = await new Response(stream).text()
		expect(html).toContain("from-server")
		expect(queryFn).toHaveBeenCalledTimes(1)
		const state = JSON.parse(JSON.stringify(dehydrate(server)))

		// Browser: hydrate the cache first, then the page; the browser clock is far ahead of the server's.
		const browser = newClient(browserClock)
		const browserFn = vi.fn(() => Promise.resolve(["from-browser"]))
		const container = document.createElement("div")
		container.innerHTML = html
		document.body.append(container)
		// React's own dev warnings about running the server and client renderers in one process
		// ("multiple renderers ... same context") are an artefact of this test, not a mismatch.
		const errors: unknown[] = []
		const consoleError = vi.spyOn(console, "error").mockImplementation((...a) => {
			if (/hydrat|did not match|mismatch/i.test(String(a[0]))) errors.push(a)
		})
		await act(async () => {
			hydrateRoot(
				container,
				<QueryProvider client={browser}>
					<HydrationBoundary state={state}>
						<Suspense fallback={<p>loading</p>}>
							<Todos queryFn={browserFn} staleTime={5000} />
						</Suspense>
					</HydrationBoundary>
				</QueryProvider>,
				{ onRecoverableError: (e) => errors.push(e) },
			)
		})
		consoleError.mockRestore()
		expect(errors).toEqual([]) // the first client render matched the server markup either way
		expect(container.querySelectorAll("li")).toHaveLength(1)
		if (staysFresh) {
			expect(container.textContent).toContain("from-server")
			expect(browserFn).not.toHaveBeenCalled()
		} else {
			expect(browserFn).toHaveBeenCalledTimes(1) // stale on the browser's clock: refetched after mounting
		}
		container.remove()
	})
})
