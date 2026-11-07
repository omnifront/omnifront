import { Mutation, type MutationOptions, type MutationState } from "@unicore/query"
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"

export interface UseMutationResult<TData, TVariables> extends MutationState<TData, TVariables> {
	/** Fire and forget; failures show up in `status` / `error`. */
	mutate: (variables: TVariables) => void
	/** Resolves with the data, rejects with the error. */
	mutateAsync: (variables: TVariables) => Promise<TData>
	reset: () => void
}

export function useMutation<TData, TVariables = void>(
	options: MutationOptions<TData, TVariables>,
): UseMutationResult<TData, TVariables> {
	const [mutation] = useState(() => new Mutation(options))

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
