import { FakeScheduler } from "@omnifront/core/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
	CancelledError,
	focusManager,
	keepPreviousData,
	onlineManager,
	Query,
	QueryClient,
	QueryObserver,
	type QueryFnContext,
	type QueryObserverOptions,
	type QueryResult,
} from "../src"
import { removeQueries, resetQueries } from "../src/filters"
import { skipToken } from "../src/options"

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

describe("parity phase 3: result flags", () => {
	const flags = (r: QueryResult<unknown>) => ({
		isPending: r.isPending,
		isLoading: r.isLoading,
		isRefetching: r.isRefetching,
		isSuccess: r.isSuccess,
		isError: r.isError,
		isLoadingError: r.isLoadingError,
		isRefetchError: r.isRefetchError,
	})
	const none = { isPending: false, isLoading: false, isRefetching: false, isSuccess: false, isError: false, isLoadingError: false, isRefetchError: false }

	it("follow the query through loading, success, refetch and both kinds of error", async () => {
		const { client } = setup()
		let fail = false
		const observer = new QueryObserver(client, {
			queryKey: ["k"],
			queryFn: () => (fail ? Promise.reject(new Error("x")) : Promise.resolve(1)),
			retry: 0,
		})
		const disabled = new QueryObserver(client, { queryKey: ["off"], queryFn: () => Promise.resolve(1), enabled: false })
		expect(flags(disabled.getSnapshot())).toEqual({ ...none, isPending: true })
		expect(flags(observer.getSnapshot())).toEqual({ ...none, isPending: true, isLoading: true })
		const off = observer.subscribe(() => {})
		await flush()
		expect(flags(observer.getSnapshot())).toEqual({ ...none, isSuccess: true })
		const refetch = observer.refetch()
		expect(flags(observer.getSnapshot())).toEqual({ ...none, isSuccess: true, isRefetching: true })
		await refetch
		fail = true
		await observer.refetch().catch(() => {})
		expect(flags(observer.getSnapshot())).toEqual({ ...none, isError: true, isRefetchError: true })
		expect(observer.getSnapshot().failureReason).toEqual(new Error("x"))
		off()

		const failing = new QueryObserver(client, { queryKey: ["bad"], queryFn: () => Promise.reject(new Error("y")), retry: 0 })
		const off2 = failing.subscribe(() => {})
		await flush()
		expect(flags(failing.getSnapshot())).toEqual({ ...none, isError: true, isLoadingError: true })
		off2()
	})

	it("placeholder data counts as success; failureReason is set while retrying and cleared on success", async () => {
		const { client, scheduler } = setup()
		let calls = 0
		const observer = new QueryObserver(client, {
			queryKey: ["k"],
			queryFn: () => (++calls === 1 ? Promise.reject(new Error("first")) : Promise.resolve("ok")),
			retry: 1,
			retryDelay: 10,
			placeholderData: "soon",
		})
		const off = observer.subscribe(() => {})
		expect(observer.getSnapshot()).toMatchObject({ isPending: false, isSuccess: true, isPlaceholderData: true, isRefetching: true })
		await flush()
		expect(observer.getSnapshot()).toMatchObject({ failureCount: 1, failureReason: new Error("first"), isFetching: true })
		scheduler.advance(10)
		await flush()
		expect(observer.getSnapshot()).toMatchObject({ data: "ok", failureCount: 0, failureReason: undefined })
		client.fetchQuery(["k"], () => new Promise(() => {})).catch(() => {})
		client.cancelQuery(["k"])
		expect(observer.getSnapshot().failureReason).toBeUndefined()
		off()
	})
})

describe("parity phase 3: queryFn context and meta", () => {
	it("passes the key, meta, client and signal", async () => {
		const { client } = setup()
		const queryFn = vi.fn<(context: QueryFnContext) => Promise<number>>(() => Promise.resolve(1))
		const observer = new QueryObserver(client, { queryKey: ["todos", 1], queryFn, meta: { source: "test" } })
		const off = observer.subscribe(() => {})
		await flush()
		const context = queryFn.mock.calls[0]![0]
		expect(context.queryKey).toEqual(["todos", 1])
		expect(context.meta).toEqual({ source: "test" })
		expect(context.client).toBe(client)
		expect(context.signal).toBeInstanceOf(AbortSignal)
		off()
		await client.fetchQuery({ queryKey: ["x"], queryFn, meta: { a: 1 } })
		expect(queryFn.mock.calls[1]![0]).toMatchObject({ queryKey: ["x"], meta: { a: 1 } })
		await client.fetchQuery(["y"], queryFn)
		expect(queryFn.mock.calls[2]![0]).toMatchObject({ queryKey: ["y"], meta: undefined })
		// A Query made by hand has no key or client to pass.
		const lone = new Query<number>(new FakeScheduler())
		await lone.fetch(queryFn)
		expect(queryFn.mock.calls[3]![0].queryKey).toEqual([])
	})
})

describe("parity phase 3: defaultOptions", () => {
	it("apply to every observer, lose to its own options, and can be replaced", async () => {
		const scheduler = new FakeScheduler()
		const client = new QueryClient({ scheduler, gcTime: Infinity, defaultOptions: { queries: { staleTime: 1000, retry: 0 } } })
		expect(client.getDefaultOptions().queries?.staleTime).toBe(1000)
		const queryFn = vi.fn(() => Promise.reject(new Error("x")))
		const a = new QueryObserver(client, { queryKey: ["a"], queryFn })
		const offA = a.subscribe(() => {})
		await flush()
		expect(queryFn).toHaveBeenCalledOnce() // retry: 0 from the defaults
		offA()

		client.setQueryData(["b"], 1)
		const fresh = new QueryObserver(client, { queryKey: ["b"], queryFn: () => Promise.resolve(2) })
		const own = new QueryObserver(client, { queryKey: ["b"], queryFn: () => Promise.resolve(2), staleTime: 0 })
		expect(fresh.getSnapshot().isStale).toBe(false)
		expect(own.getSnapshot().isStale).toBe(true)

		client.setDefaultOptions({ queries: { enabled: false } })
		const later = new QueryObserver(client, { queryKey: ["c"], queryFn: () => Promise.resolve(3) })
		expect(later.getSnapshot().status).toBe("idle")
		fresh.setOptions({ queryKey: ["b"], queryFn: () => Promise.resolve(2) })
		expect(fresh.getSnapshot().isStale).toBe(true) // the staleTime default is gone
		expect(new QueryClient().getDefaultOptions()).toEqual({})
	})
})

describe("parity phase 3: when to refetch", () => {
	const mounted = async (client: QueryClient, options: Partial<QueryObserverOptions<number>>) => {
		const queryFn = vi.fn(() => Promise.resolve(2))
		const observer = new QueryObserver(client, { queryKey: ["k"], queryFn, ...options })
		const first = observer.getSnapshot()
		const off = observer.subscribe(() => {})
		await flush()
		off()
		return { queryFn, first }
	}

	it("refetchOnMount: false loads missing data only; 'always' refetches fresh data; a function decides", async () => {
		const { client } = setup()
		expect((await mounted(client, { refetchOnMount: false })).queryFn).toHaveBeenCalledOnce() // nothing cached yet
		const stale = await mounted(client, { refetchOnMount: false })
		expect(stale.queryFn).not.toHaveBeenCalled()
		expect(stale.first).toMatchObject({ isStale: true, isFetching: false }) // no flash of a fetch that will not happen
		const always = await mounted(client, { refetchOnMount: "always", staleTime: Infinity })
		expect(always.queryFn).toHaveBeenCalledOnce()
		expect(always.first.isFetching).toBe(true)
		expect((await mounted(client, { staleTime: Infinity })).queryFn).not.toHaveBeenCalled()
		expect((await mounted(client, { refetchOnMount: (state) => state.data === 2 && "always", staleTime: Infinity })).queryFn).toHaveBeenCalledOnce()
		expect((await mounted(client, { refetchOnMount: () => false })).queryFn).not.toHaveBeenCalled()
		expect((await mounted(client, { refetchOnMount: "always", enabled: false })).queryFn).not.toHaveBeenCalled()
	})

	it("staleTime 'static' is never refetched once loaded, not by 'always' and not by invalidation", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve(1))
		const observer = new QueryObserver(client, { queryKey: ["s"], queryFn, staleTime: "static", refetchOnMount: "always" })
		const off = observer.subscribe(() => {})
		await flush()
		expect(queryFn).toHaveBeenCalledOnce()
		await client.invalidateQueries()
		focusManager.set(false)
		focusManager.set(true)
		await flush()
		off()
		observer.subscribe(() => {})()
		expect(queryFn).toHaveBeenCalledOnce()
		expect(observer.getSnapshot().isStale).toBe(false)
		expect(observer.getServerSnapshot().isStale).toBe(false)
	})

	it("staleTime and enabled may be functions of the state; changing what they return takes effect", async () => {
		const { client, scheduler } = setup()
		const queryFn = vi.fn(() => Promise.resolve(5))
		let on = false
		// Each "render" closes over the value of `on` at that time, like props in a component.
		const options = (ms: number, enabled = on): QueryObserverOptions<number> => ({
			queryKey: ["f"],
			queryFn,
			enabled: () => enabled,
			staleTime: (state) => (state.data === 5 ? ms : 0),
		})
		const observer = new QueryObserver(client, options(1000))
		const listener = vi.fn()
		const off = observer.subscribe(listener)
		await flush()
		expect(queryFn).not.toHaveBeenCalled()
		expect(observer.getSnapshot().status).toBe("idle")
		on = true
		observer.setOptions(options(1000))
		await flush()
		expect(queryFn).toHaveBeenCalledOnce()
		expect(observer.getSnapshot().isStale).toBe(false)
		listener.mockClear()
		observer.setOptions(options(1000)) // new functions, same answers: nothing happens
		expect(listener).not.toHaveBeenCalled()
		scheduler.advance(500)
		observer.setOptions(options(100))
		expect(observer.getSnapshot().isStale).toBe(true)
		expect(observer.getServerSnapshot().isStale).toBe(false)
		off()
	})

	it("refetchOnWindowFocus / refetchOnReconnect: 'always' refetches fresh data, false never, a function decides", async () => {
		const { client } = setup()
		const run = async (options: Partial<QueryObserverOptions<number>>, toggle: () => void) => {
			const queryFn = vi.fn(() => Promise.resolve(1))
			const observer = new QueryObserver(client, { queryKey: [Math.random()], queryFn, staleTime: Infinity, ...options })
			const off = observer.subscribe(() => {})
			await flush()
			toggle()
			await flush()
			off()
			return queryFn.mock.calls.length - 1
		}
		const focus = () => (focusManager.set(false), focusManager.set(true))
		const reconnect = () => (onlineManager.set(false), onlineManager.set(true))
		expect(await run({}, focus)).toBe(0)
		expect(await run({ refetchOnWindowFocus: "always" }, focus)).toBe(1)
		expect(await run({ refetchOnWindowFocus: false, staleTime: 0 }, focus)).toBe(0)
		expect(await run({ refetchOnWindowFocus: () => "always" }, focus)).toBe(1)
		expect(await run({ refetchOnReconnect: "always" }, reconnect)).toBe(1)
		expect(await run({ refetchOnReconnect: () => false, staleTime: 0 }, reconnect)).toBe(0)
	})

	it("refetchInterval as a function can stop the polling; the countdown survives re-renders", async () => {
		const { client, scheduler } = setup()
		let n = 0
		const queryFn = vi.fn(() => Promise.resolve(++n))
		const options = (): QueryObserverOptions<number> => ({
			queryKey: ["poll"],
			queryFn,
			refetchInterval: (state) => (state.data !== undefined && state.data >= 3 ? false : 1000),
		})
		const observer = new QueryObserver(client, options())
		const off = observer.subscribe(() => {})
		await flush()
		scheduler.advance(600)
		observer.setOptions(options()) // a re-render: must not restart the 1000 ms
		scheduler.advance(400)
		await flush()
		expect(queryFn).toHaveBeenCalledTimes(2)
		scheduler.advance(1000)
		await flush()
		expect(n).toBe(3)
		scheduler.advance(5000)
		await flush()
		expect(queryFn).toHaveBeenCalledTimes(3) // data reached 3: the function said false
		off()
	})

	it("refetchIntervalInBackground keeps polling while the page is hidden", async () => {
		const { client, scheduler } = setup()
		const run = async (background: boolean) => {
			const queryFn = vi.fn(() => Promise.resolve(1))
			const observer = new QueryObserver(client, { queryKey: ["bg", background], queryFn, refetchInterval: 100, refetchIntervalInBackground: background, refetchOnWindowFocus: false })
			const off = observer.subscribe(() => {})
			await flush()
			focusManager.set(false)
			scheduler.advance(100)
			await flush()
			focusManager.set(true)
			off()
			return queryFn.mock.calls.length
		}
		expect(await run(false)).toBe(1)
		expect(await run(true)).toBe(2)
	})
})

describe("parity phase 3: initialDataUpdatedAt, cancelRefetch, fetchQuery object form, skipToken", () => {
	it("initialDataUpdatedAt makes old initial data stale", async () => {
		const { client, scheduler } = setup()
		scheduler.advance(10_000)
		const fresh = new QueryObserver(client, { queryKey: ["a"], queryFn: () => Promise.resolve(2), initialData: 1, staleTime: 5000 })
		const old = new QueryObserver(client, { queryKey: ["b"], queryFn: () => Promise.resolve(2), initialData: 1, staleTime: 5000, initialDataUpdatedAt: 1000 })
		const lazy = new QueryObserver(client, { queryKey: ["c"], queryFn: () => Promise.resolve(2), initialData: 1, staleTime: 5000, initialDataUpdatedAt: () => 9000 })
		expect(fresh.getSnapshot().isStale).toBe(false)
		expect(old.getSnapshot()).toMatchObject({ isStale: true, dataUpdatedAt: 1000, data: 1 })
		expect(lazy.getSnapshot()).toMatchObject({ isStale: false, dataUpdatedAt: 9000 })
	})

	it("refetch joins by default; cancelRefetch aborts the request in flight and starts over", async () => {
		const { client } = setup()
		const signals: AbortSignal[] = []
		let n = 0
		const observer = new QueryObserver(client, {
			queryKey: ["r"],
			queryFn: ({ signal }) => (signals.push(signal), new Promise<number>((r) => setTimeout(() => r(++n), 5))),
			staleTime: Infinity,
			enabled: false,
		})
		const first = observer.refetch()
		expect(observer.refetch()).toBe(first)
		expect(signals).toHaveLength(1)
		first.catch(() => {})
		const second = observer.refetch({ cancelRefetch: true })
		expect(signals).toHaveLength(2)
		expect(signals[0]!.aborted).toBe(true)
		await expect(first).rejects.toBeInstanceOf(CancelledError)
		expect(await second).toBe(2)
		expect(await observer.refetch({ cancelRefetch: true })).toBe(3) // nothing in flight: just fetches
	})

	it("fetchQuery as one object returns fresh cached data instead of fetching", async () => {
		const { client, scheduler } = setup()
		const queryFn = vi.fn(() => Promise.resolve("v"))
		expect(await client.fetchQuery({ queryKey: ["k"], queryFn, staleTime: 1000 })).toBe("v")
		scheduler.advance(999)
		expect(await client.fetchQuery({ queryKey: ["k"], queryFn, staleTime: 1000 })).toBe("v")
		expect(queryFn).toHaveBeenCalledOnce()
		await client.fetchQuery({ queryKey: ["k"], queryFn })
		expect(queryFn).toHaveBeenCalledTimes(2)
		await client.invalidateQueries()
		await client.fetchQuery({ queryKey: ["k"], queryFn, staleTime: 1000 })
		expect(queryFn).toHaveBeenCalledTimes(3)
		const failing = vi.fn(() => Promise.reject(new Error("x")))
		const promise = client.fetchQuery({ queryKey: ["bad"], queryFn: failing, retry: 1, retryDelay: 5 })
		promise.catch(() => {})
		await flush()
		scheduler.advance(5)
		await expect(promise).rejects.toThrow("x")
		expect(failing).toHaveBeenCalledTimes(2)
	})

	it("skipToken disables a query until a real function arrives", async () => {
		const { client } = setup()
		const queryFn = vi.fn(() => Promise.resolve(1))
		const observer = new QueryObserver<number>(client, { queryKey: ["skip"], queryFn: skipToken })
		const off = observer.subscribe(() => {})
		await flush()
		expect(observer.getSnapshot()).toMatchObject({ status: "idle", isFetching: false, isPending: true, isLoading: false })
		observer.setOptions({ queryKey: ["skip"], queryFn })
		await flush()
		expect(observer.getSnapshot().data).toBe(1)
		off()
	})
})

describe("parity phase 3: reset and remove", () => {
	it("Query.reset empties the entry and watching observers load it again", async () => {
		const { client } = setup()
		let n = 0
		const observer = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(++n), staleTime: Infinity })
		const off = observer.subscribe(() => {})
		await flush()
		client.setQueryData(["idle"], "x")
		const reset = resetQueries(client)
		expect(observer.getSnapshot()).toMatchObject({ status: "loading", data: undefined, isFetching: true })
		expect(client.getQueryState(["idle"])).toMatchObject({ status: "idle", data: undefined, dataUpdatedAt: undefined })
		await reset
		expect(observer.getSnapshot()).toMatchObject({ status: "success", data: 2 })
		off()
	})

	it("reset cancels a fetch in flight", async () => {
		const { client } = setup()
		const promise = client.fetchQuery(["slow"], () => new Promise(() => {}))
		await resetQueries(client, { queryKey: ["slow"] })
		await expect(promise).rejects.toBeInstanceOf(CancelledError)
		expect(client.getQueryState(["slow"])).toMatchObject({ status: "idle", isFetching: false })
	})

	it("removeQuery / removeQueries drop entries and tell cache listeners", () => {
		const { client } = setup()
		client.setQueryData(["a"], 1)
		client.setQueryData(["a", 2], 2)
		client.setQueryData(["b"], 3)
		const changed = vi.fn()
		client.onChange(changed)
		client.removeQuery(["b"])
		client.removeQuery(["missing"])
		expect(changed).toHaveBeenCalledOnce()
		removeQueries(client, { queryKey: ["a"], exact: true })
		expect(client.getQueries().map((e) => e.key)).toEqual([["a", 2]])
		removeQueries(client)
		expect(client.getQueries()).toEqual([])
	})
})
