import { notifyManager } from "./notify-manager"

export interface Subscribable<TSnapshot> {
	/** Register a listener; returns an unsubscribe function. */
	subscribe(listener: () => void): () => void
	/** Current state. Must return the SAME reference until something changes. */
	getSnapshot(): TSnapshot
	/** Optional: snapshot used during SSR. */
	getServerSnapshot?(): TSnapshot
}

/**
 * Shared plumbing for everything the UI listens to (ADR-0001, rule 4):
 * the first subscriber triggers `onSubscribe`, the last one leaving triggers
 * `onUnsubscribe`. Lifecycle follows subscriber count, never the framework.
 */
export abstract class BaseSubscribable<TSnapshot> implements Subscribable<TSnapshot> {
	private readonly listeners = new Set<() => void>()

	// Arrow property so it can be passed around unbound (e.g. to useSyncExternalStore).
	subscribe = (listener: () => void): (() => void) => {
		// Wrap so the same function subscribed twice is two independent subscriptions.
		const entry = (): void => listener()
		this.listeners.add(entry)
		if (this.listeners.size === 1) this.onSubscribe()
		return () => {
			if (this.listeners.delete(entry) && this.listeners.size === 0) this.onUnsubscribe()
		}
	}

	abstract getSnapshot(): TSnapshot

	get hasListeners(): boolean {
		return this.listeners.size > 0
	}

	/** Call after the snapshot changed. Listeners run once per batch. */
	protected notify(): void {
		notifyManager.batch(() => {
			for (const entry of this.listeners) notifyManager.schedule(entry)
		})
	}

	protected onSubscribe(): void {}
	protected onUnsubscribe(): void {}
}
