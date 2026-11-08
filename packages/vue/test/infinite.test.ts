import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { describe, expect, it } from "vitest"
import { useInfiniteQuery } from "../src/infinite"
import { mountComposable } from "./mount"

describe("useInfiniteQuery", () => {
	it("loads previous pages and refetches everything", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		const { result: r, unmount } = mountComposable(
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
			client,
		)
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(r.data.value?.pages).toEqual([2])
		await r.fetchPreviousPage()
		await r.fetchNextPage()
		expect(r.data.value?.pages).toEqual([1, 2, 3])
		expect(r.hasPreviousPage.value).toBe(false)
		expect(r.hasNextPage.value).toBe(false)
		await r.refetch()
		expect(r.data.value?.pageParams).toEqual([1, 2, 3])
		expect([r.status.value, r.error.value, r.isStale.value, r.isFetchingPreviousPage.value]).toEqual(["success", undefined, false, false])
		unmount()
	})
})
