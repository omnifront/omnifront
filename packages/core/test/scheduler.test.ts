import { afterEach, describe, expect, it, vi } from "vitest"
import { defaultScheduler } from "../src/scheduler"
import { FakeScheduler } from "../src/testing"

describe("defaultScheduler", () => {
	afterEach(() => vi.useRealTimers())

	it("wraps real timers and clock", () => {
		vi.useFakeTimers()
		vi.setSystemTime(1000)
		const fn = vi.fn()
		const h = defaultScheduler.setTimeout(fn, 50)
		vi.advanceTimersByTime(50)
		expect(fn).toHaveBeenCalledTimes(1)
		expect(defaultScheduler.now()).toBe(1050)
		const fn2 = vi.fn()
		const h2 = defaultScheduler.setTimeout(fn2, 50)
		defaultScheduler.clearTimeout(h2)
		vi.advanceTimersByTime(100)
		expect(fn2).not.toHaveBeenCalled()
		expect(h).toBeDefined()
	})
})

describe("FakeScheduler", () => {
	it("moves time only on advance and runs due timers in order", () => {
		const s = new FakeScheduler()
		const order: string[] = []
		s.setTimeout(() => order.push("b"), 20)
		s.setTimeout(() => order.push("a"), 10)
		s.advance(9)
		expect(order).toEqual([])
		s.advance(11)
		expect(order).toEqual(["a", "b"])
		expect(s.now()).toBe(20)
	})

	it("clearTimeout cancels", () => {
		const s = new FakeScheduler()
		const fn = vi.fn()
		const h = s.setTimeout(fn, 5)
		s.clearTimeout(h)
		s.advance(10)
		expect(fn).not.toHaveBeenCalled()
		expect(s.pendingTimers).toBe(0)
	})

	it("runs timers scheduled by timers within the window", () => {
		const s = new FakeScheduler()
		const fn = vi.fn()
		s.setTimeout(() => s.setTimeout(fn, 5), 5)
		s.advance(10)
		expect(fn).toHaveBeenCalledTimes(1)
	})

	it("treats negative delays as zero", () => {
		const s = new FakeScheduler()
		const fn = vi.fn()
		s.setTimeout(fn, -5)
		s.advance(0)
		expect(fn).toHaveBeenCalledTimes(1)
	})
})
