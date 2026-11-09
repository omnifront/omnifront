import { Mutation, type DefaultError, type MutationOptions, type MutationState } from "@omnifront/query"
import { trackMutation } from "@omnifront/query/activity"
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useOptionalQueryClient } from "./provider"

export interface UseMutationResult<TData, TError = DefaultError, TVariables = void> extends MutationState<TData, TError, TVariables> {
	/** Fire and forget; failures show up in `status` / `error`. */
	mutate: (variables: TVariables) => void
	/** Resolves with the data, rejects with the error. */
	mutateAsync: (variables: TVariables) => Promise<TData>
	reset: () => void
}

export function useMutation<TData, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: MutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables> {
	const [mutation] = useState(() => new Mutation(options))

	// Count towards useIsMutating when a provider exists; without one the hook works as before.
	const client = useOptionalQueryClient()
	useEffect(() => (client ? trackMutation(client, mutation) : undefined), [client, mutation])

	// Latest callbacks for the next mutate call.
	useEffect(() => mutation.setOptions(options))

	const getSnapshot = useCallback(() => mutation.getSnapshot(), [mutation])
	const state = useSyncExternalStore(mutation.subscribe, getSnapshot, getSnapshot)

	return useMemo(
		() => ({
			...state,
			mutate: (variables) => mutation.mutate(variables),
			mutateAsync: (variables) => mutation.mutateAsync(variables),
			reset: () => mutation.reset(),
		}),
		[state, mutation],
	)
}
