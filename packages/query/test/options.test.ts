import { describe, expect, expectTypeOf, it } from "vitest"
import { mutationOptions, queryOptions } from "../src/options"
import { Mutation, QueryClient, QueryObserver, type QueryState } from "../src"

interface Todo {
	id: number
}

describe("queryOptions", () => {
	it("returns the same object and types the cache through its key", () => {
		const client = new QueryClient()
		const input = { queryKey: ["todos", { done: false }] as const, queryFn: () => Promise.resolve<Todo[]>([]), staleTime: 5 }
		const todos = queryOptions(input)
		expect(todos).toBe(input)

		expectTypeOf(client.getQueryData(todos.queryKey)).toEqualTypeOf<Todo[] | undefined>()
		expectTypeOf(client.getQueryState(todos.queryKey)).toEqualTypeOf<QueryState<Todo[]> | undefined>()
		client.setQueryData(todos.queryKey, [{ id: 1 }])
		client.setQueryData(todos.queryKey, (old) => [...(old ?? []), { id: 2 }])
		// @ts-expect-error the key says the data is Todo[]
		client.setQueryData(todos.queryKey, "nope")
		expect(client.getQueryData(todos.queryKey)).toBe("nope")

		// Plain keys keep working as before.
		expectTypeOf(client.getQueryData(["x"])).toEqualTypeOf<unknown>()
		expectTypeOf(client.getQueryData<string>(["x"])).toEqualTypeOf<string | undefined>()
		expectTypeOf(client.getQueryState<string>(["x"])).toEqualTypeOf<QueryState<string> | undefined>()

		const observer = new QueryObserver(client, { ...todos, staleTime: 10 })
		expectTypeOf(observer).toEqualTypeOf<QueryObserver<Todo[]>>()
	})

	it("keeps the literal key without `as const`", () => {
		const user = queryOptions({ queryKey: ["user", 1], queryFn: () => Promise.resolve("name") })
		expectTypeOf(user.queryKey[0]).toEqualTypeOf<"user">()
		expect(user.queryKey).toEqual(["user", 1])
	})
})

describe("mutationOptions", () => {
	it("returns the same object and infers the mutation types", () => {
		const input = { mutationFn: (title: string) => Promise.resolve<Todo>({ id: title.length }) }
		const create = mutationOptions(input)
		expect(create).toBe(input)
		expectTypeOf(new Mutation(create)).toEqualTypeOf<Mutation<Todo, Error, string, unknown>>()
	})
})
