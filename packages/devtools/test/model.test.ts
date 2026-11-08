import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient, QueryObserver } from "@unicore/query"
import { describe, expect, it, vi } from "vitest"
import { createDevtoolsModel } from "../src"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const setup = () => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}

describe("DevtoolsModel", () => {
	it("lists cache entries with state and whether they are observed", async () => {
		const { client } = setup()
		const model = createDevtoolsModel(client)
		expect(model.getSnapshot().queries).toEqual([])
		client.setQueryData(["todos", { page: 1 }], ["a"])
		const off = new QueryObserver(client, { queryKey: ["todos", { page: 1 }], queryFn: async () => ["a"], staleTime: Infinity }).subscribe(() => {})
		const [entry] = model.getSnapshot().queries
		expect(entry).toMatchObject({ hash: '["todos",{"page":1}]', observed: true })
		expect(entry?.state).toMatchObject({ status: "success", data: ["a"] })
		off()
		expect(model.getSnapshot().queries[0]?.observed).toBe(false)
	})

	it("returns the same snapshot until something changes", () => {
		const { client } = setup()
		const model = createDevtoolsModel(client)
		client.setQueryData(["a"], 1)
		const first = model.getSnapshot()
		expect(model.getSnapshot()).toBe(first)
		client.setQueryData(["a"], 2)
		expect(model.getSnapshot()).not.toBe(first)
	})

	it("polls only while subscribed, notifies only on change, and stops on unsubscribe", () => {
		const { client, scheduler } = setup()
		const model = createDevtoolsModel(client, 200)
		expect(scheduler.pendingTimers).toBe(0)
		const listener = vi.fn()
		const off = model.subscribe(listener)
		scheduler.advance(1000)
		expect(listener).not.toHaveBeenCalled() // nothing changed
		client.setQueryData(["a"], 1)
		scheduler.advance(200)
		expect(listener).toHaveBeenCalledTimes(1)
		off()
		expect(scheduler.pendingTimers).toBe(0)
	})

	it("can invalidate (exactly) and cancel entries", async () => {
		const { client } = setup()
		const model = createDevtoolsModel(client)
		const fn = vi.fn(() => Promise.resolve(1))
		const other = vi.fn(() => Promise.resolve(1))
		const offs = [
			new QueryObserver(client, { queryKey: ["a"], queryFn: fn, staleTime: Infinity }).subscribe(() => {}),
			new QueryObserver(client, { queryKey: ["a", "child"], queryFn: other, staleTime: Infinity }).subscribe(() => {}),
		]
		await flush()
		await model.invalidate(["a"])
		expect(fn).toHaveBeenCalledTimes(2)
		expect(other).toHaveBeenCalledTimes(1) // exact match only, not the child key

		client.fetchQuery(["slow"], () => new Promise(() => {})).catch(() => {})
		model.cancel(["slow"])
		expect(client.getQueryState(["slow"])?.isFetching).toBe(false)
		offs.forEach((off) => off())
	})
})
