import { createStore } from "@unicore/store"
import { describe, expect, expectTypeOf, it } from "vitest"
import type { ComputedRef } from "vue"
import { useMutation, useQuery, useStore } from "../src"

function composables() {
	const q = useQuery(() => ({ queryKey: ["k"], queryFn: async () => ["a"] }))
	expectTypeOf(q.data).toEqualTypeOf<ComputedRef<string[] | undefined>>()
	expectTypeOf(q.isFetching).toEqualTypeOf<ComputedRef<boolean>>()

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
