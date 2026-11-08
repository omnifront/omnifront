import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { describe, expect, it } from "vitest"
import { provideOmnifront } from "../src"
import { injectInfiniteQuery } from "../src/infinite"
import { mountInjectable } from "./mount"

describe("injectInfiniteQuery", () => {
	it("accepts plain options, loads previous pages and refetches everything", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		const { result: r, unmount } = mountInjectable(
			() =>
				injectInfiniteQuery<number, number>({
					queryKey: ["n"],
					queryFn: ({ pageParam }) => Promise.resolve(pageParam),
					initialPageParam: 2,
					getNextPageParam: (last) => (last < 3 ? last + 1 : undefined),
					getPreviousPageParam: (first) => (first > 1 ? first - 1 : undefined),
					staleTime: Infinity,
					retry: false,
				}),
			[provideOmnifront(client)],
		)
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(r.data()?.pages).toEqual([2])
		await r.fetchPreviousPage()
		await r.fetchNextPage()
		expect(r.data()?.pages).toEqual([1, 2, 3])
		expect([r.hasPreviousPage(), r.hasNextPage(), r.status(), r.error(), r.isStale(), r.isFetchingPreviousPage()]).toEqual([false, false, "success", undefined, false, false])
		await r.refetch()
		expect(r.data()?.pageParams).toEqual([1, 2, 3])
		unmount()
	})
})
