import { Mutation, type DefaultError, type MutateOptions, type MutationOptions, type MutationState, type MutationStatus } from "@omnifront/query"
import { trackMutation } from "@omnifront/query/activity"
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue"
import { useOptionalQueryClient } from "./plugin"

export interface UseMutationReturn<TData, TError = DefaultError, TVariables = void, TContext = unknown> {
	status: ComputedRef<MutationStatus>
	data: ComputedRef<TData | undefined>
	error: ComputedRef<TError | undefined>
	variables: ComputedRef<TVariables | undefined>
	isIdle: ComputedRef<boolean>
	isPending: ComputedRef<boolean>
	isSuccess: ComputedRef<boolean>
	isError: ComputedRef<boolean>
	isPaused: ComputedRef<boolean>
	failureCount: ComputedRef<number>
	failureReason: ComputedRef<TError | undefined>
	submittedAt: ComputedRef<number | undefined>
	/** Fire and forget; failures show up in `status` / `error`. The callbacks are for this call only. */
	mutate: (variables: TVariables, callbacks?: MutateOptions<TData, TError, TVariables, TContext>) => void
	/** Resolves with the data, rejects with the error. */
	mutateAsync: (variables: TVariables, callbacks?: MutateOptions<TData, TError, TVariables, TContext>) => Promise<TData>
	reset: () => void
}

export function useMutation<TData, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: MaybeRefOrGetter<MutationOptions<TData, TError, TVariables, TContext>>,
): UseMutationReturn<TData, TError, TVariables, TContext> {
	// With the plugin installed the mutation starts from the client's `defaultOptions.mutations` and
	// counts towards useIsMutating; without it the composable works on its own.
	const client = useOptionalQueryClient()
	const mutation = new Mutation(toValue(options), client)
	const state = shallowRef<MutationState<TData, TError, TVariables>>(mutation.getSnapshot())

	const unsubscribe = mutation.subscribe(() => {
		state.value = mutation.getSnapshot()
	})
	if (getCurrentScope()) onScopeDispose(unsubscribe)
	if (client && getCurrentScope()) onScopeDispose(trackMutation(client, mutation))

	// Keep the latest callbacks if the options are reactive.
	watch(
		() => toValue(options),
		(next) => mutation.setOptions(next),
	)

	// One computed per field of the state (the state always has every field, so its keys are the list).
	const fields: Record<string, ComputedRef<unknown>> = {}
	for (const key of Object.keys(state.value) as Array<keyof MutationState<TData, TError, TVariables>>) {
		fields[key] = computed(() => state.value[key])
	}
	return {
		...(fields as unknown as Omit<UseMutationReturn<TData, TError, TVariables, TContext>, "mutate" | "mutateAsync" | "reset">),
		mutate: (variables, callbacks) => mutation.mutate(variables, callbacks),
		mutateAsync: (variables, callbacks) => mutation.mutateAsync(variables, callbacks),
		reset: () => mutation.reset(),
	}
}
