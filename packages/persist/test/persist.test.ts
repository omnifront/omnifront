import { FakeScheduler } from "@unicore/core/testing"
import { focusManager, QueryClient, QueryObserver } from "@unicore/query"
import { afterEach, describe, expect, it, vi } from "vitest"
import { persistQueryClient, type PersistedCache, type PersistStorage } from "../src"

class MemoryStorage implements PersistStorage {
	data = new Map<string, string>()
	writes = 0
	getItem = (key: string) => this.data.get(key) ?? null
	setItem = (key: string, value: string) => {
		this.writes++
		this.data.set(key, value)
	}
	removeItem = (key: string) => void this.data.delete(key)
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const setup = (start = 0) => {
	const scheduler = new FakeScheduler()
	scheduler.advance(start)
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}
const stored = (storage: MemoryStorage) => JSON.parse(storage.data.get("unicore-cache") ?? "null") as PersistedCache | null
const stoppers: Array<() => void> = []
const persist = (...args: Parameters<typeof persistQueryClient>) => {
	const p = persistQueryClient(...args)
	stoppers.push(p.stop)
	return p
}

afterEach(() => {
	stoppers.splice(0).forEach((stop) => stop())
	focusManager.set(true)
})

describe("saving", () => {
	it("writes changes on the next tick, and not again while nothing changes", async () => {
		const { client, scheduler } = setup(100)
		const storage = new MemoryStorage()
		const p = persist(client, { storage, throttle: 1000 })
		await p.restored
		client.setQueryData(["todos"], ["a"])
		expect(storage.writes).toBe(0) // throttled
		scheduler.advance(1000)
		await flush()
		expect(storage.writes).toBe(1)
		expect(stored(storage)).toMatchObject({
			version: 1,
			timestamp: 1100,
			state: { queries: [{ queryKey: ["todos"], data: ["a"] }] },
		})
		scheduler.advance(5000)
		await flush()
		expect(storage.writes).toBe(1)
	})

	it("tells apart two updates that happen in the same millisecond", async () => {
		const { client, scheduler } = setup()
		const storage = new MemoryStorage()
		await persist(client, { storage }).restored
		client.setQueryData(["k"], { n: 1 })
		scheduler.advance(1000)
		await flush()
		client.setQueryData(["k"], { n: 2 }) // same scheduler time? advance(1000) moved it, so force equal
		client.getQuery(["k"]).setData({ n: 3 }, scheduler.now())
		scheduler.advance(1000)
		await flush()
		expect(stored(storage)?.state.queries[0]?.data).toEqual({ n: 3 })
	})

	it("only persists what shouldDehydrate allows", async () => {
		const { client, scheduler } = setup()
		const storage = new MemoryStorage()
		await persist(client, { storage, shouldDehydrate: ({ queryKey }) => queryKey[0] !== "secret" }).restored
		client.setQueryData(["public"], 1)
		client.setQueryData(["secret"], 2)
		scheduler.advance(1000)
		await flush()
		expect(stored(storage)?.state.queries.map((q) => q.queryKey)).toEqual([["public"]])
	})

	it("persist() writes immediately; a hidden page flushes without waiting for the timer", async () => {
		const { client } = setup()
		const storage = new MemoryStorage()
		const p = persist(client, { storage, throttle: 60_000 })
		await p.restored
		client.setQueryData(["a"], 1)
		await p.persist()
		expect(storage.writes).toBe(1)
		client.setQueryData(["a"], 2)
		focusManager.set(false)
		await flush()
		expect(storage.writes).toBe(2)
	})

	it("reports storage errors and retries on the next tick", async () => {
		const { client, scheduler } = setup()
		const storage = new MemoryStorage()
		const onError = vi.fn()
		let fail = true
		const failing: PersistStorage = {
			...storage,
			getItem: storage.getItem,
			removeItem: storage.removeItem,
			setItem: (key, value) => {
				if (fail) throw new Error("quota exceeded")
				storage.setItem(key, value)
			},
		}
		await persist(client, { storage: failing, onError }).restored
		client.setQueryData(["k"], 1)
		scheduler.advance(1000)
		await flush()
		expect(onError).toHaveBeenCalledTimes(1)
		fail = false
		scheduler.advance(1000)
		await flush()
		expect(stored(storage)?.state.queries).toHaveLength(1)
	})

	it("survives data that cannot be serialised", async () => {
		const { client, scheduler } = setup()
		const storage = new MemoryStorage()
		const onError = vi.fn()
		await persist(client, { storage, onError }).restored
		const circular: Record<string, unknown> = {}
		circular.self = circular
		client.setQueryData(["bad"], circular)
		scheduler.advance(1000)
		await flush()
		expect(onError).toHaveBeenCalled()
		expect(storage.writes).toBe(0)
	})

	it("stop() ends the timer and the flush; the stored cache is left alone", async () => {
		const { client, scheduler } = setup()
		const storage = new MemoryStorage()
		const p = persist(client, { storage })
		await p.restored
		client.setQueryData(["k"], 1)
		scheduler.advance(1000)
		await flush()
		p.stop()
		client.setQueryData(["k"], 2)
		scheduler.advance(10_000)
		focusManager.set(false)
		await flush()
		expect(storage.writes).toBe(1)
		expect(stored(storage)).not.toBeNull()
		expect(scheduler.pendingTimers).toBe(0)
	})

	it("clear() stops and deletes what is stored", async () => {
		const { client, scheduler } = setup()
		const storage = new MemoryStorage()
		const p = persist(client, { storage })
		await p.restored
		client.setQueryData(["k"], 1)
		scheduler.advance(1000)
		await flush()
		await p.clear()
		expect(stored(storage)).toBeNull()
		client.setQueryData(["k"], 2)
		scheduler.advance(5000)
		await flush()
		expect(stored(storage)).toBeNull()
	})

	it("clear() reports a failing removeItem instead of throwing", async () => {
		const { client } = setup()
		const onError = vi.fn()
		const storage: PersistStorage = {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {
				throw new Error("nope")
			},
		}
		await persist(client, { storage, onError }).clear()
		expect(onError).toHaveBeenCalledTimes(1)
	})

	it("uses a custom key and custom (de)serialisation", async () => {
		const { client, scheduler } = setup()
		const storage = new MemoryStorage()
		const serialize = vi.fn((cache: PersistedCache) => `v1:${JSON.stringify(cache)}`)
		const deserialize = (raw: string) => JSON.parse(raw.slice(3)) as PersistedCache
		await persist(client, { storage, key: "mine", serialize, deserialize }).restored
		client.setQueryData(["k"], 1)
		scheduler.advance(1000)
		await flush()
		expect(storage.data.get("mine")?.startsWith("v1:")).toBe(true)
		const other = setup()
		const second = persist(other.client, { storage, key: "mine", serialize, deserialize })
		expect(await second.restored).toBe(true)
		expect(other.client.getQueryData(["k"])).toBe(1)
	})
})

describe("restoring", () => {
	const seeded = async (opts: { buster?: string; age?: number } = {}) => {
		const storage = new MemoryStorage()
		const first = setup(1000)
		const p = persist(first.client, { storage, buster: opts.buster ?? "" })
		await p.restored
		first.client.setQueryData(["todos"], ["a"])
		first.scheduler.advance(1000)
		await flush()
		p.stop()
		const later = setup(2000 + (opts.age ?? 0))
		return { storage, ...later }
	}

	it("loads the stored cache into a new client, keeping the original fetch time", async () => {
		const { storage, client } = await seeded()
		const p = persist(client, { storage })
		expect(await p.restored).toBe(true)
		expect(client.getQueryState(["todos"])).toMatchObject({ status: "success", data: ["a"], dataUpdatedAt: 1000 })
	})

	it("restored data is shown at once and refetched in the background when stale", async () => {
		const { storage, client } = await seeded()
		await persist(client, { storage }).restored
		const queryFn = vi.fn(() => Promise.resolve(["fresh"]))
		const observer = new QueryObserver(client, { queryKey: ["todos"], queryFn, staleTime: 500 })
		expect(observer.getSnapshot()).toMatchObject({ data: ["a"], isStale: true })
		const off = observer.subscribe(() => {})
		await flush()
		expect(queryFn).toHaveBeenCalledTimes(1)
		expect(observer.getSnapshot().data).toEqual(["fresh"])
		off()
	})

	it("restored fresh data is not refetched", async () => {
		const { storage, client } = await seeded()
		await persist(client, { storage }).restored
		const queryFn = vi.fn(() => Promise.resolve(["fresh"]))
		const off = new QueryObserver(client, { queryKey: ["todos"], queryFn, staleTime: Infinity }).subscribe(() => {})
		await flush()
		expect(queryFn).not.toHaveBeenCalled()
		off()
	})

	it("discards a cache older than maxAge, or written under another buster, and deletes it", async () => {
		const old = await seeded({ age: 5000 })
		expect(await persist(old.client, { storage: old.storage, maxAge: 1000 }).restored).toBe(false)
		expect(old.storage.data.size).toBe(0)

		const busted = await seeded({ buster: "v1" })
		expect(await persist(busted.client, { storage: busted.storage, buster: "v2" }).restored).toBe(false)
		expect(busted.client.getQueries()).toHaveLength(0)
		expect(busted.storage.data.size).toBe(0)
	})

	it("starts clean (and reports) when the stored value is unreadable", async () => {
		const storage = new MemoryStorage()
		storage.data.set("unicore-cache", "{not json")
		const onError = vi.fn()
		const { client } = setup()
		expect(await persist(client, { storage, onError }).restored).toBe(false)
		expect(onError).toHaveBeenCalledTimes(1)
		expect(storage.data.size).toBe(0)
	})

	it("returns false when nothing is stored and does not rewrite an unchanged restore", async () => {
		const empty = setup()
		const s1 = new MemoryStorage()
		expect(await persist(empty.client, { storage: s1 }).restored).toBe(false)

		const { storage, client, scheduler } = await seeded()
		await persist(client, { storage }).restored
		const before = storage.writes
		scheduler.advance(5000)
		await flush()
		expect(storage.writes).toBe(before)
	})

	it("works with async storage and never saves before the restore has finished", async () => {
		const { storage: filled } = await seeded()
		const raw = filled.data.get("unicore-cache") as string
		const log: string[] = []
		let release!: () => void
		const gate = new Promise<void>((resolve) => (release = resolve))
		const slow: PersistStorage = {
			getItem: async () => (await gate, raw),
			setItem: async () => void log.push("write"),
			removeItem: async () => {},
		}
		const { client, scheduler } = setup(3000)
		const p = persist(client, { storage: slow, throttle: 100 })
		client.setQueryData(["early"], 1) // arrives while restoring
		scheduler.advance(1000)
		await flush()
		expect(log).toEqual([]) // nothing written yet
		release()
		await p.restored
		expect(client.getQueryData(["todos"])).toEqual(["a"])
		expect(client.getQueryData(["early"])).toBe(1)
		scheduler.advance(100)
		await flush()
		expect(log).toEqual(["write"])
	})

	it("stopping before the restore completes starts no timers", async () => {
		const { client, scheduler } = setup()
		const p = persist(client, { storage: new MemoryStorage() })
		p.stop()
		await p.restored
		expect(scheduler.pendingTimers).toBe(0)
	})
})
