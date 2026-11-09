import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { act, renderHook } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { QueryProvider, useMutation } from "../src"
import { useIsFetching, useIsMutating } from "../src/activity"

const newClient = () => new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
const providerFor = (client: QueryClient) => ({ children }: { children: ReactNode }) =>
	createElement(QueryProvider, { client }, children)
const hang = () => new Promise<string>(() => {})

describe("useIsFetching", () => {
	it("takes an inline filter without re-subscribing on every render, and follows a changed one", async () => {
		const client = newClient()
		const onChange = vi.spyOn(client, "onChange")
		const { result, rerender } = renderHook(({ key }: { key: string }) => useIsFetching({ queryKey: [key] }), {
			wrapper: providerFor(client),
			initialProps: { key: "a" },
		})
		rerender({ key: "a" }) // new filter object, same value
		rerender({ key: "a" })
		expect(onChange).toHaveBeenCalledTimes(1)

		await act(async () => void client.fetchQuery(["a"], hang))
		await act(async () => void client.fetchQuery(["b"], hang))
		expect(result.current).toBe(1)
		rerender({ key: "b" })
		expect(result.current).toBe(1)
		rerender({ key: "c" })
		expect(result.current).toBe(0)
	})

	it("renders 0 on the server, even with a fetch in flight", () => {
		const client = newClient()
		void client.fetchQuery(["a"], hang)
		const Probe = () => createElement("span", null, `${useIsFetching()}/${useIsMutating()}`)
		expect(renderToString(createElement(QueryProvider, { client }, createElement(Probe)))).toContain("0/0")
	})
})

describe("useMutation without a provider", () => {
	it("still works; it just has no client to count towards", async () => {
		const { result } = renderHook(() => useMutation({ mutationFn: (n: number) => Promise.resolve(n * 2) }))
		let out = 0
		await act(async () => {
			out = await result.current.mutateAsync(4)
		})
		expect(out).toBe(8)
	})
})

describe("useIsMutating", () => {
	it("counts mutations under the same provider", async () => {
		const client = newClient()
		let release!: () => void
		const wrapper = providerFor(client)
		const { result } = renderHook(
			() => ({
				mutating: useIsMutating(),
				mutation: useMutation({ mutationFn: () => new Promise<void>((r) => (release = r)) }),
			}),
			{ wrapper },
		)
		expect(result.current.mutating).toBe(0)
		await act(async () => result.current.mutation.mutate())
		expect(result.current.mutating).toBe(1)
		await act(async () => release())
		expect(result.current.mutating).toBe(0)
	})
})
