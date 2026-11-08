import { derive, shallowEqual } from "@unicore/core"
import { describe, expect, expectTypeOf, it } from "vitest"
import { createStore, Store } from "../src"

describe("store types", () => {
	it("infers state from a plain object", () => {
		const s = createStore({ count: 0, name: "a" })
		expectTypeOf(s).toEqualTypeOf<Store<{ count: number; name: string }>>()
		expectTypeOf(s.getState()).toEqualTypeOf<{ count: number; name: string }>()
		s.setState({ count: 1 })
		s.setState((st) => ({ count: st.count + 1 }))
		// @ts-expect-error count is a number
		s.setState({ count: "1" })
		// @ts-expect-error unknown key
		s.setState({ nope: 1 })
		expect(true).toBe(true)
	})

	it("types set and get inside the creator", () => {
		const s = createStore<{ n: number; inc(): void }>((set, get) => ({
			n: 0,
			inc: () => {
				expectTypeOf(get().n).toEqualTypeOf<number>()
				set((st) => ({ n: st.n + 1 }))
			},
		}))
		expectTypeOf(s.getState().inc).toEqualTypeOf<() => void>()
	})

	it("derive infers the selected type, and shallowEqual fits equals", () => {
		const s = createStore({ a: 1, b: "x" })
		const a = derive(s, (st) => st.a)
		expectTypeOf(a.getSnapshot()).toEqualTypeOf<number>()
		const pair = derive(s, (st) => ({ a: st.a, b: st.b }), shallowEqual)
		expectTypeOf(pair.getSnapshot()).toEqualTypeOf<{ a: number; b: string }>()
		// @ts-expect-error the selector must read existing fields
		derive(s, (st) => st.missing)
	})
})
