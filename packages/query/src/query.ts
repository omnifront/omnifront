import { BaseSubscribable, type Scheduler, type TimerHandle } from "@unicore/core"

export const DEFAULT_GC_TIME = 5 * 60 * 1000

export type QueryStatus = "idle" | "loading" | "success" | "error"

export interface QueryState<TData = unknown> {
	status: QueryStatus
	data: TData | undefined
	error: unknown
	isFetching: boolean
	/** Scheduler time of the last successful data, if any. */
	dataUpdatedAt: number | undefined
}

export interface QueryInit {
	/** Ms to keep an unobserved entry before removal. Default 5 minutes. */
	gcTime?: number
	/** Called when the entry has been unobserved for `gcTime`. */
	onGc?: () => void
}

/** One cache entry. Immutable snapshots; one in-flight request at a time. */
export class Query<TData = unknown> extends BaseSubscribable<QueryState<TData>> {
	private state: QueryState<TData> = {
		status: "idle",
		data: undefined,
		error: undefined,
		isFetching: false,
		dataUpdatedAt: undefined,
	}
	private inflight: Promise<TData> | undefined
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

	/** Several observers may ask for different gcTimes; the longest wins. */
	updateGcTime(gcTime: number): void {
		this.gcTime = Math.max(this.gcTime, gcTime)
	}

	/** Cancel pending timers; the entry is being dropped. */
	destroy(): void {
		this.clearGc()
	}

	// ADR-0001 rule 4: first subscriber cancels gc, last one starts it.
	protected override onSubscribe(): void {
		this.clearGc()
	}

	protected override onUnsubscribe(): void {
		this.scheduleGc()
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

	getSnapshot(): QueryState<TData> {
		return this.state
	}

	setData(data: TData): void {
		this.update({
			status: "success",
			data,
			error: undefined,
			dataUpdatedAt: this.scheduler.now(),
		})
	}

	/** Run `fn`, or join the request already in flight (deduplication). */
	fetch(fn: () => Promise<TData>): Promise<TData> {
		if (this.inflight) return this.inflight
		this.update({
			status: this.state.data === undefined ? "loading" : this.state.status,
			error: undefined,
			isFetching: true,
		})
		const request = new Promise<TData>((resolve) => resolve(fn())).then(
			(data) => {
				this.inflight = undefined
				this.update({
					status: "success",
					data,
					error: undefined,
					isFetching: false,
					dataUpdatedAt: this.scheduler.now(),
				})
				return data
			},
			(error: unknown) => {
				this.inflight = undefined
				this.update({ status: "error", error, isFetching: false })
				throw error
			},
		)
		this.inflight = request
		return request
	}

	private update(patch: Partial<QueryState<TData>>): void {
		this.state = { ...this.state, ...patch }
		this.notify()
	}
}
