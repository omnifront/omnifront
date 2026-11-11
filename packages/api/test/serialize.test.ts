import { describe, expect, it } from "vitest"
import { createApi } from "../src"
import {
	createParamsSerializer,
	formToJSON,
	formTransform,
	patchForm,
	postForm,
	putForm,
	toFormData,
	toURLEncoded,
} from "../src/serialize"
import { createMockAdapter } from "../src/testing"

const data = { a: [1, 2], o: { x: "y z" }, d: new Date(0), n: null, u: undefined, b: true, list: [{ id: 1 }, { id: 2 }] }

describe("createParamsSerializer", () => {
	it("formats arrays like axios: brackets by default, indexes, or repeated names", () => {
		const decoded = (options?: Parameters<typeof createParamsSerializer>[0]) =>
			decodeURIComponent(createParamsSerializer(options)(data))
		expect(decoded()).toBe("a[]=1&a[]=2&o[x]=y z&d=1970-01-01T00:00:00.000Z&n=&b=true&list[0][id]=1&list[1][id]=2")
		expect(decoded({ indexes: true })).toContain("a[0]=1&a[1]=2")
		expect(decoded({ indexes: null })).toContain("a=1&a=2&")
		expect(decoded({ indexes: null })).toContain("list[0][id]=1")
		expect(decoded({ dots: true })).toContain("o.x=y z")
		expect(createParamsSerializer()({ "k y": "v&" })).toBe("k%20y=v%26")
		expect(createParamsSerializer({ encode: (v) => v.toUpperCase() })({ k: "v" })).toBe("K=V")
	})

	it("plugs into the client", async () => {
		const adapter = createMockAdapter(() => ({ data: {} }))
		const api = createApi({ adapter, paramsSerializer: createParamsSerializer({ indexes: null }) })
		await api.get("/x", { params: { tag: ["a", "b"] } })
		expect(adapter.calls[0]!.url).toBe("/x?tag=a&tag=b")
	})
})

describe("toURLEncoded / toFormData / formToJSON", () => {
	it("toURLEncoded builds a URLSearchParams body", () => {
		const body = toURLEncoded({ a: [1, 2], o: { x: 1 } })
		expect(body).toBeInstanceOf(URLSearchParams)
		expect(decodeURIComponent(body.toString())).toBe("a[]=1&a[]=2&o[x]=1")
		expect(toURLEncoded({ o: { x: 1 } }, { dots: true }).get("o.x")).toBe("1")
	})

	it("toFormData flattens objects, keeps blobs, and can add to an existing form", () => {
		const blob = new Blob(["hi"], { type: "text/plain" })
		const form = toFormData({ name: "n", file: blob, tags: ["a", "b"], meta: { when: new Date(0) }, skip: undefined, big: 10n })
		expect(form.get("name")).toBe("n")
		expect(form.get("file")).toBeInstanceOf(Blob)
		expect(form.getAll("tags[]")).toEqual(["a", "b"])
		expect(form.get("meta[when]")).toBe("1970-01-01T00:00:00.000Z")
		expect(form.has("skip")).toBe(false)
		expect(form.get("big")).toBe("10")
		const existing = new FormData()
		existing.append("x", "1")
		expect(toFormData({ y: [new Date(0), blob] }, existing, { indexes: true })).toBe(existing)
		expect([...existing.keys()]).toEqual(["x", "y[0]", "y[1]"])
	})

	it("formToJSON reverses it: nested names, lists and repeated names", () => {
		const form = toFormData({ user: { name: "a", roles: ["x", "y"] }, list: [{ id: "1" }, { id: "2" }] })
		form.append("dup", "1")
		form.append("dup", "2")
		form.append("dup", "3")
		form.append("dotted.key", "d")
		expect(formToJSON(form)).toEqual({
			user: { name: "a", roles: ["x", "y"] },
			list: [{ id: "1" }, { id: "2" }],
			dup: ["1", "2", "3"],
			dotted: { key: "d" },
		})
		expect(formToJSON(new URLSearchParams("a[0]=1&a[1]=2&b=3"))).toEqual({ a: ["1", "2"], b: "3" })
	})

	it("formToJSON cannot be used to reach into prototypes", () => {
		const form = new FormData()
		form.append("__proto__[polluted]", "1")
		form.append("constructor[prototype][polluted]", "1")
		form.append("toString", "mine")
		form.append("a", "scalar")
		form.append("a[b]", "object wins")
		expect(formToJSON(form)).toEqual({ toString: "mine", a: { b: "object wins" } })
		expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined()
	})
})

describe("formTransform and the form helpers", () => {
	it("converts a plain object according to the content type, and leaves everything else alone", async () => {
		const adapter = createMockAdapter(() => ({ data: {} }))
		const api = createApi({ adapter, transformRequest: formTransform() })
		await api.post("/m", { a: 1 }, { headers: { "Content-Type": "multipart/form-data" } })
		await api.post("/u", { a: [1, 2] }, { headers: { "content-type": "application/x-www-form-urlencoded" } })
		await api.post("/j", { a: 1 })
		await api.post("/s", "raw", { headers: { "content-type": "multipart/form-data" } })
		await api.post("/c", new (class Custom {})(), { headers: { "content-type": "multipart/form-data" } })
		const [multipart, urlencoded, json, raw, custom] = adapter.calls
		expect(multipart!.body).toBeInstanceOf(FormData)
		expect(multipart!.headers["content-type"]).toBeUndefined()
		expect(String(urlencoded!.body)).toBe("a%5B%5D=1&a%5B%5D=2")
		expect(urlencoded!.headers["content-type"]).toBe("application/x-www-form-urlencoded")
		expect(json!.body).toBe('{"a":1}')
		expect(raw!.body).toBe("raw")
		expect(custom!.body).toBe("{}")
	})

	it("postForm / putForm / patchForm send FormData", async () => {
		const adapter = createMockAdapter(() => ({ data: { ok: true } }))
		const api = createApi({ adapter })
		const ready = new FormData()
		expect((await postForm<{ ok: boolean }>(api, "/a", { x: 1 })).data.ok).toBe(true)
		await putForm(api, "/b", ready, { headers: { "x-test": "1" } })
		await patchForm(api, "/c", Object.assign(Object.create(null) as object, { y: 2 }))
		expect(adapter.calls.map((c) => c.method)).toEqual(["POST", "PUT", "PATCH"])
		expect((adapter.calls[0]!.body as FormData).get("x")).toBe("1")
		expect(adapter.calls[1]!.body).toBe(ready)
		expect(adapter.calls[1]!.headers["x-test"]).toBe("1")
		expect((adapter.calls[2]!.body as FormData).get("y")).toBe("2")
	})
})
