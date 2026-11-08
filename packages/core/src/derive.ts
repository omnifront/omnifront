import { BaseSubscribable, type Subscribable } from "./subscribable"

/** Shallow comparison of two values: same reference, or objects/arrays with identical members. */
export function shallowEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false
	const left = a as Record<string, unknown>
	const right = b as Record<string, unknown>
	const keys = Object.keys(left)
	return (
		keys.length === Object.keys(right).length &&
		keys.every((k) => Object.prototype.hasOwnProperty.call(right, k) && Object.is(left[k], right[k]))
	)
}

interface Memo<TSource, TSelected> {
	from: TSource | undefined
	value: TSelected | undefined
	ready: boolean
}
const emptyMemo = <A, B>(): Memo<A, B> => ({ from: undefined, value: undefined, ready: false })

class Derived<TSource, TSelected> extends BaseSubscribable<TSelected> {
	private readonly live = emptyMemo<TSource, TSelected>()
	private readonly server = emptyMemo<TSource, TSelected>()
	private unsubscribe: (() => void) | undefined

	constructor(
		private readonly source: Subscribable<TSource>,
		private readonly selector: (state: TSource) => TSelected,
		private readonly equals: (a: TSelected, b: TSelected) => boolean,
	) {
		super()
	}

	getSnapshot(): TSelected {
		return this.pick(this.live, this.source.getSnapshot())
	}

	/** Selection of the source's server snapshot (hydration-safe); falls back to the live one. */
	getServerSnapshot(): TSelected {
		const source = this.source
		return this.pick(this.server, source.getServerSnapshot ? source.getServerSnapshot() : source.getSnapshot())
	}

	private pick(memo: Memo<TSource, TSelected>, state: TSource): TSelected {
		if (!memo.ready || state !== memo.from) {
			const next = this.selector(state)
			// Keep the old reference when the selection is "equal": nobody downstream re-renders.
			if (!memo.ready || !this.equals(memo.value as TSelected, next)) memo.value = next
			memo.from = state
			memo.ready = true
		}
		return memo.value as TSelected
	}

	// ADR-0001 rule 4: only listen to the source while somebody listens to us.
	protected override onSubscribe(): void {
		this.getSnapshot()
		this.unsubscribe = this.source.subscribe(() => {
			const before = this.live.value
			if (this.getSnapshot() !== before) this.notify()
		})
	}

	protected override onUnsubscribe(): void {
		this.unsubscribe?.()
		this.unsubscribe = undefined
	}
}

/**
 * A Subscribable that exposes a slice of another one (a store, a query observer, ...).
 * Listeners only run when the selected value changes (by `equals`, default `Object.is`),
 * which is the "select" the Subscribable contract leaves to this layer.
 */
export function derive<TSource, TSelected>(
	source: Subscribable<TSource>,
	selector: (state: TSource) => TSelected,
	equals: (a: TSelected, b: TSelected) => boolean = Object.is,
): Subscribable<TSelected> {
	return new Derived(source, selector, equals)
}
