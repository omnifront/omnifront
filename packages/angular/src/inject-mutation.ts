import { DestroyRef, computed, effect, inject, signal, untracked, type Signal } from "@angular/core"
import { Mutation, type MutationOptions, type MutationStatus } from "@omnifront/query"

export interface InjectMutationResult<TData, TVariables> {
	status: Signal<MutationStatus>
	data: Signal<TData | undefined>
	error: Signal<unknown>
	variables: Signal<TVariables | undefined>
	/** Fire and forget; failures show up in `status` / `error`. */
	mutate: (variables: TVariables) => void
	/** Resolves with the data, rejects with the error. */
	mutateAsync: (variables: TVariables) => Promise<TData>
	reset: () => void
}

/** Must run in an injection context. Options may be a function reading signals. */
export function injectMutation<TData, TVariables = void, TContext = unknown>(
	options: MutationOptions<TData, TVariables, TContext> | (() => MutationOptions<TData, TVariables, TContext>),
): InjectMutationResult<TData, TVariables> {
	const read = () => (typeof options === "function" ? options() : options)
	const mutation = new Mutation(untracked(read))

	const state = signal(mutation.getSnapshot())
	inject(DestroyRef).onDestroy(mutation.subscribe(() => state.set(mutation.getSnapshot())))

	// Keep the latest callbacks if the options read signals.
	effect(() => {
		const next = read()
		untracked(() => mutation.setOptions(next))
	})

	return {
		status: computed(() => state().status),
		data: computed(() => state().data),
		error: computed(() => state().error),
		variables: computed(() => state().variables),
		mutate: (variables) => mutation.mutate(variables),
		mutateAsync: (variables) => mutation.mutateAsync(variables),
		reset: () => mutation.reset(),
	}
}
