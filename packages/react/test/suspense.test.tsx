import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { dehydrate } from "@omnifront/query/hydration"
import { act, render, screen } from "@testing-library/react"
import { Component, Suspense, type ReactNode } from "react"
import { hydrateRoot } from "react-dom/client"
import * as server from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HydrationBoundary, QueryProvider } from "../src"
import { useSuspenseInfiniteQuery, useSuspenseQuery } from "../src/suspense"

const newClient = (clock = 0) => {
	const scheduler = new FakeScheduler()
	scheduler.advance(clock)
	return new QueryClient({ scheduler, gcTime: Infinity })
}
/** Render with streaming SSR and return the HTML once every suspended component has its data. */
async function renderStreaming(ui: ReactNode): Promise<string> {
	const api = server as unknown as {
		renderToReadableStream?: (ui: ReactNode) => Promise<ReadableStream & { allReady: Promise<void> }>
		renderToPipeableStream?: (ui: ReactNode, options: { onAllReady(): void; onError(error: unknown): void }) => { pipe(stream: NodeJS.WritableStream): void }
	}
	if (api.renderToReadableStream) {
		const stream = await api.renderToReadableStream(ui)
		await stream.allReady
		return new Response(stream).text()
	}
	// React 18's Node build has the pipeable variant only.
	const { PassThrough } = await import("node:stream")
	return new Promise<string>((resolve, reject) => {
		const chunks: Buffer[] = []
		const out = new PassThrough()
		out.on("data", (chunk: Buffer) => chunks.push(chunk))
		out.on("end", () => resolve(Buffer.concat(chunks).toString()))
		const { pipe } = api.renderToPipeableStream!(ui, { onAllReady: () => pipe(out), onError: reject })
	})
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

	it("exposes refetch on the result", async () => {
		const client = newClient()
		let n = 0
		let reload: (() => Promise<unknown>) | undefined
		function Counter() {
			const q = useSuspenseQuery({ queryKey: ["n"], queryFn: () => Promise.resolve(++n), retry: false })
			reload = q.refetch
			return <p>{`n=${q.data}`}</p>
		}
		render(app(client, <Counter />))
		await flush()
		await act(async () => void (await reload?.()))
		expect(screen.getByText("n=2")).toBeTruthy()
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
		const serverClient = newClient(1000)
		const queryFn = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 10))
			return ["from-server"]
		})
		const html = await renderStreaming(app(serverClient, <Todos queryFn={queryFn} staleTime={5000} />))
		expect(html).toContain("from-server")
		expect(queryFn).toHaveBeenCalledTimes(1)
		const state = JSON.parse(JSON.stringify(dehydrate(serverClient)))

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

describe("useSuspenseInfiniteQuery", () => {
	it("suspends for the first page, then loads more without suspending again", async () => {
		const client = newClient()
		let more: (() => Promise<void>) | undefined
		let rest: { previous: () => Promise<void>; reload: () => Promise<unknown> } | undefined
		function Feed() {
			const feed = useSuspenseInfiniteQuery<number, number>({
				queryKey: ["feed"],
				queryFn: ({ pageParam }) => Promise.resolve(pageParam),
				initialPageParam: 1,
				getNextPageParam: (last) => (last < 3 ? last + 1 : undefined),
				retry: false,
			})
			more = feed.fetchNextPage
			rest = { previous: feed.fetchPreviousPage, reload: feed.refetch }
			return <p>{feed.data.pages.join(",")}</p>
		}
		render(app(client, <Feed />))
		expect(screen.getByText("loading")).toBeTruthy()
		await flush()
		expect(screen.getByText("1")).toBeTruthy()
		await act(async () => void (await more?.()))
		expect(screen.getByText("1,2")).toBeTruthy()
		await act(async () => void (await rest?.previous())) // no previous cursor configured: a no-op
		await act(async () => void (await rest?.reload()))
		expect(screen.getByText("1,2")).toBeTruthy()
	})

	it("throws a failure to the error boundary", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {})
		function Feed() {
			useSuspenseInfiniteQuery<number, number>({
				queryKey: ["bad-feed"],
				queryFn: () => Promise.reject(new Error("nope")),
				initialPageParam: 1,
				getNextPageParam: () => undefined,
				retry: false,
			})
			return null
		}
		render(app(newClient(), <Feed />))
		await flush()
		expect(screen.getByText("failed: nope")).toBeTruthy()
		spy.mockRestore()
	})
})
