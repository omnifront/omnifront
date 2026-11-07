import { describe, expect, it, vi } from "vitest"
import { BaseSubscribable } from "../src/subscribable"
import { notifyManager } from "../src/notify-manager"

class Counter extends BaseSubscribable<{ n: number }> {
	snapshot = { n: 0 }
	started = 0
	stopped = 0
	getSnapshot() {
		return this.snapshot
	}
	inc() {
		this.snapshot = { n: this.snapshot.n + 1 }
		this.notify()
	}
	protected override onSubscribe() {
		this.started++
	}
	protected override onUnsubscribe() {
		this.stopped++
	}
}

describe("BaseSubscribable", () => {
	it("calls onSubscribe for the first and onUnsubscribe for the last subscriber only", () => {
		const c = new Counter()
		const off1 = c.subscribe(() => {})
		const off2 = c.subscribe(() => {})
		expect(c.started).toBe(1)
		off1()
		expect(c.stopped).toBe(0)
		off2()
		expect(c.stopped).toBe(1)
		expect(c.hasListeners).toBe(false)
	})

	it("unsubscribe is idempotent", () => {
		const c = new Counter()
		const off = c.subscribe(() => {})
		off()
		off()
		expect(c.stopped).toBe(1)
	})

	it("treats the same function subscribed twice as two subscriptions", () => {
		const c = new Counter()
		const l = vi.fn()
		const off1 = c.subscribe(l)
		const off2 = c.subscribe(l)
		off1()
		expect(c.stopped).toBe(0)
		c.inc()
		expect(l).toHaveBeenCalledTimes(1)
		off2()
		expect(c.stopped).toBe(1)
	})

	it("notifies listeners, who read the new snapshot", () => {
		const c = new Counter()
		const seen: number[] = []
		c.subscribe(() => seen.push(c.getSnapshot().n))
		c.inc()
		expect(seen).toEqual([1])
	})

	it("coalesces notifications made inside a batch", () => {
		const c = new Counter()
		const l = vi.fn()
		c.subscribe(l)
		notifyManager.batch(() => {
			c.inc()
			c.inc()
			c.inc()
		})
		expect(l).toHaveBeenCalledTimes(1)
		expect(c.getSnapshot().n).toBe(3)
	})

	it("subscribe can be passed around unbound", () => {
		const c = new Counter()
		const { subscribe } = c
		const l = vi.fn()
		subscribe(l)
		c.inc()
		expect(l).toHaveBeenCalledTimes(1)
	})

	it("does not notify unsubscribed listeners", () => {
		const c = new Counter()
		const l = vi.fn()
		c.subscribe(l)()
		c.inc()
		expect(l).not.toHaveBeenCalled()
	})
})

describe("BaseSubscribable defaults", () => {
	it("works without overriding the lifecycle hooks", () => {
		class Plain extends BaseSubscribable<number> {
			getSnapshot() {
				return 1
			}
		}
		const p = new Plain()
		const off = p.subscribe(() => {})
		expect(p.hasListeners).toBe(true)
		off()
		expect(p.hasListeners).toBe(false)
	})
})
