import { DestroyRef, computed, effect, inject, signal, untracked, type Signal } from "@angular/core"
import { Mutation, type DefaultError, type MutateOptions, type MutationOptions, type MutationState, type MutationStatus } from "@omnifront/query"
import { trackMutation } from "@omnifront/query/activity"
import { injectOptionalQueryClient } from "./provide"

export interface InjectMutationResult<TData, TError = DefaultError, TVariables = void, TContext = unknown> {
	status: Signal<MutationStatus>
	data: Signal<TData | undefined>
	error: Signal<TError | undefined>
	variables: Signal<TVariables | undefined>
	isIdle: Signal<boolean>
	isPending: Signal<boolean>
	isSuccess: Signal<boolean>
	isError: Signal<boolean>
	isPaused: Signal<boolean>
	failureCount: Signal<number>
	failureReason: Signal<TError | undefined>
	submittedAt: Signal<number | undefined>
	/** Fire and forget; failures show up in `status` / `error`. The callbacks are for this call only. */
	mutate: (variables: TVariables, callbacks?: MutateOptions<TData, TError, TVariables, TContext>) => void
	/** Resolves with the data, rejects with the error. */
	mutateAsync: (variables: TVariables, callbacks?: MutateOptions<TData, TError, TVariables, TContext>) => Promise<TData>
	reset: () => void
}

/** Must run in an injection context. Options may be a function reading signals. */
export function injectMutation<TData, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: MutationOptions<TData, TError, TVariables, TContext> | (() => MutationOptions<TData, TError, TVariables, TContext>),
): InjectMutationResult<TData, TError, TVariables, TContext> {
	const read = () => (typeof options === "function" ? options() : options)
	// With a client provided the mutation starts from its `defaultOptions.mutations` and counts
	// towards injectIsMutating; without one it works on its own.
	const client = injectOptionalQueryClient() ?? undefined
	const mutation = new Mutation(untracked(read), client)

	const state = signal<MutationState<TData, TError, TVariables>>(mutation.getSnapshot())
	const destroyRef = inject(DestroyRef)
	destroyRef.onDestroy(mutation.subscribe(() => state.set(mutation.getSnapshot())))
	if (client) destroyRef.onDestroy(trackMutation(client, mutation))

	// Keep the latest callbacks if the options read signals.
	effect(() => {
		const next = read()
		untracked(() => mutation.setOptions(next))
	})

	// One signal per field of the state (the state always has every field, so its keys are the list).
	const fields: Record<string, Signal<unknown>> = {}
	for (const key of Object.keys(state()) as Array<keyof MutationState<TData, TError, TVariables>>) {
		fields[key] = computed(() => state()[key])
	}
	return {
		...(fields as unknown as Omit<InjectMutationResult<TData, TError, TVariables, TContext>, "mutate" | "mutateAsync" | "reset">),
		mutate: (variables, callbacks) => mutation.mutate(variables, callbacks),
		mutateAsync: (variables, callbacks) => mutation.mutateAsync(variables, callbacks),
		reset: () => mutation.reset(),
	}
}
