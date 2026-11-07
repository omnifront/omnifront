import { describe, expect, it } from "vitest"
import { getRetryDelay, shouldRetry } from "../src/retry"

describe("shouldRetry", () => {
	it("number: retries that many times", () => {
		expect(shouldRetry(2, 1, null)).toBe(true)
		expect(shouldRetry(2, 2, null)).toBe(true)
		expect(shouldRetry(2, 3, null)).toBe(false)
		expect(shouldRetry(0, 1, null)).toBe(false)
	})
	it("boolean and default", () => {
		expect(shouldRetry(true, 99, null)).toBe(true)
		expect(shouldRetry(false, 1, null)).toBe(false)
		expect(shouldRetry(undefined, 1, null)).toBe(false)
	})
	it("function decides per failure", () => {
		const retry = (n: number, e: unknown) => n < 3 && e === "transient"
		expect(shouldRetry(retry, 1, "transient")).toBe(true)
		expect(shouldRetry(retry, 1, "fatal")).toBe(false)
		expect(shouldRetry(retry, 3, "transient")).toBe(false)
	})
})

describe("getRetryDelay", () => {
	it("defaults to exponential backoff capped at 30s", () => {
		expect([1, 2, 3, 4].map((n) => getRetryDelay(undefined, n, null))).toEqual([1000, 2000, 4000, 8000])
		expect(getRetryDelay(undefined, 20, null)).toBe(30_000)
	})
	it("accepts a number or a function", () => {
		expect(getRetryDelay(250, 5, null)).toBe(250)
		expect(getRetryDelay((n) => n * 10, 3, null)).toBe(30)
	})
})
