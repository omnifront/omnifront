import "fake-indexeddb/auto"
import { FakeScheduler } from "@omnifront/core/testing"
import { QueryClient } from "@omnifront/query"
import { describe, expect, it } from "vitest"
import { persistQueryClient } from "../src"
import { createIndexedDBStorage } from "../src/indexeddb"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 20))

describe("createIndexedDBStorage", () => {
	it("stores, reads and removes strings", async () => {
		const storage = createIndexedDBStorage({ dbName: "t1" })
		expect(await storage.getItem("a")).toBeUndefined()
		await storage.setItem("a", "1")
		expect(await storage.getItem("a")).toBe("1")
		await storage.setItem("a", "2")
		expect(await storage.getItem("a")).toBe("2")
		await storage.removeItem("a")
		expect(await storage.getItem("a")).toBeUndefined()
	})

	it("keeps databases separate, and a persisted cache survives a new client", async () => {
		const storage = createIndexedDBStorage({ dbName: "t2", storeName: "queries" })
		const first = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		const p1 = persistQueryClient(first, { storage })
		await p1.restored
		first.setQueryData(["k"], { hello: "world" })
		await p1.persist()
		p1.stop()

		const second = new QueryClient({ scheduler: new FakeScheduler(), gcTime: Infinity })
		const p2 = persistQueryClient(second, { storage: createIndexedDBStorage({ dbName: "t2", storeName: "queries" }) })
		expect(await p2.restored).toBe(true)
		expect(second.getQueryData(["k"])).toEqual({ hello: "world" })
		p2.stop()
		await flush()
		expect(await createIndexedDBStorage({ dbName: "other" }).getItem("omnifront-cache")).toBeUndefined()
	})

	it("rejects when the database cannot be opened", async () => {
		const original = indexedDB.open.bind(indexedDB)
		indexedDB.open = (() => {
			const request = {} as IDBOpenDBRequest
			queueMicrotask(() => {
				Object.defineProperty(request, "error", { value: new Error("blocked") })
				request.onerror?.(new Event("error"))
			})
			return request
		}) as typeof indexedDB.open
		await expect(createIndexedDBStorage({ dbName: "t3" }).getItem("a")).rejects.toThrow("blocked")
		indexedDB.open = original
	})
})
