import { describe, expect, it, vi } from "vitest"
import { EnvironmentSignal } from "../src/environment-signal"

describe("EnvironmentSignal", () => {
	it("connects to the outside only while subscribed, and cleans up", () => {
		const cleanup = vi.fn()
		const listen = vi.fn((set: (v: boolean) => void) => {
			set(false)
			return cleanup
		})
		const signal = new EnvironmentSignal(listen)
		expect(listen).not.toHaveBeenCalled()
		const l = vi.fn()
		const off1 = signal.subscribe(l)
		const off2 = signal.subscribe(() => {})
		expect(listen).toHaveBeenCalledTimes(1)
		expect(signal.getSnapshot()).toBe(false)
		off1()
		expect(cleanup).not.toHaveBeenCalled()
		off2()
		expect(cleanup).toHaveBeenCalledTimes(1)
	})

	it("notifies only when the value actually changes; set overrides from anywhere", () => {
		const signal = new EnvironmentSignal(() => () => {})
		const l = vi.fn()
		signal.subscribe(l)
		expect(signal.getSnapshot()).toBe(true)
		signal.set(true)
		expect(l).not.toHaveBeenCalled()
		signal.set(false)
		expect(l).toHaveBeenCalledTimes(1)
		expect(signal.getSnapshot()).toBe(false)
	})
})
