import { createStore } from "@omnifront/store"
import { describe, expect, expectTypeOf, it } from "vitest"
import { useMutation, useQuery, useStore, type UseMutationResult, type UseQueryResult } from "../src"
import { useQueries } from "../src/queries"

// Never called: only type-checked.
function hooks() {
	const q = useQuery({ queryKey: ["k"], queryFn: async () => ({ id: 1 }) })
	expectTypeOf(q).toEqualTypeOf<UseQueryResult<{ id: number }>>()
	expectTypeOf(q.data).toEqualTypeOf<{ id: number } | undefined>()
	expectTypeOf(q.refetch).returns.resolves.toEqualTypeOf<{ id: number }>()

	const m = useMutation({ mutationFn: (title: string) => Promise.resolve(title.length) })
	expectTypeOf(m).toEqualTypeOf<UseMutationResult<number, string>>()
	m.mutate("x")
	// @ts-expect-error variables must be a string
	m.mutate(1)

	const store = createStore({ count: 0, name: "a" })
	expectTypeOf(useStore(store)).toEqualTypeOf<{ count: number; name: string }>()
	expectTypeOf(useStore(store, (s) => s.count)).toEqualTypeOf<number>()
	// @ts-expect-error the selector must read existing fields
	useStore(store, (s) => s.nope)

	const queries = [
		{ queryKey: ["n"], queryFn: async () => 1 },
		{ queryKey: ["s"], queryFn: async () => "x" },
	] as const
	const [n, s] = useQueries([queries[0], queries[1]])
	expectTypeOf(n.data).toEqualTypeOf<number | undefined>()
	expectTypeOf(s.data).toEqualTypeOf<string | undefined>()
	// With `combine` the hook returns what combine returns, and combine sees each query's own data type.
	const summary = useQueries([queries[0], queries[1]], {
		combine: ([a, b]) => {
			expectTypeOf(a.data).toEqualTypeOf<number | undefined>()
			expectTypeOf(b.data).toEqualTypeOf<string | undefined>()
			return { loading: a.status === "loading" || b.status === "loading", label: `${a.data}-${b.data}` }
		},
	})
	expectTypeOf(summary).toEqualTypeOf<{ loading: boolean; label: string }>()
}

describe("react types", () => {
	it("compiles", () => {
		expect(typeof hooks).toBe("function")
	})
})
