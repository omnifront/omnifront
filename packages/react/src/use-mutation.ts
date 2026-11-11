import { Mutation, type DefaultError, type MutateOptions, type MutationOptions, type MutationState } from "@omnifront/query"
import { trackMutation } from "@omnifront/query/activity"
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useOptionalQueryClient } from "./provider"

export interface UseMutationResult<TData, TError = DefaultError, TVariables = void, TContext = unknown>
	extends MutationState<TData, TError, TVariables> {
	/** Fire and forget; failures show up in `status` / `error`. The callbacks are for this call only. */
	mutate: (variables: TVariables, callbacks?: MutateOptions<TData, TError, TVariables, TContext>) => void
	/** Resolves with the data, rejects with the error. */
	mutateAsync: (variables: TVariables, callbacks?: MutateOptions<TData, TError, TVariables, TContext>) => Promise<TData>
	reset: () => void
}

export function useMutation<TData, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: MutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
	// With a provider the mutation starts from the client's `defaultOptions.mutations` and counts
	// towards useIsMutating; without one the hook works on its own.
	const client = useOptionalQueryClient()
	const [mutation] = useState(() => new Mutation(options, client))
	useEffect(() => (client ? trackMutation(client, mutation) : undefined), [client, mutation])

	// Latest callbacks for the next mutate call.
	useEffect(() => mutation.setOptions(options))

	const getSnapshot = useCallback(() => mutation.getSnapshot(), [mutation])
	const state = useSyncExternalStore(mutation.subscribe, getSnapshot, getSnapshot)

	return useMemo(
		() => ({
			...state,
			mutate: (variables, callbacks) => mutation.mutate(variables, callbacks),
			mutateAsync: (variables, callbacks) => mutation.mutateAsync(variables, callbacks),
			reset: () => mutation.reset(),
		}),
		[state, mutation],
	)
}
