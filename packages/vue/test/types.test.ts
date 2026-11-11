import { createStore } from "@omnifront/store"
import { describe, expect, expectTypeOf, it } from "vitest"
import type { ComputedRef } from "vue"
import { useMutation, useQuery, useStore } from "../src"
import { useInfiniteQuery } from "../src/infinite"
import { useQueries } from "../src/queries"

function composables() {
	const q = useQuery(() => ({ queryKey: ["k"], queryFn: async () => ["a"] }))
	expectTypeOf(q.data).toEqualTypeOf<ComputedRef<string[] | undefined>>()
	expectTypeOf(q.isFetching).toEqualTypeOf<ComputedRef<boolean>>()

	// select: the data is what it returns, also for infinite queries and lists of queries.
	const selected = useQuery(() => ({ queryKey: ["k"], queryFn: async () => ["a", "b"], select: (list: string[]) => list.length }))
	expectTypeOf(selected.data).toEqualTypeOf<ComputedRef<number | undefined>>()
	const infinite = useInfiniteQuery(() => ({
		queryKey: ["p"],
		queryFn: async ({ pageParam }: { pageParam: number }) => [pageParam],
		initialPageParam: 0,
		getNextPageParam: () => undefined,
		select: (data) => data.pages.flat(),
	}))
	expectTypeOf(infinite.data).toEqualTypeOf<ComputedRef<number[] | undefined>>()
	const plainList = useQueries([{ queryKey: ["a"], queryFn: async () => "x" }])
	expectTypeOf(plainList.value[0]!.data).toEqualTypeOf<string | undefined>()
	const selectedList = useQueries([{ queryKey: ["a"], queryFn: async () => ["x", "y"], select: (list: string[]) => list.length }])
	expectTypeOf(selectedList.value[0]!.data).toEqualTypeOf<number | undefined>()

	const m = useMutation({ mutationFn: (n: number) => Promise.resolve(`${n}`) })
	expectTypeOf(m.data).toEqualTypeOf<ComputedRef<string | undefined>>()
	m.mutate(1)
	// @ts-expect-error variables must be a number
	m.mutate("1")

	const store = createStore({ count: 0 })
	expectTypeOf(useStore(store, (s) => s.count)).toEqualTypeOf<ComputedRef<number>>()
}

describe("vue types", () => {
	it("compiles", () => {
		expect(typeof composables).toBe("function")
	})
})
