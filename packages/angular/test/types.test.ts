import type { Signal } from "@angular/core"
import { createStore } from "@omnifront/store"
import { describe, expect, expectTypeOf, it } from "vitest"
import { injectMutation, injectQuery, injectStore } from "../src"

function injectables() {
	const q = injectQuery({ queryKey: ["k"], queryFn: async () => 42 })
	expectTypeOf(q.data).toEqualTypeOf<Signal<number | undefined>>()
	expectTypeOf(q.status()).toEqualTypeOf<"idle" | "loading" | "success" | "error">()

	const m = injectMutation({ mutationFn: (s: string) => Promise.resolve(s.length) })
	expectTypeOf(m.data).toEqualTypeOf<Signal<number | undefined>>()
	m.mutate("x")
	// @ts-expect-error variables must be a string
	m.mutate(1)

	const store = createStore({ count: 0 })
	expectTypeOf(injectStore(store, (s) => s.count)).toEqualTypeOf<Signal<number>>()
}

describe("angular types", () => {
	it("compiles", () => {
		expect(typeof injectables).toBe("function")
	})
})
