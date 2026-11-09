import { signal } from "@angular/core"
import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { describe, expect, it } from "vitest"
import { injectMutation, provideOmnifront } from "../src"
import { injectIsFetching, injectIsMutating } from "../src/activity"
import { flushEffects, mountInjectable } from "./mount"

const newClient = () => new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
const hang = () => new Promise<string>(() => {})
const tick = () => new Promise((r) => setTimeout(r, 0))

describe("injectIsFetching", () => {
	it("follows a filter function that reads signals", async () => {
		const client = newClient()
		const key = signal("a")
		const { result, unmount } = mountInjectable(() => injectIsFetching(() => ({ queryKey: [key()] })), [provideOmnifront(client)])
		flushEffects()
		void client.fetchQuery(["a"], hang)
		void client.fetchQuery(["b"], hang)
		await tick()
		expect(result()).toBe(1)
		key.set("b")
		flushEffects()
		expect(result()).toBe(1)
		key.set("c")
		flushEffects()
		expect(result()).toBe(0)
		unmount()
	})

	it("stops following the client when the injector is destroyed", async () => {
		const client = newClient()
		const { result, unmount } = mountInjectable(() => injectIsFetching(), [provideOmnifront(client)])
		void client.fetchQuery(["a"], hang)
		await tick()
		expect(result()).toBe(1)
		unmount()
		void client.fetchQuery(["b"], hang)
		await tick()
		expect(result()).toBe(1)
	})
})

describe("injectMutation without a provider", () => {
	it("still works; it just has no client to count towards", async () => {
		const { result, unmount } = mountInjectable(() => injectMutation({ mutationFn: (n: number) => Promise.resolve(n * 2) }))
		await expect(result.mutateAsync(4)).resolves.toBe(8)
		unmount()
	})

	it("counts towards injectIsMutating under the same client", async () => {
		const client = newClient()
		let release!: () => void
		const { result, unmount } = mountInjectable(
			() => ({ mutating: injectIsMutating(), mutation: injectMutation({ mutationFn: () => new Promise<void>((r) => (release = r)) }) }),
			[provideOmnifront(client)],
		)
		result.mutation.mutate()
		await tick()
		expect(result.mutating()).toBe(1)
		release()
		await tick()
		expect(result.mutating()).toBe(0)
		unmount()
	})
})
