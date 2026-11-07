import { describe, expect, it, vi } from "vitest"
import { notifyManager } from "../src/notify-manager"

describe("notifyManager", () => {
	it("runs a listener immediately outside a batch", () => {
		const l = vi.fn()
		notifyManager.schedule(l)
		expect(l).toHaveBeenCalledTimes(1)
	})

	it("defers listeners until the batch ends and dedupes them", () => {
		const l = vi.fn()
		notifyManager.batch(() => {
			notifyManager.schedule(l)
			notifyManager.schedule(l)
			expect(l).not.toHaveBeenCalled()
		})
		expect(l).toHaveBeenCalledTimes(1)
	})

	it("flushes only when the outermost batch ends", () => {
		const l = vi.fn()
		notifyManager.batch(() => {
			notifyManager.batch(() => notifyManager.schedule(l))
			expect(l).not.toHaveBeenCalled()
		})
		expect(l).toHaveBeenCalledTimes(1)
	})

	it("returns the value of fn", () => {
		expect(notifyManager.batch(() => 42)).toBe(42)
	})

	it("still flushes when fn throws", () => {
		const l = vi.fn()
		expect(() =>
			notifyManager.batch(() => {
				notifyManager.schedule(l)
				throw new Error("boom")
			}),
		).toThrow("boom")
		expect(l).toHaveBeenCalledTimes(1)
	})

	it("runs every listener even if one throws, then rethrows the first error", () => {
		const after = vi.fn()
		const bad = () => {
			throw new Error("first")
		}
		const bad2 = () => {
			throw new Error("second")
		}
		expect(() =>
			notifyManager.batch(() => {
				notifyManager.schedule(bad)
				notifyManager.schedule(bad2)
				notifyManager.schedule(after)
			}),
		).toThrow("first")
		expect(after).toHaveBeenCalledTimes(1)
	})
})
