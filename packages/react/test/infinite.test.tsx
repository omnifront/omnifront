import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "@unicore/query"
import { act, renderHook } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { QueryProvider } from "../src"
import { useInfiniteQuery } from "../src/infinite"

const client = () => new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })

describe("useInfiniteQuery", () => {
	it("loads previous pages, refetches everything, and keeps stable helpers", async () => {
		const c = client()
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client: c }, children)
		const { result } = renderHook(
			() =>
				useInfiniteQuery<number, number>({
					queryKey: ["n"],
					queryFn: ({ pageParam }) => Promise.resolve(pageParam),
					initialPageParam: 2,
					getNextPageParam: (last) => (last < 3 ? last + 1 : undefined),
					getPreviousPageParam: (first) => (first > 1 ? first - 1 : undefined),
					staleTime: Infinity,
					retry: false,
				}),
			{ wrapper },
		)
		await act(async () => void (await new Promise((r) => setTimeout(r, 0))))
		expect(result.current.data?.pages).toEqual([2])
		await act(async () => result.current.fetchPreviousPage())
		await act(async () => result.current.fetchNextPage())
		expect(result.current.data?.pages).toEqual([1, 2, 3])
		await act(async () => void (await result.current.refetch()))
		expect(result.current.data?.pageParams).toEqual([1, 2, 3])
	})
})
