import { BaseSubscribable } from "@omnifront/core"

/** A partial state to merge, or a function computing one from the current state. */
export type StateUpdate<T> = Partial<T> | ((state: T) => Partial<T>)
export type SetState<T> = (update: StateUpdate<T>) => void
export type StateCreator<T> = (set: SetState<T>, get: () => T) => T

/**
 * Plain-object state with actions kept inside it:
 *
 *   const counter = createStore<{ count: number; inc(): void }>((set) => ({
 *     count: 0,
 *     inc: () => set((s) => ({ count: s.count + 1 })),
 *   }))
 *
 * Every change makes a new state object (immutable snapshots); a change that sets nothing new
 * is ignored. Listeners are told through the shared notifyManager, so several `setState` calls
 * inside one `notifyManager.batch` produce one notification.
 */
export class Store<T extends object> extends BaseSubscribable<T> {
	private state: T
	private readonly initialState: T

	constructor(init: T | StateCreator<T>) {
		super()
		this.state = typeof init === "function" ? (init as StateCreator<T>)(this.setState, this.getState) : init
		this.initialState = this.state
	}

	getSnapshot(): T {
		return this.state
	}

	/** Same as getSnapshot; the name people expect from a store. */
	getState = (): T => this.state

	/** What the server renders, and what `reset()` goes back to. */
	getServerSnapshot(): T {
		return this.initialState
	}

	// Arrow properties: they get handed around (as `set` in the creator, to event handlers, ...).
	setState: SetState<T> = (update) => {
		const patch = typeof update === "function" ? update(this.state) : update
		const keys = Object.keys(patch) as Array<keyof T>
		if (keys.every((k) => Object.is(this.state[k], patch[k]))) return // nothing new
		this.state = { ...this.state, ...patch }
		this.notify()
	}

	reset = (): void => {
		if (this.state === this.initialState) return
		this.state = this.initialState
		this.notify()
	}
}

export function createStore<T extends object>(init: T | StateCreator<T>): Store<T> {
	return new Store(init)
}
