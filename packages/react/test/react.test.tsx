import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "@unicore/query"
import { act, render, renderHook, screen } from "@testing-library/react"
import { createElement, StrictMode, type ReactNode } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { createStore } from "@unicore/store"
import { QueryProvider, useQuery, useQueryClient, useStore } from "../src"

const newClient = () => new QueryClient({ scheduler: new FakeScheduler() })
const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))))

describe("QueryProvider", () => {
	it("throws a helpful error without a provider", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {})
		expect(() => renderHook(() => useQueryClient())).toThrow(/QueryProvider/)
		spy.mockRestore()
	})

	it("provides the client", () => {
		const client = newClient()
		const { result } = renderHook(() => useQueryClient(), {
			wrapper: ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children),
		})
		expect(result.current).toBe(client)
	})
})

describe("useQuery in components", () => {
	function Todos({ fn }: { fn: () => Promise<string[]> }) {
		const q = useQuery({ queryKey: ["todos"], queryFn: fn })
		if (q.status === "loading") return <p>loading</p>
		return <ul>{q.data?.map((t) => <li key={t}>{t}</li>)}</ul>
	}

	it("renders loading on the very first render, then the data", async () => {
		const client = newClient()
		const fn = vi.fn(() => Promise.resolve(["a", "b"]))
		render(
			<QueryProvider client={client}>
				<Todos fn={fn} />
			</QueryProvider>,
		)
		expect(screen.getByText("loading")).toBeTruthy()
		await flush()
		expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["a", "b"])
	})

	it("under StrictMode (double mount) still sends one request", async () => {
		const client = newClient()
		const fn = vi.fn(() => Promise.resolve(["a"]))
		render(
			<StrictMode>
				<QueryProvider client={client}>
					<Todos fn={fn} />
				</QueryProvider>
			</StrictMode>,
		)
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
		expect(screen.getByText("a")).toBeTruthy()
	})

	it("renders the loading state on the server without fetching", () => {
		const client = newClient()
		const fn = vi.fn(() => Promise.resolve(["a"]))
		const html = renderToString(
			<QueryProvider client={client}>
				<Todos fn={fn} />
			</QueryProvider>,
		)
		expect(html).toContain("loading")
		expect(fn).not.toHaveBeenCalled()
	})

	it("uses the latest queryFn without refetching when only the function changes", async () => {
		const client = newClient()
		const first = vi.fn(() => Promise.resolve(1))
		const second = vi.fn(() => Promise.resolve(2))
		const { result, rerender } = renderHook(
			({ fn }: { fn: () => Promise<number> }) => useQuery({ queryKey: ["k"], queryFn: fn, staleTime: Infinity }),
			{
				wrapper: ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children),
				initialProps: { fn: first },
			},
		)
		await flush()
		rerender({ fn: second })
		await act(async () => void (await result.current.refetch()))
		expect(first).toHaveBeenCalledTimes(1)
		expect(second).toHaveBeenCalledTimes(1)
		expect(result.current.data).toBe(2)
	})

	it("returns a stable result object between unrelated renders", async () => {
		const client = newClient()
		const { result, rerender } = renderHook(
			() => useQuery({ queryKey: ["k"], queryFn: () => Promise.resolve(1), staleTime: Infinity }),
			{ wrapper: ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children) },
		)
		await flush()
		const before = result.current
		rerender()
		expect(result.current).toBe(before)
	})
})

describe("useStore", () => {
	function Count({ store }: { store: ReturnType<typeof createStore<{ n: number }>> }) {
		const state = useStore(store) // no selector: the whole state
		return <p>{`n=${state.n}`}</p>
	}

	it("renders the whole state without a selector, and the server snapshot (initial state) during SSR", () => {
		const store = createStore({ n: 1 })
		store.setState({ n: 2 })
		expect(renderToString(<Count store={store} />)).toContain("n=1") // what the server rendered
		render(<Count store={store} />)
		expect(screen.getByText("n=2")).toBeTruthy() // the live state on the client
	})
})
