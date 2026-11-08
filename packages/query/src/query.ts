import { BaseSubscribable, type Scheduler, type TimerHandle } from "@omnifront/core"
import { getRetryDelay, shouldRetry, type RetryOptions } from "./retry"
import { noop } from "./resolve"

export const DEFAULT_GC_TIME = 5 * 60 * 1000

export type QueryStatus = "idle" | "loading" | "success" | "error"

export interface QueryState<TData = unknown> {
	status: QueryStatus
	data: TData | undefined
	error: unknown
	isFetching: boolean
	/** Marked outdated by invalidation; cleared when the next fetch starts. */
	isInvalidated: boolean
	/** Failures in the current fetch so far (0 once it succeeds or a new one starts). */
	failureCount: number
	/** Scheduler time of the last successful data, if any. */
	dataUpdatedAt: number | undefined
}

/** Passed to every query function. `signal` aborts when the fetch is cancelled. */
export interface QueryFnContext {
	signal: AbortSignal
}
export type QueryFn<TData> = (context: QueryFnContext) => Promise<TData>

export class CancelledError extends Error {
	constructor() {
		super("Query was cancelled")
		this.name = "CancelledError"
	}
}

export interface QueryInit {
	/** Ms to keep an unobserved entry before removal. Default 5 minutes. */
	gcTime?: number
	/** Called when the entry has been unobserved for `gcTime`. */
	onGc?: () => void
	/** Reuse parts of the previous data in new data; see `replaceEqualDeep`. */
	structuralSharing?: ((previous: unknown, next: unknown) => unknown) | undefined
}

/** One cache entry. Immutable snapshots; one in-flight request at a time. */
export class Query<TData = unknown> extends BaseSubscribable<QueryState<TData>> {
	private state: QueryState<TData> = {
		status: "idle",
		data: undefined,
		error: undefined,
		isFetching: false,
		isInvalidated: false,
		failureCount: 0,
		dataUpdatedAt: undefined,
	}
	private inflight: Promise<TData> | undefined
	private cancelRequest: (() => void) | undefined
	private retryTimer: TimerHandle | undefined
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

	getSnapshot(): QueryState<TData> {
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

	/** Mark the data outdated. Active observers refetch; others refetch when next mounted. */
	invalidate(): void {
		if (!this.state.isInvalidated) this.update({ isInvalidated: true })
	}

	/** Resolves once the in-flight fetch (if any) has finished, successfully or not. */
	settled(): Promise<void> {
		return this.inflight ? this.inflight.then(noop, noop) : Promise.resolve()
	}

	/**
	 * Run `fn`, or join the request already in flight (deduplication).
	 * Failed attempts are retried per `retry` (default none) with backoff.
	 */
	fetch(fn: QueryFn<TData>, retry: RetryOptions = {}): Promise<TData> {
		if (this.inflight) return this.inflight
		const controller = new AbortController()
		const before = this.state
		this.update({
			status: before.data === undefined ? "loading" : before.status,
			error: undefined,
			isFetching: true,
			isInvalidated: false,
			failureCount: 0,
		})
		const request: Promise<TData> = new Promise<TData>((resolve, reject) => {
			const attempt = (): void => {
				new Promise<TData>((r) => r(fn({ signal: controller.signal }))).then(resolve, (error: unknown) => {
					if (controller.signal.aborted) return // cancelled meanwhile; already settled
					const failures = this.state.failureCount + 1
					if (!shouldRetry(retry.retry, failures, error)) return reject(error)
					this.update({ failureCount: failures })
					this.retryTimer = this.scheduler.setTimeout(() => {
						this.retryTimer = undefined
						attempt()
					}, getRetryDelay(retry.retryDelay, failures, error))
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
					isInvalidated: before.isInvalidated,
					failureCount: 0,
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
					dataUpdatedAt: this.scheduler.now(),
				})
				return data
			},
			(error: unknown) => {
				if (error instanceof CancelledError) throw error // state already restored by cancel()
				this.settle()
				this.update({ status: "error", error, isFetching: false })
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

	private update(patch: Partial<QueryState<TData>>): void {
		this.state = { ...this.state, ...patch }
		this.notify()
	}
}
