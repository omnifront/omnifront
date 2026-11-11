import type { Signal } from "@angular/core"
import { createStore } from "@omnifront/store"
import { describe, expect, expectTypeOf, it } from "vitest"
import { injectMutation, injectQuery, injectStore } from "../src"
import { injectInfiniteQuery } from "../src/infinite"
import { injectQueries } from "../src/queries"

function injectables() {
	const q = injectQuery({ queryKey: ["k"], queryFn: async () => 42 })
	expectTypeOf(q.data).toEqualTypeOf<Signal<number | undefined>>()
	expectTypeOf(q.status()).toEqualTypeOf<"idle" | "loading" | "success" | "error">()

	// select: the data is what it returns, also for infinite queries and lists of queries.
	const selected = injectQuery({ queryKey: ["k"], queryFn: async () => ["a", "b"], select: (list: string[]) => list.length })
	expectTypeOf(selected.data).toEqualTypeOf<Signal<number | undefined>>()
	const infinite = injectInfiniteQuery({
		queryKey: ["p"],
		queryFn: async ({ pageParam }: { pageParam: number }) => [pageParam],
		initialPageParam: 0,
		getNextPageParam: () => undefined,
		select: (data) => data.pages.flat(),
	})
	expectTypeOf(infinite.data).toEqualTypeOf<Signal<number[] | undefined>>()
	const plainList = injectQueries([{ queryKey: ["a"], queryFn: async () => "x" }])
	expectTypeOf(plainList()[0]!.data).toEqualTypeOf<string | undefined>()
	const selectedList = injectQueries([{ queryKey: ["a"], queryFn: async () => ["x", "y"], select: (list: string[]) => list.length }])
	expectTypeOf(selectedList()[0]!.data).toEqualTypeOf<number | undefined>()

	const m = injectMutation({ mutationFn: (s: string) => Promise.resolve(s.length) })
	expectTypeOf(m.data).toEqualTypeOf<Signal<number | undefined>>()
	m.mutate("x")
	// @ts-expect-error variables must be a string
	m.mutate(1)

	const store = createStore({ count: 0 })
	expectTypeOf(injectStore(store, (s) => s.count)).toEqualTypeOf<Signal<number>>()
}

describe("angular types", () => {
	it("compiles", () => {
		expect(typeof injectables).toBe("function")
	})
})
