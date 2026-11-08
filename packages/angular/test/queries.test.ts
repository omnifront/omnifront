import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "@unicore/query"
import { describe, expect, it } from "vitest"
import { provideUnicore } from "../src"
import { injectQueries } from "../src/queries"
import { mountInjectable } from "./mount"

describe("injectQueries", () => {
	it("accepts a plain array and refetches one query on demand", async () => {
		const client = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		let n = 0
		const { result, unmount } = mountInjectable(
			() => injectQueries([{ queryKey: ["a"], queryFn: () => Promise.resolve(++n), staleTime: Infinity }]),
			[provideUnicore(client)],
		)
		await new Promise((r) => setTimeout(r, 0))
		expect(result()[0]?.data).toBe(1)
		await result()[0]?.refetch()
		expect(result()[0]?.data).toBe(2)
		unmount()
	})
})
