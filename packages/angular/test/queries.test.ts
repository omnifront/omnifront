import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { describe, expect, it } from "vitest"
import { provideOmnifront } from "../src"
import { injectQueries } from "../src/queries"
import { mountInjectable } from "./mount"

describe("injectQueries", () => {
	it("accepts a plain array and refetches one query on demand", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		let n = 0
		const { result, unmount } = mountInjectable(
			() => injectQueries([{ queryKey: ["a"], queryFn: () => Promise.resolve(++n), staleTime: Infinity }]),
			[provideOmnifront(client)],
		)
		await new Promise((r) => setTimeout(r, 0))
		expect(result()[0]?.data).toBe(1)
		await result()[0]?.refetch()
		expect(result()[0]?.data).toBe(2)
		unmount()
	})

	it("takes TanStack's { queries, combine } object too", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		const queries = [
			{ queryKey: ["a"], queryFn: () => Promise.resolve(1), staleTime: Infinity },
			{ queryKey: ["b"], queryFn: () => Promise.resolve(2), staleTime: Infinity },
		]
		const plain = mountInjectable(() => injectQueries<number>({ queries }), [provideOmnifront(client)])
		const joined = mountInjectable(
			() => injectQueries<number, number>({ queries: () => queries, combine: (rs) => rs.reduce((sum, r) => sum + (r.data ?? 0), 0) }),
			[provideOmnifront(client)],
		)
		await new Promise((r) => setTimeout(r, 0))
		expect(plain.result().map((r) => r.data)).toEqual([1, 2])
		expect(joined.result()).toBe(3)
		plain.unmount()
		joined.unmount()
	})
})
