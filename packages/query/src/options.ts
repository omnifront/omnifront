import type { DataTag, QueryKey } from "./hash-key"
import type { MutationOptions } from "./mutation"
import type { QueryObserverOptions } from "./query-observer"
import type { DefaultError } from "./register"

/**
 * Define a query once and reuse it in every framework. Returns the same object; the only addition is
 * a type: the key remembers the data type, so `client.getQueryData(todos.queryKey)` and
 * `client.setQueryData(todos.queryKey, ...)` are typed without a generic.
 *
 *   export const todos = queryOptions({ queryKey: ["todos"], queryFn: fetchTodos, staleTime: 5_000 })
 *   useQuery(todos)   // React, Vue      injectQuery(todos)   // Angular
 */
export function queryOptions<TData, TError = DefaultError, const TKey extends QueryKey = QueryKey>(
	options: Omit<QueryObserverOptions<TData, TError>, "queryKey"> & { queryKey: TKey },
): Omit<QueryObserverOptions<TData, TError>, "queryKey"> & { queryKey: DataTag<TKey, TData> } {
	return options as Omit<QueryObserverOptions<TData, TError>, "queryKey"> & { queryKey: DataTag<TKey, TData> }
}

/** Define a mutation once and reuse it. Returns the same object; it exists for type inference. */
export function mutationOptions<TData, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: MutationOptions<TData, TError, TVariables, TContext>,
): MutationOptions<TData, TError, TVariables, TContext> {
	return options
}
