import { FakeScheduler } from "@unicore/core/testing"
import { describe, expect, it } from "vitest"
import { QueryClient, QueryObserver } from "../src"
import { replaceEqualDeep } from "../src/structural"

describe("replaceEqualDeep", () => {
	it("returns the previous reference when nothing changed, even if next is a new object", () => {
		const previous = { a: [1, 2, { b: 3 }], c: "x" }
		expect(replaceEqualDeep(previous, structuredClone(previous))).toBe(previous)
	})

	it("keeps the identity of unchanged parts, and replaces only the changed branch", () => {
		const previous = { list: [{ id: 1, v: "a" }, { id: 2, v: "b" }], meta: { total: 2 } }
		const next = { list: [{ id: 1, v: "a" }, { id: 2, v: "CHANGED" }], meta: { total: 2 } }
		const result = replaceEqualDeep(previous, next)
		expect(result).toEqual(next)
		expect(result).not.toBe(previous)
		expect(result.list).not.toBe(previous.list)
		expect(result.list[0]).toBe(previous.list[0])
		expect(result.meta).toBe(previous.meta)
	})

	it("handles arrays that grow, shrink or reorder", () => {
		const previous = [{ id: 1 }, { id: 2 }]
		expect(replaceEqualDeep(previous, [{ id: 1 }, { id: 2 }, { id: 3 }])).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
		expect(replaceEqualDeep(previous, [{ id: 1 }])).toEqual([{ id: 1 }])
		const grown = replaceEqualDeep(previous, [{ id: 1 }, { id: 2 }, { id: 3 }])
		expect(grown[0]).toBe(previous[0])
		expect(replaceEqualDeep(previous, [{ id: 2 }, { id: 1 }])).toEqual([{ id: 2 }, { id: 1 }])
	})

	it("distinguishes a missing key from an undefined value and treats primitives and odd types by reference", () => {
		const previous = { a: undefined }
		expect(replaceEqualDeep(previous, {} as { a?: undefined })).toEqual({})
		expect(replaceEqualDeep(previous, {} as { a?: undefined })).not.toBe(previous)
		expect(replaceEqualDeep(1, 2)).toBe(2)
		expect(replaceEqualDeep("a", "a")).toBe("a")
		expect(replaceEqualDeep(null, { a: 1 })).toEqual({ a: 1 })
		expect(replaceEqualDeep({ a: 1 }, [1])).toEqual([1])
		const date = new Date(0)
		expect(replaceEqualDeep({ d: new Date(0) }, { d: date }).d).toBe(date) // not plain: by reference
		class Box {}
		const box = new Box()
		expect(replaceEqualDeep(new Box(), box)).toBe(box)
		expect(replaceEqualDeep(Object.create(null) as object, { a: 1 })).toEqual({ a: 1 })
	})
})

describe("QueryClient structuralSharing", () => {
	const setup = (sharing?: typeof replaceEqualDeep) =>
		new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity, structuralSharing: sharing as never })

	it("is off by default: a refetch with equal data gives a new reference", async () => {
		const client = setup()
		await client.fetchQuery(["k"], () => Promise.resolve({ a: 1 }))
		const first = client.getQueryData(["k"])
		await client.fetchQuery(["k"], () => Promise.resolve({ a: 1 }))
		expect(client.getQueryData(["k"])).not.toBe(first)
	})

	it("when enabled, a refetch with equal data keeps the reference, and observers are not re-notified with new data", async () => {
		const client = setup(replaceEqualDeep)
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve({ list: [1, 2], other: { x: 1 } }), staleTime: Infinity })
		o.subscribe(() => {})
		await o.refetch()
		const first = o.getSnapshot().data
		await o.refetch()
		expect(o.getSnapshot().data).toBe(first)
	})

	it("also applies to setQueryData, and a change replaces only what changed", async () => {
		const client = setup(replaceEqualDeep)
		client.setQueryData(["k"], { a: { n: 1 }, b: { n: 2 } })
		const first = client.getQueryData<{ a: { n: number }; b: { n: number } }>(["k"])
		client.setQueryData(["k"], { a: { n: 1 }, b: { n: 3 } })
		const second = client.getQueryData<{ a: { n: number }; b: { n: number } }>(["k"])
		expect(second).not.toBe(first)
		expect(second?.a).toBe(first?.a)
		expect(second?.b).toEqual({ n: 3 })
	})
})
