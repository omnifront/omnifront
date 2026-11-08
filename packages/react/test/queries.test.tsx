import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "@unicore/query"
import { act, renderHook } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { QueryProvider } from "../src"
import { useQueries } from "../src/queries"

describe("useQueries", () => {
	it("keeps each result's own data type in a tuple, and refetches one query on demand", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		let n = 0
		const { result } = renderHook(
			() =>
				useQueries([
					{ queryKey: ["n"], queryFn: () => Promise.resolve(++n), staleTime: Infinity },
					{ queryKey: ["s"], queryFn: () => Promise.resolve("text"), staleTime: Infinity },
				]),
			{ wrapper },
		)
		await act(async () => void (await new Promise((r) => setTimeout(r, 0))))
		const [num, str] = result.current
		const asNumber: number | undefined = num.data
		const asString: string | undefined = str.data
		expect([asNumber, asString]).toEqual([1, "text"])
		await act(async () => void (await num.refetch()))
		expect(result.current[0].data).toBe(2)
	})
})
