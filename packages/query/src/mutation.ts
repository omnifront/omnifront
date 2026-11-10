import { BaseSubscribable, defaultScheduler, type Scheduler } from "@omnifront/core"
import type { QueryKey } from "./hash-key"
import { whenOnline, type NetworkMode } from "./online"
import type { QueryClient } from "./query-client"
import type { DefaultError } from "./register"
import { getRetryDelay, shouldRetry, type RetryOptions } from "./retry"
import { noop } from "./resolve"

export type MutationStatus = "idle" | "pending" | "success" | "error"

export interface MutationState<TData = unknown, TError = DefaultError, TVariables = void> {
	status: MutationStatus
	data: TData | undefined
	/** `undefined` when there is none. */
	error: TError | undefined
	/** Variables of the latest mutate call. */
	variables: TVariables | undefined
	isIdle: boolean
	isPending: boolean
	isSuccess: boolean
	isError: boolean
	/** Waiting for the network to come back before it is sent. */
	isPaused: boolean
	/** Failed attempts of the current run so far (while it is being retried). */
	failureCount: number
	/** The error of the latest failed attempt. */
	failureReason: TError | undefined
	/** Scheduler time of the latest mutate call. */
	submittedAt: number | undefined
}

type MaybePromise<T> = T | Promise<T>

export interface MutationOptions<TData, TError = DefaultError, TVariables = void, TContext = unknown> extends RetryOptions<TError> {
	mutationFn: (variables: TVariables) => Promise<TData>
	/** Names the mutation, for the filters of `useIsMutating` and `useMutationState`. */
	mutationKey?: QueryKey | undefined
	/** Free-form data, visible to those filters. */
	meta?: Record<string, unknown> | undefined
	/** What to do without a network. Default `"online"`: wait for it (`isPaused`) and send when it is back. */
	networkMode?: NetworkMode | undefined
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


/** Callbacks for one `mutate` call. They run after the ones in the options, and only for the latest call. */
export interface MutateOptions<TData, TError = DefaultError, TVariables = void, TContext = unknown> {
	onSuccess?: ((data: TData, variables: TVariables, context: TContext) => void) | undefined
	onError?: ((error: TError, variables: TVariables, context: TContext | undefined) => void) | undefined
	onSettled?:
		| ((data: TData | undefined, error: TError | undefined, variables: TVariables, context: TContext | undefined) => void)
		| undefined
}

type Core<TData, TError, TVariables> = Omit<MutationState<TData, TError, TVariables>, "isIdle" | "isPending" | "isSuccess" | "isError">

/** Add the flags that follow from `status`. */
function withFlags<TData, TError, TVariables>(state: Core<TData, TError, TVariables>): MutationState<TData, TError, TVariables> {
	const { status } = state
	return {
		...state,
		isIdle: status === "idle",
		isPending: status === "pending",
		isSuccess: status === "success",
		isError: status === "error",
	}
}

const idle: Core<never, never, never> = {
	status: "idle",
	data: undefined,
	error: undefined,
	variables: undefined,
	isPaused: false,
	failureCount: 0,
	failureReason: undefined,
	submittedAt: undefined,
}

/**
 * One mutation slot, reused across calls (what a UI hook holds on to).
 * If `mutate` is called again before the previous run finishes, only the latest run drives `state`.
 * With a `client` it starts from that client's `defaultOptions.mutations` and uses its scheduler.
 */
export class Mutation<TData, TError = DefaultError, TVariables = void, TContext = unknown> extends BaseSubscribable<
	MutationState<TData, TError, TVariables>
> {
	private state: MutationState<TData, TError, TVariables> = withFlags(idle)
	private runs = 0
	private readonly scheduler: Scheduler
	/** The options in effect (the client's defaults included). */
	options!: MutationOptions<TData, TError, TVariables, TContext>

	constructor(
		options: MutationOptions<TData, TError, TVariables, TContext>,
		private readonly client?: QueryClient,
	) {
		super()
		this.scheduler = client?.scheduler ?? defaultScheduler
		this.setOptions(options)
	}

	getSnapshot(): MutationState<TData, TError, TVariables> {
		return this.state
	}

	/** Callbacks may change between renders; the next run uses the latest. */
	setOptions(options: MutationOptions<TData, TError, TVariables, TContext>): void {
		this.options = { ...(this.client?.getDefaultOptions().mutations as object), ...options }
	}

	/** Fire and forget: failures are in `state`, nothing is thrown. */
	mutate(variables: TVariables, callbacks?: MutateOptions<TData, TError, TVariables, TContext>): void {
		this.mutateAsync(variables, callbacks).catch(noop)
	}

	/** Run the mutation; resolves with the data, rejects with the error. */
	async mutateAsync(variables: TVariables, callbacks: MutateOptions<TData, TError, TVariables, TContext> = {}): Promise<TData> {
		const run = ++this.runs
		const { scheduler } = this
		const { mutationFn, onMutate, onSuccess, onError, onSettled, retry, retryDelay, networkMode } = this.options
		this.update(run, { ...idle, status: "pending", variables, submittedAt: scheduler.now() })
		let context: TContext | undefined
		let data: TData
		try {
			context = await onMutate?.(variables)
			for (let failures = 0; ; ) {
				// Only wait (and only yield) when the network is down; otherwise the function is called right away.
				let go: (() => void) | undefined
				if (whenOnline(networkMode, !failures, () => go?.(), (isPaused) => this.update(run, { isPaused }))) {
					await new Promise<void>((resume) => (go = resume))
				}
				try {
					data = await mutationFn(variables)
					break
				} catch (error) {
					if (!shouldRetry(retry, ++failures, error as TError)) throw error
					this.update(run, { failureCount: failures, failureReason: error as TError })
					await new Promise<void>((r) => scheduler.setTimeout(r, getRetryDelay(retryDelay, failures, error as TError)))
				}
			}
			await onSuccess?.(data, variables, context as TContext)
		} catch (error) {
			try {
				await onError?.(error as TError, variables, context)
			} finally {
				this.update(run, { status: "error", error: error as TError, failureReason: error as TError })
			}
			await onSettled?.(undefined, error as TError, variables, context)
			if (run === this.runs) {
				callbacks.onError?.(error as TError, variables, context)
				callbacks.onSettled?.(undefined, error as TError, variables, context)
			}
			throw error
		}
		this.update(run, { status: "success", data, failureCount: 0, failureReason: undefined })
		await onSettled?.(data, undefined, variables, context)
		if (run === this.runs) {
			callbacks.onSuccess?.(data, variables, context as TContext)
			callbacks.onSettled?.(data, undefined, variables, context)
		}
		return data
	}

	/** Back to idle; results of runs still in flight are ignored. */
	reset(): void {
		this.runs++
		this.state = withFlags(idle)
		this.notify()
	}

	private update(run: number, patch: Partial<Core<TData, TError, TVariables>>): void {
		if (run !== this.runs) return // superseded by a newer run or reset()
		this.state = withFlags({ ...this.state, ...patch })
		this.notify()
	}
}
