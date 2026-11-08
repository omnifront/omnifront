// Type-level tests: they cost nothing at runtime, but `tsc --noEmit` (pnpm typecheck) fails if
// inference regresses. Each @ts-expect-error line must stay an error.
import { describe, expect, expectTypeOf, it } from "vitest"
import { Mutation, QueryClient, QueryObserver, type QueryResult } from "../src"

const client = new QueryClient()

describe("query types", () => {
	it("infers TData from queryFn", () => {
		const o = new QueryObserver(client, { queryKey: ["n"], queryFn: async () => 1 })
		expectTypeOf(o).toEqualTypeOf<QueryObserver<number>>()
		expectTypeOf(o.getSnapshot().data).toEqualTypeOf<number | undefined>()
		expectTypeOf(o.getSnapshot()).toEqualTypeOf<QueryResult<number>>()
		expectTypeOf(o.refetch).returns.resolves.toEqualTypeOf<number>()
		expectTypeOf(client.fetchQuery(["k"], () => Promise.resolve("s"))).toEqualTypeOf<Promise<string>>()
		expect(true).toBe(true)
	})

	it("queryFn receives an AbortSignal", () => {
		new QueryObserver(client, {
			queryKey: ["n"],
			queryFn: ({ signal }) => {
				expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
				return Promise.resolve(1)
			},
		})
	})

	it("status and flags have precise types", () => {
		const r = {} as QueryResult<string>
		expectTypeOf(r.status).toEqualTypeOf<"idle" | "loading" | "success" | "error">()
		expectTypeOf(r.isFetching).toEqualTypeOf<boolean>()
		expectTypeOf(r.isStale).toEqualTypeOf<boolean>()
		expectTypeOf(r.failureCount).toEqualTypeOf<number>()
		expectTypeOf(r.dataUpdatedAt).toEqualTypeOf<number | undefined>()
	})

	it("rejects invalid options", () => {
		// @ts-expect-error queryKey must be an array
		new QueryObserver(client, { queryKey: "todos", queryFn: () => Promise.resolve(1) })
		// @ts-expect-error queryFn must return a promise
		new QueryObserver(client, { queryKey: ["k"], queryFn: () => 1 })
		// @ts-expect-error staleTime is a number
		new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1), staleTime: "5s" })
		new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1), retry: (n, e) => n < 2 && e !== null })
	})

	it("infers Mutation data and variables from mutationFn", () => {
		const m = new Mutation({ mutationFn: (n: number) => Promise.resolve(String(n)) })
		expectTypeOf(m).toEqualTypeOf<Mutation<string, number>>()
		expectTypeOf(m.mutateAsync).parameter(0).toEqualTypeOf<number>()
		expectTypeOf(m.mutateAsync).returns.resolves.toEqualTypeOf<string>()
		expectTypeOf(m.getSnapshot().variables).toEqualTypeOf<number | undefined>()
		// @ts-expect-error variables must be a number
		m.mutate("1")
	})

	it("a mutation without variables is called with no arguments", () => {
		const m = new Mutation({ mutationFn: () => Promise.resolve(1) })
		m.mutate()
		expectTypeOf(m).toEqualTypeOf<Mutation<number, void>>()
	})

	it("callbacks get typed data and variables", () => {
		new Mutation({
			mutationFn: (id: string) => Promise.resolve({ id }),
			onSuccess: (data, variables) => {
				expectTypeOf(data).toEqualTypeOf<{ id: string }>()
				expectTypeOf(variables).toEqualTypeOf<string>()
			},
			onSettled: (data) => {
				expectTypeOf(data).toEqualTypeOf<{ id: string } | undefined>()
			},
		})
	})
})
