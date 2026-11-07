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

import { matchesKey } from "../src/hash-key"

describe("matchesKey", () => {
	it("matches prefixes and partial objects", () => {
		expect(matchesKey(["todos", { page: 1, done: true }], ["todos"])).toBe(true)
		expect(matchesKey(["todos", { page: 1, done: true }], ["todos", { done: true }])).toBe(true)
		expect(matchesKey(["todos"], ["todos"])).toBe(true)
	})
	it("rejects different or longer filters", () => {
		expect(matchesKey(["todos"], ["users"])).toBe(false)
		expect(matchesKey(["todos"], ["todos", 1])).toBe(false)
		expect(matchesKey(["todos", { page: 1 }], ["todos", { page: 2 }])).toBe(false)
		expect(matchesKey(["todos", 1], ["todos", { a: 1 }])).toBe(false)
		expect(matchesKey(["todos", null], ["todos", { a: 1 }])).toBe(false)
		expect(matchesKey(["todos", { a: 1 }], ["todos", null])).toBe(false)
	})
})
