import { BaseSubscribable } from "./subscribable"

/**
 * A boolean the outside world controls ("is the page focused", "is the network up").
 * `listen` connects to the outside and returns a cleanup; it only runs while somebody is
 * subscribed (ADR-0001 rule 4), so it costs nothing in Node or on the server. `set` overrides
 * the value from anywhere: React Native's AppState, a test, your own heuristics.
 */
export class EnvironmentSignal extends BaseSubscribable<boolean> {
	private value = true
	private stop: (() => void) | undefined

	constructor(private readonly listen: (set: (value: boolean) => void) => () => void) {
		super()
	}

	getSnapshot(): boolean {
		return this.value
	}

	set(value: boolean): void {
		if (value === this.value) return
		this.value = value
		this.notify()
	}

	protected override onSubscribe(): void {
		this.stop = this.listen((value) => this.set(value))
	}

	protected override onUnsubscribe(): void {
		this.stop?.()
		this.stop = undefined
	}
}
