/**
 * The data layer of the todo demo, written once and used unchanged by the React, Vue and Angular
 * examples. Only the thin rendering code differs per framework.
 */
import type { MutationOptions, QueryClient, QueryObserverOptions } from "@unicore/query"
import { createStore } from "@unicore/store"
import { addTodo, listTodos } from "./api"

export { server } from "./api"

/** The list query: the same definition in every framework. */
export const todosQuery: QueryObserverOptions<string[]> = {
	queryKey: ["todos"],
	queryFn: ({ signal }) => listTodos(signal),
	staleTime: 5_000,
	retryDelay: 800,
}

/** Adding a todo. It stays "pending" until the list has been refetched. */
export const addTodoMutation = (client: QueryClient): MutationOptions<void, string> => ({
	mutationFn: addTodo,
	onSuccess: () => client.invalidateQueries({ queryKey: todosQuery.queryKey }),
})

/** UI state shared by every component (and, here, every framework's component) that reads it. */
export const todoFilter = createStore<{ filter: string; setFilter: (filter: string) => void }>((set) => ({
	filter: "",
	setFilter: (filter) => set({ filter }),
}))

export const matchesFilter = (todo: string, filter: string): boolean =>
	todo.toLowerCase().includes(filter.trim().toLowerCase())
