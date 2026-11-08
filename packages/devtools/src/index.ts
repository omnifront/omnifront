import { BaseSubscribable, type TimerHandle } from "@omnifront/core"
import type { QueryClient, QueryKey, QueryState } from "@omnifront/query"

export interface DevtoolsQuery {
	hash: string
	queryKey: QueryKey
	state: QueryState
	/** Something is subscribed to this entry (a mounted component). Unobserved entries wait for gc. */
	observed: boolean
}

export interface DevtoolsSnapshot {
	queries: readonly DevtoolsQuery[]
}

/**
 * A headless view of the query cache, as a Subscribable so any UI (the bundled panel, a browser
 * extension, a console logger) can bind to it. The cache has no change events of its own, so while
 * somebody is subscribed the model looks for changes every `interval` ms (default 500) and only
 * notifies when something actually changed. Nothing runs while nobody listens.
 */
export class DevtoolsModel extends BaseSubscribable<DevtoolsSnapshot> {
	private snapshot: DevtoolsSnapshot = { queries: [] }
	private timer: TimerHandle | undefined

	constructor(
		private readonly client: QueryClient,
		private readonly interval = 500,
	) {
		super()
	}

	/** The same object until some entry's state, observed flag or membership changes. */
	getSnapshot(): DevtoolsSnapshot {
		const next: DevtoolsQuery[] = this.client.getQueries().map(({ key: queryKey, query }) => ({
			hash: JSON.stringify(queryKey),
			queryKey,
			state: query.getSnapshot(),
			observed: query.hasListeners,
		}))
		const previous = this.snapshot.queries
		const same =
			next.length === previous.length &&
			next.every((q, i) => q.hash === previous[i]?.hash && q.state === previous[i]?.state && q.observed === previous[i]?.observed)
		if (!same) this.snapshot = { queries: next }
		return this.snapshot
	}

	/** Mark an entry outdated; mounted observers refetch it. */
	invalidate(queryKey: QueryKey): Promise<void> {
		return this.client.invalidateQueries({ queryKey, exact: true })
	}

	/** Abort an entry's in-flight request. */
	cancel(queryKey: QueryKey): void {
		this.client.cancelQuery(queryKey)
	}

	protected override onSubscribe(): void {
		this.getSnapshot()
		this.schedule()
	}

	protected override onUnsubscribe(): void {
		if (this.timer !== undefined) this.client.scheduler.clearTimeout(this.timer)
		this.timer = undefined
	}

	private schedule(): void {
		this.timer = this.client.scheduler.setTimeout(() => {
			const before = this.snapshot
			if (this.getSnapshot() !== before) this.notify()
			this.schedule()
		}, this.interval)
	}
}

export function createDevtoolsModel(client: QueryClient, interval?: number): DevtoolsModel {
	return new DevtoolsModel(client, interval)
}
