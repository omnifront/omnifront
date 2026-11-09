import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { nextTick, shallowRef } from "vue"
import { describe, expect, it } from "vitest"
import { useMutation } from "../src"
import { useIsFetching, useIsMutating } from "../src/activity"
import { mountComposable } from "./mount"

const newClient = () => new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
const hang = () => new Promise<string>(() => {})

describe("useIsFetching", () => {
	it("follows a reactive filter (ref or getter)", async () => {
		const client = newClient()
		const key = shallowRef("a")
		const { result, unmount } = mountComposable(
			() => ({ viaRef: useIsFetching(shallowRef({ queryKey: ["a"] })), viaGetter: useIsFetching(() => ({ queryKey: [key.value] })) }),
			client,
		)
		void client.fetchQuery(["a"], hang)
		void client.fetchQuery(["b"], hang)
		await nextTick()
		expect([result.viaRef.value, result.viaGetter.value]).toEqual([1, 1])
		key.value = "b"
		await nextTick()
		expect(result.viaGetter.value).toBe(1)
		key.value = "c"
		await nextTick()
		expect(result.viaGetter.value).toBe(0)
		unmount()
	})

	it("stops following the client when the scope ends", async () => {
		const client = newClient()
		const { result, unmount } = mountComposable(() => useIsFetching(), client)
		void client.fetchQuery(["a"], hang)
		await nextTick()
		expect(result.value).toBe(1)
		unmount()
		void client.fetchQuery(["b"], hang)
		await nextTick()
		expect(result.value).toBe(1) // frozen at the last value, no new work
	})
})

describe("useMutation without the plugin", () => {
	it("still works; it just has no client to count towards", async () => {
		const { result, unmount } = mountComposable(() => useMutation({ mutationFn: (n: number) => Promise.resolve(n * 2) }))
		await expect(result.mutateAsync(4)).resolves.toBe(8)
		unmount()
	})

	it("counts towards useIsMutating when the plugin is installed", async () => {
		const client = newClient()
		let release!: () => void
		const { result, unmount } = mountComposable(
			() => ({ mutating: useIsMutating(), mutation: useMutation({ mutationFn: () => new Promise<void>((r) => (release = r)) }) }),
			client,
		)
		result.mutation.mutate()
		await nextTick()
		expect(result.mutating.value).toBe(1)
		release()
		await new Promise((r) => setTimeout(r, 0))
		expect(result.mutating.value).toBe(0)
		unmount()
	})
})
