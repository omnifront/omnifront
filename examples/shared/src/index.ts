/**
 * The data layer of the todo demo, written once and used unchanged by the React, Vue and Angular
 * examples. Only the thin rendering code differs per framework.
 */
import { onlineManager, type MutationOptions, type QueryClient, type QueryObserverOptions } from "@omnifront/query"
import { enableOffline, setMutationDefaults } from "@omnifront/query/offline"
import type { MutationInfo } from "@omnifront/query/activity"
import { createStore } from "@omnifront/store"
import { api } from "./api"

export { server } from "./api"

/** The list query: the same definition in every framework. */
export const todosQuery: QueryObserverOptions<string[]> = {
	...api.queryOptions<string[]>("/todos"),
	staleTime: 5_000,
	retryDelay: 800,
}

export const ADD_TODO_KEY = ["addTodo"] as const

/**
 * Adding a todo. It stays "pending" until the list has been refetched. The key lets other components
 * see it (`pendingTodos`) and lets a call that was waiting for the network be sent again after a
 * reload; the scope makes several adds go out one after another, in the order they were made.
 */
export const addTodoMutation = (client: QueryClient): MutationOptions<unknown, Error, string> => ({
	...api.mutationOptions<unknown, string>("POST", "/todos"),
	mutationKey: ADD_TODO_KEY,
	scope: { id: "todos" },
	onSuccess: () => client.invalidateQueries({ queryKey: api.queryKey("/todos") }),
})

/**
 * Offline support for the demo: call it once when the client is created, before `persistQueryClient`
 * restores the cache (a saved call can only be sent again if its function is registered by then).
 */
export function setupOffline(client: QueryClient): void {
	enableOffline(client)
	setMutationDefaults(client, ADD_TODO_KEY, addTodoMutation(client) as never)
}

/** Pretend the network is down (or back). Anything that needs it waits, and goes out when it is back. */
export const setOffline = (offline: boolean): void => onlineManager.set(!offline)

/** For `useMutationState`: the titles of the todos being added right now, to show them before they are saved. */
export const pendingTodos = {
	filters: { mutationKey: ADD_TODO_KEY, status: "pending" as const },
	select: (mutation: MutationInfo) => String(mutation.state.variables),
}

/** UI state shared by every component (and, here, every framework's component) that reads it. */
export const todoFilter = createStore<{ filter: string; setFilter: (filter: string) => void }>((set) => ({
	filter: "",
	setFilter: (filter) => set({ filter }),
}))

export const matchesFilter = (todo: string, filter: string): boolean =>
	todo.toLowerCase().includes(filter.trim().toLowerCase())
