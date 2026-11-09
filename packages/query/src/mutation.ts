import { BaseSubscribable } from "@omnifront/core"
import type { DefaultError } from "./register"
import { noop } from "./resolve"

export type MutationStatus = "idle" | "pending" | "success" | "error"

export interface MutationState<TData = unknown, TError = DefaultError, TVariables = void> {
	status: MutationStatus
	data: TData | undefined
	/** `undefined` when there is none. */
	error: TError | undefined
	/** Variables of the latest mutate call. */
	variables: TVariables | undefined
}

type MaybePromise<T> = T | Promise<T>

export interface MutationOptions<TData, TError = DefaultError, TVariables = void, TContext = unknown> {
	mutationFn: (variables: TVariables) => Promise<TData>
	/**
	 * Runs (and is awaited) before `mutationFn`. Return whatever you need later, typically a snapshot
	 * to roll back to: it arrives as the last argument of the other callbacks.
	 */
	onMutate?: ((variables: TVariables) => MaybePromise<TContext>) | undefined
	/** Awaited before the mutation counts as successful: return e.g. `client.invalidateQueries(...)`. */
	onSuccess?: ((data: TData, variables: TVariables, context: TContext) => MaybePromise<unknown>) | undefined
	/** Awaited before the mutation counts as failed. Also runs if `onMutate` or `onSuccess` throws. */
	onError?: ((error: TError, variables: TVariables, context: TContext | undefined) => MaybePromise<unknown>) | undefined
	/** After either outcome. */
	onSettled?:
		| ((data: TData | undefined, error: TError | undefined, variables: TVariables, context: TContext | undefined) => MaybePromise<unknown>)
		| undefined
}


/**
 * One mutation slot, reused across calls (what a UI hook holds on to).
 * If `mutate` is called again before the previous run finishes, only the latest run drives `state`.
 */
export class Mutation<TData, TError = DefaultError, TVariables = void, TContext = unknown> extends BaseSubscribable<
	MutationState<TData, TError, TVariables>
> {
	private state: MutationState<TData, TError, TVariables> = idle()
	private runs = 0

	constructor(private options: MutationOptions<TData, TError, TVariables, TContext>) {
		super()
	}

	getSnapshot(): MutationState<TData, TError, TVariables> {
		return this.state
	}

	/** Callbacks may change between renders; the next run uses the latest. */
	setOptions(options: MutationOptions<TData, TError, TVariables, TContext>): void {
		this.options = options
	}

	/** Fire and forget: failures are in `state`, nothing is thrown. */
	mutate(variables: TVariables): void {
		this.mutateAsync(variables).catch(noop)
	}

	/** Run the mutation; resolves with the data, rejects with the error. */
	async mutateAsync(variables: TVariables): Promise<TData> {
		const run = ++this.runs
		const { mutationFn, onMutate, onSuccess, onError, onSettled } = this.options
		this.update(run, { status: "pending", data: undefined, error: undefined, variables })
		let context: TContext | undefined
		let data: TData
		try {
			context = await onMutate?.(variables)
			data = await mutationFn(variables)
			await onSuccess?.(data, variables, context as TContext)
		} catch (error) {
			try {
				await onError?.(error as TError, variables, context)
			} finally {
				this.update(run, { status: "error", error: error as TError })
			}
			await onSettled?.(undefined, error as TError, variables, context)
			throw error
		}
		this.update(run, { status: "success", data })
		await onSettled?.(data, undefined, variables, context)
		return data
	}

	/** Back to idle; results of runs still in flight are ignored. */
	reset(): void {
		this.runs++
		this.state = idle()
		this.notify()
	}

	private update(run: number, patch: Partial<MutationState<TData, TError, TVariables>>): void {
		if (run !== this.runs) return // superseded by a newer run or reset()
		this.state = { ...this.state, ...patch }
		this.notify()
	}
}

function idle<TData, TError, TVariables>(): MutationState<TData, TError, TVariables> {
	return { status: "idle", data: undefined, error: undefined, variables: undefined }
}
