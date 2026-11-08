import { BaseSubscribable, type Subscribable } from "./subscribable"

class Combined<T> extends BaseSubscribable<readonly T[]> {
	private live: readonly T[] = []
	private server: readonly T[] = []
	private stops: Array<() => void> = []

	constructor(private readonly sources: readonly Subscribable<T>[]) {
		super()
	}

	getSnapshot(): readonly T[] {
		return (this.live = this.merge(this.live, (s) => s.getSnapshot()))
	}

	getServerSnapshot(): readonly T[] {
		return (this.server = this.merge(this.server, (s) => (s.getServerSnapshot ? s.getServerSnapshot() : s.getSnapshot())))
	}

	// The same array while every source still returns the same snapshot, a new one otherwise.
	private merge(previous: readonly T[], read: (source: Subscribable<T>) => T): readonly T[] {
		const next = this.sources.map(read)
		return next.length === previous.length && next.every((value, i) => value === previous[i]) ? previous : next
	}

	protected override onSubscribe(): void {
		this.stops = this.sources.map((source) => source.subscribe(() => this.notify()))
	}

	protected override onUnsubscribe(): void {
		this.stops.forEach((stop) => stop())
		this.stops = []
	}
}

/**
 * Several Subscribables as one: a Subscribable of the array of their snapshots. The array keeps its
 * identity until some source's snapshot changes, and each source is only listened to while the
 * combined one has listeners. This is what `useQueries` is built on.
 */
export function combine<T>(sources: readonly Subscribable<T>[]): Subscribable<readonly T[]> {
	return new Combined(sources)
}
