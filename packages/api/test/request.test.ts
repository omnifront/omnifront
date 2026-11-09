import { describe, expect, it } from "vitest"
import { applyTransforms, buildURL, encodeBody, mergeConfig, normalizeHeaders, serializeParams } from "../src/request"

describe("serializeParams", () => {
	it("encodes primitives, skips null/undefined, repeats arrays, nests objects, formats dates", () => {
		const query = serializeParams({
			a: 1,
			b: "x y",
			c: undefined,
			d: null,
			e: [1, 2],
			f: { g: true, h: { i: "j" } },
			when: new Date("2026-01-02T03:04:05.000Z"),
		})
		expect(decodeURIComponent(query)).toBe("a=1&b=x y&e=1&e=2&f[g]=true&f[h][i]=j&when=2026-01-02T03:04:05.000Z")
	})
})

describe("buildURL", () => {
	it("joins baseURL and path with exactly one slash", () => {
		expect(buildURL({ baseURL: "http://a.test/api/", url: "/todos" })).toBe("http://a.test/api/todos")
		expect(buildURL({ baseURL: "http://a.test", url: "todos" })).toBe("http://a.test/todos")
	})
	it("ignores baseURL for absolute urls", () => {
		expect(buildURL({ baseURL: "http://a.test", url: "https://b.test/x" })).toBe("https://b.test/x")
		expect(buildURL({ baseURL: "http://a.test", url: "//b.test/x" })).toBe("//b.test/x")
	})
	it("appends params with ? or & and honours a custom serializer", () => {
		expect(buildURL({ url: "/x", params: { a: 1 } })).toBe("/x?a=1")
		expect(buildURL({ url: "/x?z=1", params: { a: 1 } })).toBe("/x?z=1&a=1")
		expect(buildURL({ url: "/x", params: {} })).toBe("/x")
		expect(buildURL({ url: "/x", params: { a: 1 }, paramsSerializer: () => "custom=1" })).toBe("/x?custom=1")
		expect(buildURL({})).toBe("")
	})
})

describe("mergeConfig", () => {
	it("later wins, undefined never overrides, headers and params merge, names are lower-cased", () => {
		const merged = mergeConfig(
			{ baseURL: "a", timeout: 5, headers: { "X-A": "1", Accept: "x" }, params: { p: 1 }, meta: { m: 1 } },
			undefined,
			{ baseURL: undefined, timeout: 9, headers: { accept: "y" }, params: { q: 2 }, meta: { n: 2 } },
		)
		expect(merged).toEqual({
			baseURL: "a",
			timeout: 9,
			headers: { "x-a": "1", accept: "y" },
			params: { p: 1, q: 2 },
			meta: { m: 1, n: 2 },
		})
	})
	it("omits params and meta when nobody set them", () => {
		expect(mergeConfig({ url: "/x" })).toEqual({ url: "/x", headers: {} })
	})
	it("normalizeHeaders handles undefined", () => {
		expect(normalizeHeaders(undefined)).toEqual({})
	})
})

describe("applyTransforms / encodeBody", () => {
	it("runs one or many transforms in order", () => {
		const add = (n: number) => (d: unknown) => (d as number) + n
		expect(applyTransforms(1, {}, undefined)).toBe(1)
		expect(applyTransforms(1, {}, add(1))).toBe(2)
		expect(applyTransforms(1, {}, [add(1), add(10)])).toBe(12)
	})
	it("JSON-encodes plain data and sets content-type unless already set", () => {
		const headers: Record<string, string> = {}
		expect(encodeBody({ a: 1 }, headers)).toBe('{"a":1}')
		expect(headers["content-type"]).toBe("application/json")
		const custom = { "content-type": "application/vnd.x+json" }
		encodeBody([1], custom)
		expect(custom["content-type"]).toBe("application/vnd.x+json")
	})
	it("passes strings and binary/form bodies through untouched, nothing for null", () => {
		const headers: Record<string, string> = {}
		expect(encodeBody("raw", headers)).toBe("raw")
		const form = new FormData()
		expect(encodeBody(form, headers)).toBe(form)
		const params = new URLSearchParams("a=1")
		expect(encodeBody(params, headers)).toBe(params)
		const bytes = new Uint8Array([1])
		expect(encodeBody(bytes, headers)).toBe(bytes)
		expect(encodeBody(undefined, headers)).toBeUndefined()
		expect(encodeBody(null, headers)).toBeUndefined()
		expect(headers).toEqual({})
	})
})
