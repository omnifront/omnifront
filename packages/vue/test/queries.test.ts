import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { createSSRApp, defineComponent, h } from "vue"
import { renderToString } from "vue/server-renderer"
import { afterEach, describe, expect, it, vi } from "vitest"
import { QueryPlugin } from "../src"
import { useQueries } from "../src/queries"
import { mountComposable } from "./mount"

const newClient = () => new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
afterEach(() => vi.unstubAllGlobals())

describe("useQueries", () => {
	it("refetches one query on demand", async () => {
		const client = newClient()
		let n = 0
		const { result, unmount } = mountComposable(
			() => useQueries([{ queryKey: ["a"], queryFn: () => Promise.resolve(++n), staleTime: Infinity }]),
			client,
		)
		await new Promise((r) => setTimeout(r, 0))
		await result.value[0]?.refetch()
		expect(result.value[0]?.data).toBe(2)
		unmount()
	})

	it("fetches on the server before rendering, failing fast, and renders every result", async () => {
		const client = newClient()
		vi.stubGlobal("window", undefined)
		const bad = vi.fn(() => Promise.reject(new Error("down")))
		const Comp = defineComponent({
			setup() {
				const results = useQueries<number>([
					{ queryKey: ["a"], queryFn: () => Promise.resolve(1) },
					{ queryKey: ["b"], queryFn: bad },
				])
				return () => h("p", results.value.map((r) => `${r.status}:${r.data}`).join(","))
			},
		})
		const html = await renderToString(createSSRApp(Comp).use(QueryPlugin, client))
		expect(html).toContain("success:1,error:undefined")
		expect(bad).toHaveBeenCalledTimes(1)
	})

	it("an explicit option change on the same keys updates the observers instead of rebuilding", async () => {
		const client = newClient()
		const { result, unmount } = mountComposable(
			() => {
				const list = [{ queryKey: ["a"], queryFn: () => Promise.resolve(1), enabled: false }]
				return { list, queries: useQueries(() => list) }
			},
			client,
		)
		expect(result.queries.value[0]?.status).toBe("idle")
		unmount()
	})
})
