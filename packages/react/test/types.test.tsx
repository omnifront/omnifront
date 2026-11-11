import { createStore } from "@omnifront/store"
import { describe, expect, expectTypeOf, it } from "vitest"
import { useMutation, useQuery, useStore, type UseMutationResult, type UseQueryResult } from "../src"
import { useInfiniteQuery, type InfiniteData } from "../src/infinite"
import { useQueries } from "../src/queries"

// Never called: only type-checked.
function hooks() {
	const q = useQuery({ queryKey: ["k"], queryFn: async () => ({ id: 1 }) })
	expectTypeOf(q).toEqualTypeOf<UseQueryResult<{ id: number }>>()
	expectTypeOf(q.data).toEqualTypeOf<{ id: number } | undefined>()
	expectTypeOf(q.refetch).returns.resolves.toEqualTypeOf<{ id: number }>()

	const m = useMutation({ mutationFn: (title: string) => Promise.resolve(title.length) })
	expectTypeOf(m).toEqualTypeOf<UseMutationResult<number, Error, string>>()
	m.mutate("x")
	// @ts-expect-error variables must be a string
	m.mutate(1)

	// Errors are `Error` unless named: second type argument, as in TanStack Query.
	expectTypeOf(q.error).toEqualTypeOf<Error | undefined>()
	expectTypeOf(m.error).toEqualTypeOf<Error | undefined>()
	class HttpError extends Error {
		status = 500
	}
	const typedQuery = useQuery<number, HttpError>({ queryKey: ["e"], queryFn: async () => 1, retry: (_n, e) => e.status >= 500 })
	expectTypeOf(typedQuery.error).toEqualTypeOf<HttpError | undefined>()
	const typedMutation = useMutation<number, HttpError, string>({
		mutationFn: (title) => Promise.resolve(title.length),
		onError: (error) => expectTypeOf(error).toEqualTypeOf<HttpError>(),
	})
	expectTypeOf(typedMutation.error).toEqualTypeOf<HttpError | undefined>()

	// select changes the type of `data` and of what `refetch` resolves with; the query function's type stays.
	const selected = useQuery({ queryKey: ["k"], queryFn: async () => ({ id: 1 }), select: (row) => String(row.id) })
	expectTypeOf(selected.data).toEqualTypeOf<string | undefined>()
	expectTypeOf(selected.refetch).returns.resolves.toEqualTypeOf<string>()
	expectTypeOf(selected.isPending).toEqualTypeOf<boolean>()
	expectTypeOf(selected.failureReason).toEqualTypeOf<Error | undefined>()
	// @ts-expect-error select receives the query function's data
	useQuery({ queryKey: ["k"], queryFn: async () => 1, select: (n: string) => n })

	const store = createStore({ count: 0, name: "a" })
	expectTypeOf(useStore(store)).toEqualTypeOf<{ count: number; name: string }>()
	expectTypeOf(useStore(store, (s) => s.count)).toEqualTypeOf<number>()
	// @ts-expect-error the selector must read existing fields
	useStore(store, (s) => s.nope)

	const queries = [
		{ queryKey: ["n"], queryFn: async () => 1 },
		{ queryKey: ["s"], queryFn: async () => "x" },
	] as const
	// select in a tuple: the result carries the selected type, whatever the query function returns.
	const [count, label] = useQueries([
		{ queryKey: ["c"], queryFn: async () => [1, 2, 3], select: (list: number[]) => list.length },
		{ queryKey: ["l"], queryFn: async () => "x" },
	])
	expectTypeOf(count.data).toEqualTypeOf<number | undefined>()
	expectTypeOf(label.data).toEqualTypeOf<string | undefined>()

	const pages = useInfiniteQuery({
		queryKey: ["p"],
		queryFn: async ({ pageParam }: { pageParam: number }) => [pageParam],
		initialPageParam: 0,
		getNextPageParam: () => undefined,
		select: (data) => data.pages.flat(),
	})
	expectTypeOf(pages.data).toEqualTypeOf<number[] | undefined>()
	expectTypeOf(pages.refetch).returns.resolves.toEqualTypeOf<number[]>()
	const plain = useInfiniteQuery({
		queryKey: ["p"],
		queryFn: async ({ pageParam }: { pageParam: number }) => [pageParam],
		initialPageParam: 0,
		getNextPageParam: () => undefined,
	})
	expectTypeOf(plain.data).toEqualTypeOf<InfiniteData<number[], number> | undefined>()

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
