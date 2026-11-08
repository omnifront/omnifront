import { derive, notifyManager, shallowEqual } from "@omnifront/core"
import { describe, expect, it, vi } from "vitest"
import { createStore } from "../src"

interface Counter {
	count: number
	label: string
	inc(): void
	rename(label: string): void
}
const makeCounter = () =>
	createStore<Counter>((set, get) => ({
		count: 0,
		label: "a",
		inc: () => set((s) => ({ count: s.count + 1 })),
		rename: (label) => set({ label: `${label}${get().count}` }),
	}))

describe("createStore", () => {
	it("builds state from a creator that gets set and get; actions live in the state", () => {
		const s = makeCounter()
		s.getState().inc()
		s.getState().inc()
		s.getState().rename("x")
		expect(s.getState()).toMatchObject({ count: 2, label: "x2" })
	})

	it("also accepts a plain initial object", () => {
		const s = createStore({ n: 1 })
		s.setState({ n: 2 })
		expect(s.getSnapshot()).toEqual({ n: 2 })
		expect(s.getState()).toBe(s.getSnapshot())
	})

	it("every change is a new snapshot; setting nothing new is ignored", () => {
		const s = createStore({ n: 1, m: 1 })
		const l = vi.fn()
		s.subscribe(l)
		const before = s.getSnapshot()
		s.setState({ n: 1 })
		s.setState(() => ({}))
		expect(s.getSnapshot()).toBe(before)
		expect(l).not.toHaveBeenCalled()
		s.setState({ n: 2 })
		expect(s.getSnapshot()).not.toBe(before)
		expect(before).toEqual({ n: 1, m: 1 }) // old snapshot untouched
		expect(l).toHaveBeenCalledTimes(1)
	})

	it("batches several updates into one notification", () => {
		const s = createStore({ a: 0, b: 0 })
		const l = vi.fn()
		s.subscribe(l)
		notifyManager.batch(() => {
			s.setState({ a: 1 })
			s.setState({ b: 1 })
			s.setState((st) => ({ a: st.a + 1 }))
		})
		expect(l).toHaveBeenCalledTimes(1)
		expect(s.getState()).toEqual({ a: 2, b: 1 })
	})

	it("setState and reset can be used detached", () => {
		const s = createStore({ n: 0 })
		const { setState, reset } = s
		setState({ n: 5 })
		expect(s.getState().n).toBe(5)
		reset()
		expect(s.getState().n).toBe(0)
	})

	it("reset goes back to the initial state, notifying only if something changed", () => {
		const s = createStore({ n: 0 })
		const l = vi.fn()
		s.subscribe(l)
		s.reset()
		expect(l).not.toHaveBeenCalled()
		s.setState({ n: 3 })
		s.reset()
		expect(s.getState()).toEqual({ n: 0 })
		expect(l).toHaveBeenCalledTimes(2)
	})

	it("getServerSnapshot is always the initial state (hydration-safe)", () => {
		const s = createStore({ n: 0 })
		const initial = s.getServerSnapshot()
		s.setState({ n: 9 })
		expect(s.getServerSnapshot()).toBe(initial)
	})

	it("works with derive: selectors only notify when their slice changes", () => {
		const s = createStore({ a: 1, b: 1 })
		const a = derive(s, (st) => st.a)
		const pair = derive(s, (st) => ({ a: st.a }), shallowEqual)
		const la = vi.fn()
		const lp = vi.fn()
		a.subscribe(la)
		pair.subscribe(lp)
		s.setState({ b: 2 })
		expect(la).not.toHaveBeenCalled()
		expect(lp).not.toHaveBeenCalled()
		s.setState({ a: 2 })
		expect(la).toHaveBeenCalledTimes(1)
		expect(lp).toHaveBeenCalledTimes(1)
	})
})
