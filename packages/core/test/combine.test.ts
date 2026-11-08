import { describe, expect, it, vi } from "vitest"
import { combine } from "../src/combine"
import { notifyManager } from "../src/notify-manager"
import { BaseSubscribable } from "../src/subscribable"

class Box extends BaseSubscribable<{ n: number }> {
	state = { n: 0 }
	getSnapshot() {
		return this.state
	}
	server = { n: -1 }
	getServerSnapshot() {
		return this.server
	}
	set(n: number) {
		this.state = { n }
		this.notify()
	}
	get listening() {
		return this.hasListeners
	}
}
class Plain extends BaseSubscribable<number> {
	getSnapshot() {
		return 1
	}
}

describe("combine", () => {
	it("is an array of the sources' snapshots, stable until one of them changes", () => {
		const a = new Box()
		const b = new Box()
		const all = combine([a, b])
		const first = all.getSnapshot()
		expect(first).toEqual([{ n: 0 }, { n: 0 }])
		expect(all.getSnapshot()).toBe(first)
		b.set(5)
		expect(all.getSnapshot()).not.toBe(first)
		expect(all.getSnapshot()[1]).toEqual({ n: 5 })
		expect(all.getSnapshot()[0]).toBe(first[0])
	})

	it("listens to every source only while it has listeners, and notifies on any change", () => {
		const a = new Box()
		const b = new Box()
		const all = combine([a, b])
		expect(a.listening).toBe(false)
		const l = vi.fn()
		const off = all.subscribe(l)
		expect(a.listening && b.listening).toBe(true)
		a.set(1)
		b.set(2)
		expect(l).toHaveBeenCalledTimes(2)
		off()
		expect(a.listening || b.listening).toBe(false)
	})

	it("coalesces changes made in one batch", () => {
		const a = new Box()
		const b = new Box()
		const all = combine([a, b])
		const l = vi.fn()
		all.subscribe(l)
		notifyManager.batch(() => {
			a.set(1)
			b.set(1)
		})
		expect(l).toHaveBeenCalledTimes(1)
	})

	it("server snapshot uses each source's server snapshot (or the live one), with a stable reference", () => {
		const all = combine<unknown>([new Box(), new Plain()])
		expect(all.getServerSnapshot?.()).toEqual([{ n: -1 }, 1])
		expect(all.getServerSnapshot?.()).toBe(all.getServerSnapshot?.())
	})

	it("works for an empty list and for a changing number of sources (a new combine per list)", () => {
		expect(combine([]).getSnapshot()).toEqual([])
		const small = combine([new Plain()])
		const large = combine([new Plain(), new Plain()])
		expect(small.getSnapshot()).toHaveLength(1)
		expect(large.getSnapshot()).toHaveLength(2)
	})
})
