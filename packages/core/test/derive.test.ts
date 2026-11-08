import { describe, expect, it, vi } from "vitest"
import { derive, shallowEqual } from "../src/derive"
import { notifyManager } from "../src/notify-manager"
import { BaseSubscribable } from "../src/subscribable"

class Source extends BaseSubscribable<{ a: number; b: number; list: number[] }> {
	state = { a: 1, b: 1, list: [1, 2] }
	getSnapshot() {
		return this.state
	}
	set(patch: Partial<Source["state"]>) {
		this.state = { ...this.state, ...patch }
		this.notify()
	}
	getServerSnapshot() {
		return { a: 0, b: 0, list: [] }
	}
	get listening() {
		return this.hasListeners
	}
}

describe("shallowEqual", () => {
	it("compares by reference, then by members", () => {
		expect(shallowEqual(1, 1)).toBe(true)
		expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true)
		expect(shallowEqual([1, 2], [1, 2])).toBe(true)
		expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false)
		expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
		expect(shallowEqual({ a: undefined }, { b: undefined })).toBe(false)
		expect(shallowEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false)
		expect(shallowEqual(null, {})).toBe(false)
		expect(shallowEqual("a", "b")).toBe(false)
		expect(shallowEqual({}, null)).toBe(false)
	})
})

describe("derive", () => {
	it("selects a slice and only notifies when the slice changes", () => {
		const src = new Source()
		const d = derive(src, (s) => s.a)
		const l = vi.fn()
		d.subscribe(l)
		expect(d.getSnapshot()).toBe(1)
		src.set({ b: 2 })
		expect(l).not.toHaveBeenCalled()
		src.set({ a: 5 })
		expect(l).toHaveBeenCalledTimes(1)
		expect(d.getSnapshot()).toBe(5)
	})

	it("returns the same reference while the source snapshot is unchanged", () => {
		const src = new Source()
		const select = vi.fn((s: Source["state"]) => ({ sum: s.a + s.b }))
		const d = derive(src, select)
		expect(d.getSnapshot()).toBe(d.getSnapshot())
		expect(select).toHaveBeenCalledTimes(1)
	})

	it("keeps the old reference when equals says the new selection is equal", () => {
		const src = new Source()
		const d = derive(src, (s) => ({ a: s.a }), shallowEqual)
		const l = vi.fn()
		d.subscribe(l)
		const before = d.getSnapshot()
		src.set({ b: 9 }) // new source state, same {a}
		expect(d.getSnapshot()).toBe(before)
		expect(l).not.toHaveBeenCalled()
		src.set({ a: 2 })
		expect(d.getSnapshot()).not.toBe(before)
		expect(l).toHaveBeenCalledTimes(1)
	})

	it("listens to the source only while it has listeners", () => {
		const src = new Source()
		const d = derive(src, (s) => s.a)
		expect(src.listening).toBe(false)
		const off1 = d.subscribe(() => {})
		const off2 = d.subscribe(() => {})
		expect(src.listening).toBe(true)
		off1()
		expect(src.listening).toBe(true)
		off2()
		expect(src.listening).toBe(false)
	})

	it("reads fresh values even when nobody is subscribed", () => {
		const src = new Source()
		const d = derive(src, (s) => s.a)
		expect(d.getSnapshot()).toBe(1)
		src.set({ a: 3 })
		expect(d.getSnapshot()).toBe(3)
	})

	it("coalesces changes made inside a batch", () => {
		const src = new Source()
		const d = derive(src, (s) => s.a + s.b)
		const l = vi.fn()
		d.subscribe(l)
		notifyManager.batch(() => {
			src.set({ a: 2 })
			src.set({ b: 2 })
		})
		expect(l).toHaveBeenCalledTimes(1)
		expect(d.getSnapshot()).toBe(4)
	})

	it("can be derived again (chained)", () => {
		const src = new Source()
		const evens = derive(src, (s) => s.list.filter((n) => n % 2 === 0), shallowEqual)
		const count = derive(evens, (e) => e.length)
		const l = vi.fn()
		count.subscribe(l)
		src.set({ list: [1, 2, 3, 4] })
		expect(count.getSnapshot()).toBe(2)
		expect(l).toHaveBeenCalledTimes(1)
	})
})

describe("derive: server snapshot", () => {
	it("selects from the source's server snapshot, with a stable reference", () => {
		const src = new Source()
		const d = derive(src, (s) => ({ a: s.a }), shallowEqual)
		expect(d.getServerSnapshot?.()).toEqual({ a: 0 })
		src.set({ a: 7 })
		expect(d.getServerSnapshot?.()).toEqual({ a: 0 })
		expect(d.getServerSnapshot?.()).toBe(d.getServerSnapshot?.())
	})

	it("falls back to the live snapshot when the source has none", () => {
		const live = { state: { n: 1 }, getSnapshot() { return this.state }, subscribe: () => () => {} }
		const d = derive(live, (s) => s.n)
		expect(d.getServerSnapshot?.()).toBe(1)
		live.state = { n: 2 }
		expect(d.getServerSnapshot?.()).toBe(2)
	})

	it("keeps the old server selection when equals says equal", () => {
		const src = new Source()
		const d = derive(src, () => ({ x: 1 }), shallowEqual)
		const first = d.getServerSnapshot?.()
		const other = { state: { n: 2 }, getSnapshot() { return this.state }, subscribe: () => () => {}, getServerSnapshot() { return { n: Math.random() } } }
		const e = derive(other, () => ({ x: 1 }), shallowEqual)
		const a = e.getServerSnapshot?.()
		expect(e.getServerSnapshot?.()).not.toBe(undefined)
		expect(a).toBe(e.getServerSnapshot?.())
		expect(first).toBe(d.getServerSnapshot?.())
	})
})
