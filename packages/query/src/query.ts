import { BaseSubscribable, type Scheduler, type TimerHandle } from "@omnifront/core"
import type { QueryKey } from "./hash-key"
import type { QueryClient } from "./query-client"
import { getRetryDelay, shouldRetry, type RetryOptions } from "./retry"
import { noop } from "./resolve"
import { CancelledError } from "./cancelled-error"
import { whenOnline, type NetworkMode } from "./online"
import type { DefaultError } from "./register"

export { CancelledError }

export const DEFAULT_GC_TIME = 5 * 60 * 1000

export type QueryStatus = "idle" | "loading" | "success" | "error"

export interface QueryState<TData = unknown, TError = DefaultError> {
	status: QueryStatus
	data: TData | undefined
	/** `undefined` when there is none. */
	error: TError | undefined
	/** A request is in flight, running or waiting (for a retry, or for the network: see `isPaused`). */
	isFetching: boolean
	/** The fetch is waiting for the network to come back. */
	isPaused: boolean
	/** Marked outdated by invalidation; cleared when the next fetch starts. */
	isInvalidated: boolean
	/** Failures in the current fetch so far (0 once it succeeds or a new one starts). */
	failureCount: number
	/** The error of the latest failed attempt (also while retrying); cleared when a fetch starts or succeeds. */
	failureReason: TError | undefined
	/** Scheduler time of the last successful data, if any. */
	dataUpdatedAt: number | undefined
}

/** Passed to every query function. `signal` aborts when the fetch is cancelled. */
export interface QueryFnContext {
	signal: AbortSignal
	/** The key the function is fetching for. */
	queryKey: QueryKey
	/** The query's `meta` option. */
	meta: Record<string, unknown> | undefined
	client: QueryClient
}
export type QueryFn<TData> = (context: QueryFnContext) => Promise<TData>

/** The type of `skipToken` (`@omnifront/query/options`): a `queryFn` that means "do not fetch". */
export interface SkipToken {
	/** Types only: tells the token apart from a function. */
	readonly skipToken: true
}

/** What `Query.fetch` takes besides the function. */
export interface FetchOptions<TError = DefaultError> extends RetryOptions<TError> {
	meta?: Record<string, unknown> | undefined
	networkMode?: NetworkMode | undefined
}

const initial: QueryState<never, never> = {
	status: "idle",
	data: undefined,
	error: undefined,
	isFetching: false,
	isPaused: false,
	isInvalidated: false,
	failureCount: 0,
	failureReason: undefined,
	dataUpdatedAt: undefined,
}


export interface QueryInit {
	/** Ms to keep an unobserved entry before removal. Default 5 minutes. */
	gcTime?: number
	/** Called when the entry has been unobserved for `gcTime`. */
	onGc?: () => void
	/** Called after every state change (the client uses it to tell cache-wide listeners, ADR-0011). */
	onChange?: () => void
	/** Reuse parts of the previous data in new data; see `replaceEqualDeep`. */
	structuralSharing?: ((previous: unknown, next: unknown) => unknown) | undefined
	/** Handed to the query function. */
	queryKey?: QueryKey
	client?: QueryClient
}

/** One cache entry. Immutable snapshots; one in-flight request at a time. */
export class Query<TData = unknown, TError = DefaultError> extends BaseSubscribable<QueryState<TData, TError>> {
	private state: QueryState<TData, TError> = initial
	private inflight: Promise<TData> | undefined
	private cancelRequest: (() => void) | undefined
	private retryTimer: TimerHandle | undefined
	private stopWaiting: (() => void) | undefined
	private gcTime: number
	private gcTimer: TimerHandle | undefined

	constructor(
		private readonly scheduler: Scheduler,
		private readonly init: QueryInit = {},
	) {
		super()
		this.gcTime = init.gcTime ?? DEFAULT_GC_TIME
		this.scheduleGc() // entries nobody observes are collected too
	}

	getSnapshot(): QueryState<TData, TError> {
		return this.state
	}

	/** `updatedAt` lets hydration keep the time the server fetched the data. */
	setData(data: TData, updatedAt: number = this.scheduler.now()): void {
		this.update({
			status: "success",
			data: this.share(data),
			error: undefined,
			isInvalidated: false,
			dataUpdatedAt: updatedAt,
		})
	}

	/**
	 * Mark the data outdated. Active observers refetch; others refetch when next mounted. `quiet`
	 * marks it without telling anyone: observers see it the next time they are told something.
	 */
	invalidate(quiet?: boolean): void {
		// Marked quietly earlier and not told yet: a loud call still has to tell observers (they refetch).
		if (!quiet) this.update({ isInvalidated: true })
		else if (!this.state.isInvalidated) this.state = { ...this.state, isInvalidated: true }
	}

	/**
	 * Back to the empty state, cancelling a fetch in flight. The entry is left invalidated, so
	 * observers that are watching load it again.
	 */
	reset(): void {
		this.cancel()
		this.update({ ...initial, isInvalidated: true })
	}

	/** Resolves once the in-flight fetch (if any) has finished, successfully or not. */
	settled(): Promise<void> {
		return this.inflight ? this.inflight.then(noop, noop) : Promise.resolve()
	}

	/**
	 * Run `fn`, or join the request already in flight (deduplication).
	 * Failed attempts are retried per `retry` (default none) with backoff.
	 */
	fetch(fn: QueryFn<TData>, options: FetchOptions<TError> = {}): Promise<TData> {
		if (this.inflight) return this.inflight
		const controller = new AbortController()
		const before = this.state
		this.update({
			status: before.data === undefined ? "loading" : before.status,
			error: undefined,
			isFetching: true,
			isInvalidated: false,
			failureCount: 0,
			failureReason: undefined,
		})
		const { queryKey = [], client } = this.init
		const context = { signal: controller.signal, queryKey, meta: options.meta, client: client as QueryClient }
		const request: Promise<TData> = new Promise<TData>((resolve, reject) => {
			const attempt = (): void => {
				this.stopWaiting = whenOnline(options.networkMode, !this.state.failureCount, run, (isPaused) => this.update({ isPaused }))
			}
			const run = (): void => {
				new Promise<TData>((r) => r(fn(context))).then(resolve, (error: unknown) => {
					if (controller.signal.aborted) return // cancelled meanwhile; already settled
					const failures = this.state.failureCount + 1
					if (!shouldRetry(options.retry, failures, error as TError)) return reject(error)
					this.update({ failureCount: failures, failureReason: error as TError })
					this.retryTimer = this.scheduler.setTimeout(() => {
						this.retryTimer = undefined
						attempt()
					}, getRetryDelay(options.retryDelay, failures, error as TError))
				})
			}
			// Cancelling settles the request and puts the state back as it was before.
			this.cancelRequest = () => {
				controller.abort()
				this.clearRetry()
				this.cancelRequest = undefined
				this.inflight = undefined
				this.update({
					status: before.status,
					error: before.error,
					isFetching: false,
					isPaused: false,
					isInvalidated: before.isInvalidated,
					failureCount: 0,
					failureReason: undefined,
				})
				reject(new CancelledError())
			}
			attempt()
		}).then(
			(data) => {
				this.settle()
				this.update({
					status: "success",
					data: this.share(data),
					error: undefined,
					isFetching: false,
					failureCount: 0,
					failureReason: undefined,
					dataUpdatedAt: this.scheduler.now(),
				})
				return data
			},
			(error: unknown) => {
				if (error instanceof CancelledError) throw error // state already restored by cancel()
				this.settle()
				this.update({ status: "error", error: error as TError, failureReason: error as TError, isFetching: false })
				throw error
			},
		)
		this.inflight = request
		return request
	}

	/** Abort the in-flight fetch (and any pending retry). Its promise rejects with CancelledError. */
	cancel(): void {
		this.cancelRequest?.()
	}

	/** Several observers may ask for different gcTimes; the longest wins. */
	updateGcTime(gcTime: number): void {
		this.gcTime = Math.max(this.gcTime, gcTime)
	}

	/** The entry is being dropped: cancel work and pending timers. */
	destroy(): void {
		this.clearGc()
		this.cancel()
	}

	// ADR-0001 rule 4: first subscriber cancels gc, last one starts it.
	protected override onSubscribe(): void {
		this.clearGc()
	}

	protected override onUnsubscribe(): void {
		this.scheduleGc()
	}

	private share(data: TData): TData {
		const share = this.init.structuralSharing
		return share ? (share(this.state.data, data) as TData) : data
	}

	private settle(): void {
		this.inflight = undefined
		this.cancelRequest = undefined
		this.clearRetry()
	}

	private clearRetry(): void {
		if (this.retryTimer !== undefined) this.scheduler.clearTimeout(this.retryTimer)
		this.retryTimer = undefined
		this.stopWaiting?.()
		this.stopWaiting = undefined
	}

	private scheduleGc(): void {
		this.clearGc()
		if (this.gcTime === Infinity) return
		this.gcTimer = this.scheduler.setTimeout(() => {
			this.gcTimer = undefined
			this.init.onGc?.()
		}, this.gcTime)
	}

	private clearGc(): void {
		if (this.gcTimer !== undefined) this.scheduler.clearTimeout(this.gcTimer)
		this.gcTimer = undefined
	}

	private update(patch: Partial<QueryState<TData, TError>>): void {
		this.state = { ...this.state, ...patch }
		this.notify()
		this.init.onChange?.()
	}
}
