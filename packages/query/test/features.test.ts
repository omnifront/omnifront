import { FakeScheduler } from "@omnifront/core/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { focusManager, keepPreviousData, onlineManager, QueryClient, QueryObserver } from "../src"

const flush = () => new Promise<void>((r) => setTimeout(r, 0))
const setup = () => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}
const counter = () => {
	let n = 0
	return vi.fn(() => Promise.resolve(++n))
}

// Observers left subscribed would keep the shared managers attached and hide attach-time behaviour.
const subscriptions: Array<() => void> = []
const watch = (observer: { subscribe(listener: () => void): () => void }): (() => void) => {
	const off = observer.subscribe(() => {})
	subscriptions.push(off)
	return off
}

afterEach(() => {
	subscriptions.splice(0).forEach((off) => off())
	focusManager.set(true)
	onlineManager.set(true)
})

describe("refetch on focus and reconnect", () => {
	it("refetches stale data when the page becomes visible again", async () => {
		const { client } = setup()
		const fn = counter()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: fn })
		watch(o)
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
		focusManager.set(false)
		await flush()
		expect(fn).toHaveBeenCalledTimes(1) // going hidden does nothing
		focusManager.set(true)
		await flush()
		expect(fn).toHaveBeenCalledTimes(2)
		expect(o.getSnapshot().data).toBe(2)
	})

	it("does not refetch fresh data, and respects refetchOnWindowFocus: false and enabled: false", async () => {
		const { client } = setup()
		const fresh = counter()
		const optOut = counter()
		const off = counter()
		watch(new QueryObserver(client, { queryKey: ["fresh"], queryFn: fresh, staleTime: Infinity }))
		watch(new QueryObserver(client, { queryKey: ["optout"], queryFn: optOut, refetchOnWindowFocus: false }))
		watch(new QueryObserver(client, { queryKey: ["off"], queryFn: off, enabled: false }))
		await flush()
		focusManager.set(false)
		focusManager.set(true)
		await flush()
		expect(fresh).toHaveBeenCalledTimes(1)
		expect(optOut).toHaveBeenCalledTimes(1)
		expect(off).not.toHaveBeenCalled()
	})

	it("refetches stale data when the network comes back, unless refetchOnReconnect is false", async () => {
		const { client } = setup()
		const on = counter()
		const optOut = counter()
		watch(new QueryObserver(client, { queryKey: ["a"], queryFn: on }))
		watch(new QueryObserver(client, { queryKey: ["b"], queryFn: optOut, refetchOnReconnect: false }))
		await flush()
		onlineManager.set(false)
		onlineManager.set(true)
		await flush()
		expect(on).toHaveBeenCalledTimes(2)
		expect(optOut).toHaveBeenCalledTimes(1)
	})

	it("stops listening when the observer unsubscribes", async () => {
		const { client } = setup()
		const fn = counter()
		const off = watch(new QueryObserver(client, { queryKey: ["k"], queryFn: fn }))
		await flush()
		off()
		focusManager.set(false)
		focusManager.set(true)
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
	})
})

describe("environment signals", () => {
	// Plain EventTarget fakes instead of jsdom: the query package stays framework- and DOM-free,
	// and its tests run on the oldest supported Node (18), where jsdom 31 cannot load.
	afterEach(() => vi.unstubAllGlobals())

	it("follow document visibility and the network events only while subscribed", () => {
		const doc = Object.assign(new EventTarget(), { visibilityState: "hidden" })
		const win = new EventTarget()
		const nav = { onLine: false }
		vi.stubGlobal("document", doc)
		vi.stubGlobal("window", win)
		vi.stubGlobal("navigator", nav)

		const l = vi.fn()
		const off = focusManager.subscribe(l)
		expect(focusManager.getSnapshot()).toBe(false) // read on attach
		doc.visibilityState = "visible"
		doc.dispatchEvent(new Event("visibilitychange"))
		expect(focusManager.getSnapshot()).toBe(true)
		expect(l).toHaveBeenCalledTimes(2)
		off()
		doc.visibilityState = "hidden"
		doc.dispatchEvent(new Event("visibilitychange"))
		expect(focusManager.getSnapshot()).toBe(true) // detached: no longer following

		const offNet = onlineManager.subscribe(() => {})
		expect(onlineManager.getSnapshot()).toBe(false)
		nav.onLine = true
		win.dispatchEvent(new Event("online"))
		expect(onlineManager.getSnapshot()).toBe(true)
		nav.onLine = false
		win.dispatchEvent(new Event("offline"))
		expect(onlineManager.getSnapshot()).toBe(false)
		offNet()
	})

	it("do nothing without a DOM", () => {
		vi.stubGlobal("document", undefined)
		vi.stubGlobal("window", undefined)
		const offFocus = focusManager.subscribe(() => {})
		const offNet = onlineManager.subscribe(() => {})
		expect([focusManager.getSnapshot(), onlineManager.getSnapshot()]).toEqual([true, true])
		offFocus()
		offNet()
		vi.unstubAllGlobals()
	})
})

describe("refetchInterval", () => {
	it("refetches on every tick, even fresh data, and stops on unsubscribe", async () => {
		const { client, scheduler } = setup()
		const fn = counter()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: fn, staleTime: Infinity, refetchInterval: 1000 })
		const off = watch(o)
		await flush()
		scheduler.advance(1000)
		await flush()
		scheduler.advance(1000)
		await flush()
		expect(fn).toHaveBeenCalledTimes(3)
		off()
		scheduler.advance(10_000)
		await flush()
		expect(fn).toHaveBeenCalledTimes(3)
	})

	it("skips ticks while the page is hidden or the query is disabled, and follows option changes", async () => {
		const { client, scheduler } = setup()
		const fn = counter()
		const base = { queryKey: ["k"], queryFn: fn, staleTime: Infinity }
		const o = new QueryObserver(client, { ...base, refetchInterval: 1000 })
		watch(o)
		await flush()
		focusManager.set(false)
		scheduler.advance(3000)
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
		focusManager.set(true)
		await flush()
		fn.mockClear()
		o.setOptions({ ...base, refetchInterval: 1000, enabled: false })
		scheduler.advance(2000)
		await flush()
		expect(fn).not.toHaveBeenCalled()
		o.setOptions({ ...base, refetchInterval: 500 })
		scheduler.advance(500)
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
		o.setOptions({ ...base })
		scheduler.advance(5000)
		await flush()
		expect(fn).toHaveBeenCalledTimes(1)
	})
})

describe("initialData", () => {
	it("seeds an empty cache entry as fetched data, and is fresh if staleTime allows", async () => {
		const { client } = setup()
		const fn = counter()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: fn, initialData: 42, staleTime: Infinity })
		expect(o.getSnapshot()).toMatchObject({ status: "success", data: 42, isStale: false, isFetching: false })
		watch(o)
		await flush()
		expect(fn).not.toHaveBeenCalled()
		expect(client.getQueryData(["k"])).toBe(42)
	})

	it("accepts a function, ages like fetched data, and never overwrites existing data", () => {
		const { client, scheduler } = setup()
		scheduler.advance(10_000)
		const lazy = vi.fn(() => "lazy")
		const old = new QueryObserver(client, { queryKey: ["a"], queryFn: async () => "x", initialData: lazy, staleTime: 5000 })
		expect(old.getSnapshot()).toMatchObject({ data: "lazy", isStale: false })
		scheduler.advance(5000)
		expect(old.getSnapshot().isStale).toBe(true)
		client.setQueryData(["b"], "cached")
		const second = vi.fn(() => "initial")
		new QueryObserver(client, { queryKey: ["b"], queryFn: async () => "x", initialData: second })
		expect(client.getQueryData(["b"])).toBe("cached")
		expect(second).not.toHaveBeenCalled()
	})

	it("is applied again when the key changes", () => {
		const { client } = setup()
		const o = new QueryObserver(client, { queryKey: ["a"], queryFn: async () => 1, initialData: 1 })
		o.setOptions({ queryKey: ["b"], queryFn: async () => 2, initialData: 2 })
		expect(o.getSnapshot().data).toBe(2)
	})
})

describe("placeholderData", () => {
	it("shows a constant placeholder while loading, flagged, and not stored in the cache", async () => {
		const { client } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: async () => "real", placeholderData: "…" })
		expect(o.getSnapshot()).toMatchObject({ data: "…", isPlaceholderData: true, status: "success", isFetching: true })
		expect(o.getSnapshot()).toBe(o.getSnapshot())
		expect(client.getQueryData(["k"])).toBeUndefined()
		watch(o)
		await flush()
		expect(o.getSnapshot()).toMatchObject({ data: "real", isPlaceholderData: false })
	})

	it("keepPreviousData keeps the previous key's data while the next key loads", async () => {
		const { client } = setup()
		const options = (page: number) => ({
			queryKey: ["page", page],
			queryFn: async () => `page-${page}`,
			staleTime: Infinity,
			placeholderData: keepPreviousData,
		})
		const o = new QueryObserver(client, options(1))
		watch(o)
		await flush()
		expect(o.getSnapshot().data).toBe("page-1")
		o.setOptions(options(2))
		expect(o.getSnapshot()).toMatchObject({ data: "page-1", isPlaceholderData: true, isFetching: true })
		await flush()
		expect(o.getSnapshot()).toMatchObject({ data: "page-2", isPlaceholderData: false })
	})

	it("a placeholder function that builds a new object still gives a stable snapshot", () => {
		const { client } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: async () => ({ a: 1 }), placeholderData: () => ({ a: 0 }) })
		expect(o.getSnapshot()).toBe(o.getSnapshot())
		expect(o.getServerSnapshot()).toBe(o.getServerSnapshot())
	})

	it("no placeholder when the function returns undefined (first load)", () => {
		const { client } = setup()
		const o = new QueryObserver(client, { queryKey: ["k"], queryFn: async () => 1, placeholderData: keepPreviousData })
		expect(o.getSnapshot()).toMatchObject({ data: undefined, isPlaceholderData: false, status: "loading" })
	})
})
