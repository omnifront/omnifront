import { describe, expect, it } from "vitest"
import { hashKey } from "../src/hash-key"

describe("hashKey", () => {
	it("ignores object key order, at any depth", () => {
		expect(hashKey(["todos", { b: 2, a: { y: 1, x: 2 } }])).toBe(
			hashKey(["todos", { a: { x: 2, y: 1 }, b: 2 }]),
		)
	})

	it("keeps array order and distinguishes values", () => {
		expect(hashKey(["a", "b"])).not.toBe(hashKey(["b", "a"]))
		expect(hashKey(["todos", 1])).not.toBe(hashKey(["todos", "1"]))
		expect(hashKey(["todos", null])).toBe('["todos",null]')
	})
})
