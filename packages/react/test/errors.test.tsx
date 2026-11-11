import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { act, render, screen } from "@testing-library/react"
import { Component, createElement, type ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { QueryProvider, useQuery } from "../src"
import { QueryErrorResetBoundary, useQueryErrorResetBoundary } from "../src/errors"
import { usePrefetchQuery, useSuspenseQuery } from "../src/suspense"
import { useSuspenseQueries } from "../src/queries"
import { Suspense } from "react"

class Boundary extends Component<{ onReset?: (() => void) | undefined; children?: ReactNode }, { error: Error | undefined }> {
	override state: { error: Error | undefined } = { error: undefined }
	static getDerivedStateFromError(error: Error) {
		return { error }
	}
	override render() {
		const { error } = this.state
		if (!error) return this.props.children
		return createElement("button", { onClick: () => { this.props.onReset?.(); this.setState({ error: undefined }) } }, `failed: ${error.message}`)
	}
}

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))))

describe("throwOnError and QueryErrorResetBoundary", () => {
	it("throws a settled failure to the boundary, and reset loads the query again", async () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {})
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		let fail = true
		const queryFn = vi.fn(() => (fail ? Promise.reject(new Error("boom")) : Promise.resolve("fine")))
		function Page() {
			const q = useQuery({ queryKey: ["x"], queryFn, retry: false, throwOnError: true })
			return createElement("p", null, q.data ?? "loading")
		}
		render(
			createElement(QueryProvider, { client }, createElement(QueryErrorResetBoundary, { children: ({ reset }) => createElement(Boundary, { onReset: reset }, createElement(Page)) })),
		)
		await settle()
		expect(screen.getByRole("button").textContent).toBe("failed: boom")

		fail = false
		await act(async () => screen.getByRole("button").click())
		await settle()
		expect(screen.getByText("fine")).toBeTruthy()
		error.mockRestore()
	})

	it("a function decides which errors throw; others stay in the result", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		function Page() {
			const q = useQuery({ queryKey: ["y"], queryFn: () => Promise.reject(new Error("minor")), retry: false, throwOnError: (e: Error) => e.message === "major" })
			return createElement("p", null, q.isError ? `kept: ${q.error?.message}` : "loading")
		}
		render(createElement(QueryProvider, { client }, createElement(Boundary, null, createElement(Page))))
		await settle()
		expect(screen.getByText("kept: minor")).toBeTruthy()
	})

	it("reset also lets a suspense query that failed load again", async () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {})
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		let fail = true
		function Page() {
			const q = useSuspenseQuery({ queryKey: ["z"], queryFn: () => (fail ? Promise.reject(new Error("nope")) : Promise.resolve("back")), retry: false })
			return createElement("p", null, q.data)
		}
		function Reset({ children }: { children?: ReactNode }) {
			const { reset } = useQueryErrorResetBoundary()
			return createElement(Boundary, { onReset: reset }, children)
		}
		render(createElement(QueryProvider, { client }, createElement(Reset, null, createElement(Suspense, { fallback: "…" }, createElement(Page)))))
		await settle()
		expect(screen.getByRole("button").textContent).toBe("failed: nope")
		fail = false
		await act(async () => screen.getByRole("button").click())
		await settle()
		expect(screen.getByText("back")).toBeTruthy()
		error.mockRestore()
	})

	it("useSuspenseQueries loads all queries in parallel, then renders with every data defined", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		const started: string[] = []
		const load = <T,>(name: string, value: T) => (): Promise<T> => {
			started.push(name)
			return new Promise<T>((r) => setTimeout(() => r(value), 0))
		}
		function Page() {
			const [a, b] = useSuspenseQueries({
				queries: [
					{ queryKey: ["a"], queryFn: load("a", 1) },
					{ queryKey: ["b"], queryFn: load("b", "two") },
				],
			})
			const n: number = a.data
			const t: string = b.data
			return createElement("p", null, `${n}-${t}`)
		}
		render(createElement(QueryProvider, { client }, createElement(Suspense, { fallback: "…" }, createElement(Page))))
		expect(started).toEqual(["a", "b"]) // both started before either finished
		await settle()
		await settle()
		expect(screen.getByText("1-two")).toBeTruthy()
	})

	it("useSuspenseQueries takes combine and throws a failure to the boundary", async () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {})
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		function Sum() {
			const total = useSuspenseQueries({
				queries: [{ queryKey: ["s1"], queryFn: () => Promise.resolve(1) }, { queryKey: ["s2"], queryFn: () => Promise.resolve(2) }],
				combine: (rs) => rs.reduce((n, r) => n + (r.data as number), 0),
			})
			return createElement("p", null, `sum ${total}`)
		}
		function Bad() {
			useSuspenseQueries({ queries: [{ queryKey: ["bad"], queryFn: () => Promise.reject(new Error("bad one")), retry: false }] })
			return null
		}
		render(createElement(QueryProvider, { client }, createElement(Suspense, { fallback: "…" }, createElement(Sum))))
		await settle()
		await settle()
		expect(screen.getByText("sum 3")).toBeTruthy()
		render(createElement(QueryProvider, { client }, createElement(Boundary, null, createElement(Suspense, { fallback: "…" }, createElement(Bad)))))
		await settle()
		await settle()
		expect(screen.getByText("failed: bad one")).toBeTruthy()
		error.mockRestore()
	})

	it("usePrefetchQuery starts the request once, before the suspending child runs", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		const queryFn = vi.fn(() => Promise.resolve("loaded"))
		const options = { queryKey: ["p"], queryFn }
		function Child() {
			const q = useSuspenseQuery(options)
			return createElement("p", null, q.data)
		}
		function Parent() {
			usePrefetchQuery(options)
			return createElement(Suspense, { fallback: "…" }, createElement(Child))
		}
		const { rerender } = render(createElement(QueryProvider, { client }, createElement(Parent)))
		rerender(createElement(QueryProvider, { client }, createElement(Parent)))
		await settle()
		expect(screen.getByText("loaded")).toBeTruthy()
		expect(queryFn).toHaveBeenCalledTimes(1)
	})
})
