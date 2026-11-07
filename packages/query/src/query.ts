import { BaseSubscribable, type Scheduler } from "@unicore/core"

export type QueryStatus = "idle" | "loading" | "success" | "error"

export interface QueryState<TData = unknown> {
	status: QueryStatus
	data: TData | undefined
	error: unknown
	isFetching: boolean
	/** Scheduler time of the last successful data, if any. */
	dataUpdatedAt: number | undefined
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

	constructor(private readonly scheduler: Scheduler) {
		super()
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
