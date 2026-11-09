import { Mutation, type DefaultError, type MutationOptions, type MutationState, type MutationStatus } from "@omnifront/query"
import { trackMutation } from "@omnifront/query/activity"
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue"
import { useOptionalQueryClient } from "./plugin"

export interface UseMutationReturn<TData, TError = DefaultError, TVariables = void> {
	status: ComputedRef<MutationStatus>
	data: ComputedRef<TData | undefined>
	error: ComputedRef<TError | undefined>
	variables: ComputedRef<TVariables | undefined>
	/** Fire and forget; failures show up in `status` / `error`. */
	mutate: (variables: TVariables) => void
	/** Resolves with the data, rejects with the error. */
	mutateAsync: (variables: TVariables) => Promise<TData>
	reset: () => void
}

export function useMutation<TData, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: MaybeRefOrGetter<MutationOptions<TData, TError, TVariables, TContext>>,
): UseMutationReturn<TData, TError, TVariables> {
	const mutation = new Mutation(toValue(options))
	const state = shallowRef<MutationState<TData, TError, TVariables>>(mutation.getSnapshot())

	const unsubscribe = mutation.subscribe(() => {
		state.value = mutation.getSnapshot()
	})
	if (getCurrentScope()) onScopeDispose(unsubscribe)

	// Count towards useIsMutating when the plugin is installed; without it the composable works as before.
	const client = useOptionalQueryClient()
	if (client && getCurrentScope()) onScopeDispose(trackMutation(client, mutation))

	// Keep the latest callbacks if the options are reactive.
	watch(
		() => toValue(options),
		(next) => mutation.setOptions(next),
	)

	const pick = <K extends keyof MutationState<TData, TError, TVariables>>(key: K) => computed(() => state.value[key])
	return {
		status: pick("status"),
		data: pick("data"),
		error: pick("error"),
		variables: pick("variables"),
		mutate: (variables) => mutation.mutate(variables),
		mutateAsync: (variables) => mutation.mutateAsync(variables),
		reset: () => mutation.reset(),
	}
}
