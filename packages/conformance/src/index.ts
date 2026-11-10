import { createApi } from "@omnifront/api"
import { createMockAdapter } from "@omnifront/api/testing"
import { notifyManager, shallowEqual, type Subscribable } from "@omnifront/core"
import { FakeScheduler } from "@omnifront/core/testing"
import {
	QueryClient,
	type InvalidateFilter,
	type MutationOptions,
	type MutationState,
	type QueryObserverOptions,
	type QueryResult,
} from "@omnifront/query"
import { focusManager, keepPreviousData, QueryObserver } from "@omnifront/query"
import type { InfiniteQueryObserverOptions, InfiniteQueryResult } from "@omnifront/query-infinite"
import { createStore } from "@omnifront/store"
import { describe, expect, it, vi } from "vitest"

export interface QueryHandle<TData> {
	current(): QueryResult<TData>
	/** Re-render with new options (e.g. a changed key). */
	update(options: QueryObserverOptions<TData>): void
	refetch(): Promise<unknown>
	unmount(): void
}

export interface SelectedQueryHandle<TData, TSelected> {
	current(): QueryResult<TSelected>
	/** Re-render with another `select` function (same query). */
	setSelect(select: (data: TData) => TSelected): void
	refetch(): Promise<TSelected>
	unmount(): void
}

export interface MutationHandle<TData, TVariables> {
	current(): MutationState<TData, Error, TVariables>
	mutate(variables: TVariables): void
	mutateAsync(variables: TVariables): Promise<TData>
	reset(): void
	unmount(): void
}

export interface InfiniteHandle<TPage, TPageParam> {
	current(): InfiniteQueryResult<TPage, Error, TPageParam>
	fetchNextPage(): Promise<void>
	update(options: InfiniteQueryObserverOptions<TPage, Error, TPageParam>): void
	unmount(): void
}

export interface QueriesHandle {
	current(): ReadonlyArray<QueryResult<unknown>>
	update(options: ReadonlyArray<QueryObserverOptions<unknown>>): void
	unmount(): void
}

export interface CombinedQueriesHandle<T> {
	/** What useQueries(options, { combine }) returns. */
	current(): T
	update(options: ReadonlyArray<QueryObserverOptions<unknown>>): void
	unmount(): void
}

export interface ActivityHandle {
	/** What the framework's useIsFetching shows. */
	fetching(): number
	/** What the framework's useIsMutating shows. */
	mutating(): number
	unmount(): void
}

export interface StoreHandle<TSelected> {
	current(): TSelected
	unmount(): void
}

/** What an adapter package must provide so the shared behaviour tests can drive it. */
export interface Harness {
	mountQuery<TData>(client: QueryClient, options: QueryObserverOptions<TData>): QueryHandle<TData>
	/** The adapter's query hook with its `select` option. */
	mountSelectedQuery<TData, TSelected>(
		client: QueryClient,
		options: QueryObserverOptions<TData>,
		select: (data: TData) => TSelected,
	): SelectedQueryHandle<TData, TSelected>
	/** With a `client` the mutation sits under that client's provider, so it counts towards useIsMutating. */
	mountMutation<TData, TVariables, TContext = unknown>(
		options: MutationOptions<TData, Error, TVariables, TContext>,
		client?: QueryClient,
	): MutationHandle<TData, TVariables>
	/** Mount useIsFetching(filter) and useIsMutating() together under `client`. */
	mountActivity(client: QueryClient, filter?: InvalidateFilter): ActivityHandle
	mountQueries(client: QueryClient, options: ReadonlyArray<QueryObserverOptions<unknown>>): QueriesHandle
	/** Like mountQueries, with the adapter's `combine` option. `combine` is the same function on every render. */
	mountCombinedQueries<T>(
		client: QueryClient,
		options: ReadonlyArray<QueryObserverOptions<unknown>>,
		combine: (results: ReadonlyArray<QueryResult<unknown>>) => T,
	): CombinedQueriesHandle<T>
	mountInfiniteQuery<TPage, TPageParam>(
		client: QueryClient,
		options: InfiniteQueryObserverOptions<TPage, Error, TPageParam>,
	): InfiniteHandle<TPage, TPageParam>
	/** Bind a slice of any Subscribable (store, query observer, ...) to the framework's reactivity. */
	mountStore<TState, TSelected>(
		source: Subscribable<TState>,
		selector: (state: TState) => TSelected,
		equals?: (a: TSelected, b: TSelected) => boolean,
	): StoreHandle<TSelected>
	/** Run `fn`, then let the framework process the resulting updates (React: act). */
	act(fn: () => void | Promise<unknown>): Promise<void>
}

/** Behaviour every adapter must have, however its framework renders. */
export function defineConformanceSuite(adapterName: string, h: Harness): void {
	const settle = () => h.act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
	const setup = () => {
		const scheduler = new FakeScheduler()
		return { scheduler, client: new QueryClient({ scheduler }) }
	}
	const counter = () => {
		let n = 0
		return vi.fn(() => Promise.resolve(++n))
	}

	describe(`${adapterName}: query conformance`, () => {
		it("starts loading, then shows the data", async () => {
			const { client } = setup()
			const q = h.mountQuery(client, { queryKey: ["k"], queryFn: () => Promise.resolve("x") })
			expect(q.current()).toMatchObject({ status: "loading", isFetching: true })
			await settle()
			expect(q.current()).toMatchObject({ status: "success", data: "x", isFetching: false })
			q.unmount()
		})

		it("shares one request between components using the same key", async () => {
			const { client } = setup()
			const fn = counter()
			const a = h.mountQuery(client, { queryKey: ["k", { a: 1, b: 2 }], queryFn: fn })
			const b = h.mountQuery(client, { queryKey: ["k", { b: 2, a: 1 }], queryFn: fn })
			await settle()
			expect(fn).toHaveBeenCalledTimes(1)
			expect(b.current().data).toBe(1)
			a.unmount()
			b.unmount()
		})

		it("follows a changing key and fetches the new data", async () => {
			const { client } = setup()
			const make = (id: number): QueryObserverOptions<string> => ({
				queryKey: ["item", id],
				queryFn: () => Promise.resolve(`item-${id}`),
			})
			const q = h.mountQuery(client, make(1))
			await settle()
			expect(q.current().data).toBe("item-1")
			q.update(make(2))
			await settle()
			expect(q.current().data).toBe("item-2")
			q.unmount()
		})

		it("does not fetch while disabled, and fetches once enabled", async () => {
			const { client } = setup()
			const fn = counter()
			const q = h.mountQuery(client, { queryKey: ["k"], queryFn: fn, enabled: false })
			await settle()
			expect(fn).not.toHaveBeenCalled()
			expect(q.current().status).toBe("idle")
			q.update({ queryKey: ["k"], queryFn: fn, enabled: true })
			await settle()
			expect(fn).toHaveBeenCalledTimes(1)
			expect(q.current().data).toBe(1)
			q.unmount()
		})

		it("reports the moment data becomes stale", async () => {
			const { client, scheduler } = setup()
			const q = h.mountQuery(client, { queryKey: ["k"], queryFn: counter(), staleTime: 1000 })
			await settle()
			expect(q.current().isStale).toBe(false)
			await h.act(() => scheduler.advance(1000))
			expect(q.current().isStale).toBe(true)
			q.unmount()
		})

		it("refetches mounted queries when invalidated", async () => {
			const { client } = setup()
			const q = h.mountQuery(client, { queryKey: ["todos"], queryFn: counter(), staleTime: Infinity })
			await settle()
			await h.act(() => client.invalidateQueries({ queryKey: ["todos"] }))
			expect(q.current().data).toBe(2)
			q.unmount()
		})

		it("refetch() runs the query function again", async () => {
			const { client } = setup()
			const q = h.mountQuery(client, { queryKey: ["k"], queryFn: counter(), staleTime: Infinity })
			await settle()
			await h.act(() => q.refetch())
			expect(q.current().data).toBe(2)
			q.unmount()
		})

		it("shows the error once retries are exhausted", async () => {
			const { client } = setup()
			const q = h.mountQuery(client, {
				queryKey: ["k"],
				queryFn: () => Promise.reject(new Error("down")),
				retry: false,
			})
			await settle()
			expect(q.current()).toMatchObject({ status: "error", isFetching: false })
			expect((q.current().error as Error).message).toBe("down")
			q.unmount()
		})

		it("stops observing on unmount: no more fetches, and the entry is collected after gcTime", async () => {
			const { client, scheduler } = setup()
			const fn = counter()
			const q = h.mountQuery(client, { queryKey: ["k"], queryFn: fn, staleTime: Infinity, gcTime: 1000 })
			await settle()
			q.unmount()
			await h.act(() => client.invalidateQueries())
			expect(fn).toHaveBeenCalledTimes(1)
			scheduler.advance(1000)
			expect(client.getQueryState(["k"])).toBeUndefined()
		})

		it("keeps the entry when remounted before gcTime", async () => {
			const { client, scheduler } = setup()
			const fn = counter()
			const options = { queryKey: ["k"], queryFn: fn, staleTime: Infinity, gcTime: 1000 }
			h.mountQuery(client, options).unmount()
			scheduler.advance(999)
			const again = h.mountQuery(client, options)
			scheduler.advance(5000)
			await settle()
			expect(client.getQueryData(["k"])).toBe(1)
			again.unmount()
		})
	})

	describe(`${adapterName}: query features conformance`, () => {
		it("refetches stale data when the page becomes visible again", async () => {
			const { client } = setup()
			const fn = counter()
			const q = h.mountQuery(client, { queryKey: ["k"], queryFn: fn })
			await settle()
			expect(q.current().data).toBe(1)
			await h.act(() => {
				focusManager.set(false)
				focusManager.set(true)
			})
			await settle()
			expect(q.current().data).toBe(2)
			q.unmount()
		})

		it("polls with refetchInterval and stops on unmount", async () => {
			const { client, scheduler } = setup()
			const fn = counter()
			const q = h.mountQuery(client, { queryKey: ["k"], queryFn: fn, staleTime: Infinity, refetchInterval: 1000 })
			await settle()
			await h.act(() => scheduler.advance(1000))
			await settle()
			expect(q.current().data).toBe(2)
			q.unmount()
			await h.act(() => scheduler.advance(5000))
			await settle()
			expect(fn).toHaveBeenCalledTimes(2)
		})

		it("shows initialData without fetching, and a flagged placeholder while a new key loads", async () => {
			const { client } = setup()
			const fn = counter()
			const start = h.mountQuery(client, { queryKey: ["init"], queryFn: fn, initialData: 99, staleTime: Infinity })
			await settle()
			expect(start.current()).toMatchObject({ data: 99, isPlaceholderData: false })
			expect(fn).not.toHaveBeenCalled()
			start.unmount()

			let release!: () => void
			const gate = new Promise<void>((resolve) => (release = resolve))
			const page = (n: number): QueryObserverOptions<string> => ({
				queryKey: ["page", n],
				queryFn: async () => {
					if (n === 2) await gate // page 2 stays loading until we let it go
					return `page-${n}`
				},
				staleTime: Infinity,
				placeholderData: keepPreviousData,
			})
			const q = h.mountQuery(client, page(1))
			await settle()
			expect(q.current().data).toBe("page-1")
			q.update(page(2))
			await h.act(() => {}) // let the framework switch to the new key
			expect(q.current()).toMatchObject({ data: "page-1", isPlaceholderData: true, isFetching: true })
			release()
			await settle()
			expect(q.current()).toMatchObject({ data: "page-2", isPlaceholderData: false })
			q.unmount()
		})
	})

	describe(`${adapterName}: multiple queries conformance`, () => {
		const one = (key: string, value: unknown, extra: Partial<QueryObserverOptions<unknown>> = {}): QueryObserverOptions<unknown> => ({
			queryKey: [key],
			queryFn: () => Promise.resolve(value),
			staleTime: Infinity,
			...extra,
		})

		it("runs every query and returns the results in order", async () => {
			const { client } = setup()
			const q = h.mountQueries(client, [one("a", 1), one("b", "two")])
			expect(q.current().map((r) => r.status)).toEqual(["loading", "loading"])
			await settle()
			expect(q.current().map((r) => r.data)).toEqual([1, "two"])
			q.unmount()
		})

		it("supports dependent queries through enabled", async () => {
			const { client } = setup()
			const dependent = vi.fn(() => Promise.resolve("posts"))
			const q = h.mountQueries(client, [one("user", { id: 1 }), one("posts", "posts", { queryFn: dependent, enabled: false })])
			await settle()
			expect(dependent).not.toHaveBeenCalled()
			q.update([one("user", { id: 1 }), one("posts", "posts", { queryFn: dependent, enabled: true })])
			await settle()
			expect(dependent).toHaveBeenCalledTimes(1)
			expect(q.current()[1]?.data).toBe("posts")
			q.unmount()
		})

		it("combine returns its own value instead of the array, and follows the queries", async () => {
			const { client } = setup()
			const combine = (results: ReadonlyArray<QueryResult<unknown>>) => ({
				loading: results.some((r) => r.status === "loading"),
				data: results.map((r) => r.data),
			})
			const q = h.mountCombinedQueries(client, [one("a", 1), one("b", "two")], combine)
			expect(q.current()).toEqual({ loading: true, data: [undefined, undefined] })
			await settle()
			expect(q.current()).toEqual({ loading: false, data: [1, "two"] })
			q.unmount()
		})

		it("combine runs again only when a result changed, and keeps its value's identity in between", async () => {
			const { client } = setup()
			const combine = vi.fn((results: ReadonlyArray<QueryResult<unknown>>) => ({ data: results.map((r) => r.data) }))
			const q = h.mountCombinedQueries(client, [one("a", 1), one("b", 2)], combine)
			await settle()
			const settled = q.current()
			const runs = combine.mock.calls.length
			await h.act(() => {}) // more renders, nothing changed
			await settle()
			expect(q.current()).toBe(settled)
			expect(combine).toHaveBeenCalledTimes(runs)

			await h.act(() => void client.invalidateQueries({ queryKey: ["a"] })) // a refetch changes a result
			await settle()
			const changed = q.current() // Vue and Angular compute lazily, on the first read
			expect(combine.mock.calls.length).toBeGreaterThan(runs)
			expect(changed).not.toBe(settled)
			expect(changed).toEqual({ data: [1, 2] })
			q.unmount()
		})

		it("follows a list that grows and shrinks, and stops observing on unmount", async () => {
			const { client } = setup()
			const q = h.mountQueries(client, [one("a", 1)])
			await settle()
			q.update([one("a", 1), one("b", 2), one("c", 3)])
			await settle()
			expect(q.current().map((r) => r.data)).toEqual([1, 2, 3])
			q.update([one("c", 3)])
			await settle()
			expect(q.current().map((r) => r.data)).toEqual([3])
			q.unmount()
			expect(client.getQuery(["c"]).hasListeners).toBe(false)
		})
	})

	describe(`${adapterName}: infinite query conformance`, () => {
		const pagesOf = (): InfiniteQueryObserverOptions<number[], Error, number> => ({
			queryKey: ["feed"],
			queryFn: ({ pageParam }) => Promise.resolve([pageParam * 10, pageParam * 10 + 1]),
			initialPageParam: 1,
			getNextPageParam: (_last, pages) => (pages.length < 3 ? pages.length + 1 : undefined),
			staleTime: Infinity,
			retry: false,
		})

		it("loads the first page, then more with fetchNextPage, until there are no more", async () => {
			const { client } = setup()
			const feed = h.mountInfiniteQuery(client, pagesOf())
			await settle()
			expect(feed.current().data?.pages).toEqual([[10, 11]])
			expect(feed.current().hasNextPage).toBe(true)
			await feed.fetchNextPage()
			await feed.fetchNextPage()
			expect(feed.current().data?.pages).toEqual([[10, 11], [20, 21], [30, 31]])
			expect(feed.current().hasNextPage).toBe(false)
			feed.unmount()
		})

		it("shows isFetchingNextPage while a page loads", async () => {
			const { client } = setup()
			let release!: () => void
			const gate = new Promise<void>((resolve) => (release = resolve))
			const feed = h.mountInfiniteQuery(client, {
				...pagesOf(),
				queryFn: async ({ pageParam }) => {
					if (pageParam === 2) await gate
					return [pageParam]
				},
			})
			await settle()
			const loading = feed.fetchNextPage()
			await h.act(() => {})
			expect(feed.current()).toMatchObject({ isFetchingNextPage: true, isFetching: true })
			release()
			await loading
			expect(feed.current()).toMatchObject({ isFetchingNextPage: false, isFetching: false })
			feed.unmount()
		})
	})

	describe(`${adapterName}: mutation conformance`, () => {
		it("supports optimistic updates with rollback through onMutate", async () => {
			const { client } = setup()
			let fail = false
			const q = h.mountQuery(client, { queryKey: ["todos"], queryFn: () => Promise.resolve(["a"]), staleTime: Infinity })
			await settle()
			const m = h.mountMutation<void, string, string[] | undefined>({
				onMutate: (item) => {
					const previous = client.getQueryData<string[]>(["todos"])
					client.setQueryData<string[]>(["todos"], (old) => [...(old ?? []), item])
					return previous
				},
				mutationFn: () => (fail ? Promise.reject(new Error("server said no")) : Promise.resolve()),
				onError: (_error, _item, previous) => client.setQueryData(["todos"], previous),
			})
			await m.mutateAsync("b")
			expect(q.current().data).toEqual(["a", "b"])
			fail = true
			await expect(m.mutateAsync("c")).rejects.toThrow("server said no")
			expect(q.current().data).toEqual(["a", "b"]) // rolled back
			expect(m.current().status).toBe("error")
			q.unmount()
			m.unmount()
		})

		it("goes pending then success, with the variables and result", async () => {
			const m = h.mountMutation<string, number>({ mutationFn: (n) => Promise.resolve(`#${n}`) })
			expect(m.current().status).toBe("idle")
			await expect(m.mutateAsync(7)).resolves.toBe("#7")
			expect(m.current()).toMatchObject({ status: "success", data: "#7", variables: 7 })
			m.unmount()
		})

		it("reports failures in state; mutate() does not throw", async () => {
			const m = h.mountMutation<string, void>({ mutationFn: () => Promise.reject(new Error("no")) })
			await h.act(() => m.mutate())
			await settle()
			expect(m.current().status).toBe("error")
			m.reset()
			await settle()
			expect(m.current().status).toBe("idle")
			m.unmount()
		})

		it("can invalidate queries and stay pending until they have refetched", async () => {
			const { client } = setup()
			let server = ["a"]
			const q = h.mountQuery(client, {
				queryKey: ["todos"],
				queryFn: () => Promise.resolve([...server]),
				staleTime: Infinity,
			})
			await settle()
			const m = h.mountMutation<void, string>({
				mutationFn: (item) => {
					server = [...server, item]
					return Promise.resolve()
				},
				onSuccess: () => client.invalidateQueries({ queryKey: ["todos"] }),
			})
			await m.mutateAsync("b")
			expect(q.current().data).toEqual(["a", "b"])
			q.unmount()
			m.unmount()
		})
	})

	describe(`${adapterName}: api conformance`, () => {
		const todos = [{ id: 1 }]

		it("a query built with api.queryOptions loads, and a changed params key fetches again", async () => {
			const { client } = setup()
			const adapter = createMockAdapter((req) => ({ data: { url: req.url, todos } }))
			const api = createApi({ adapter })
			const make = (page: number) => api.queryOptions<{ url: string }>("/todos", { params: { page } })
			const q = h.mountQuery(client, make(1))
			await settle()
			expect(q.current()).toMatchObject({ status: "success", data: { url: "/todos?page=1" } })
			q.update(make(2))
			await settle()
			expect(q.current().data).toMatchObject({ url: "/todos?page=2" })
			expect(adapter.calls).toHaveLength(2)
			q.unmount()
		})

		it("shares one HTTP request between components using the same path and params", async () => {
			const { client } = setup()
			const adapter = createMockAdapter({ "GET /todos": { data: todos } })
			const options = createApi({ adapter }).queryOptions("/todos")
			const a = h.mountQuery(client, options)
			const b = h.mountQuery(client, options)
			await settle()
			expect(adapter.calls).toHaveLength(1)
			expect(b.current().data).toEqual(todos)
			a.unmount()
			b.unmount()
		})

		it("api.mutationOptions posts the variables, and an HTTP error reaches the mutation state", async () => {
			const adapter = createMockAdapter({
				"POST /todos": (req) => ({ status: 201, data: JSON.parse(String(req.body)) }),
				"POST /broken": { status: 500, data: { message: "no" } },
			})
			const api = createApi({ adapter })
			const ok = h.mountMutation(api.mutationOptions<{ title: string }, { title: string }>("POST", "/todos"))
			await ok.mutateAsync({ title: "x" })
			await settle()
			expect(ok.current()).toMatchObject({ status: "success", data: { title: "x" } })
			ok.unmount()
			const bad = h.mountMutation(api.mutationOptions("POST", "/broken"))
			await bad.mutateAsync(undefined as never).catch(() => {})
			await settle()
			expect(bad.current()).toMatchObject({ status: "error", error: { code: "HTTP", status: 500 } })
			bad.unmount()
		})
	})

	describe(`${adapterName}: activity conformance`, () => {
		const deferred = <T>() => {
			let resolve!: (value: T) => void
			const promise = new Promise<T>((res) => (resolve = res))
			return { promise, resolve }
		}

		it("counts fetching queries, all or filtered, and follows them settling", async () => {
			const { client } = setup()
			const all = h.mountActivity(client)
			const todos = h.mountActivity(client, { queryKey: ["todos"] })
			expect([all.fetching(), todos.fetching()]).toEqual([0, 0])

			const a = deferred<string>()
			const b = deferred<string>()
			let pa!: Promise<string>
			await h.act(() => {
				pa = client.fetchQuery(["todos", 1], () => a.promise)
				void client.fetchQuery(["users"], () => b.promise)
			})
			expect([all.fetching(), todos.fetching()]).toEqual([2, 1])

			await h.act(async () => {
				a.resolve("x")
				await pa
			})
			expect([all.fetching(), todos.fetching()]).toEqual([1, 0])
			all.unmount()
			todos.unmount()
		})

		it("counts a mutation while it is pending, and keeps counting it after its component unmounts", async () => {
			const { client } = setup()
			const activity = h.mountActivity(client)
			const d = deferred<string>()
			const m = h.mountMutation<string, void>({ mutationFn: () => d.promise }, client)
			expect(activity.mutating()).toBe(0)

			await h.act(() => m.mutate())
			expect(activity.mutating()).toBe(1)
			await h.act(() => m.unmount()) // the request is still running
			expect(activity.mutating()).toBe(1)
			await h.act(async () => {
				d.resolve("done")
				await Promise.resolve()
			})
			await settle()
			expect(activity.mutating()).toBe(0)
			activity.unmount()
		})

		it("stops listening to the client on unmount", async () => {
			const { client } = setup()
			let active = 0
			const original = client.onChange.bind(client)
			vi.spyOn(client, "onChange").mockImplementation((listener) => {
				active++
				const off = original(listener)
				return () => {
					active--
					off()
				}
			})
			const activity = h.mountActivity(client)
			await settle()
			expect(active).toBe(1)
			activity.unmount()
			expect(active).toBe(0)
		})
	})

	describe(`${adapterName}: store conformance`, () => {
		it("shows the selected state and follows changes", async () => {
			const store = createStore({ count: 0, other: 0 })
			const view = h.mountStore(store, (s) => s.count)
			expect(view.current()).toBe(0)
			await h.act(() => store.setState({ count: 2 }))
			expect(view.current()).toBe(2)
			view.unmount()
		})

		it("keeps the same selected object while unrelated state changes", async () => {
			const store = createStore({ count: 0, other: 0 })
			const view = h.mountStore(store, (s) => ({ count: s.count }), shallowEqual)
			const before = view.current()
			await h.act(() => store.setState({ other: 1 }))
			expect(view.current()).toBe(before)
			await h.act(() => store.setState({ count: 1 }))
			expect(view.current()).toEqual({ count: 1 })
			expect(view.current()).not.toBe(before)
			view.unmount()
		})

		it("applies a batch of updates and shows the final state", async () => {
			const store = createStore({ a: 0, b: 0 })
			const view = h.mountStore(store, (s) => s.a + s.b)
			await h.act(() =>
				notifyManager.batch(() => {
					store.setState({ a: 1 })
					store.setState({ b: 2 })
				}),
			)
			expect(view.current()).toBe(3)
			view.unmount()
		})

		it("stops listening on unmount", async () => {
			const store = createStore({ n: 0 })
			let active = 0
			const spy: Subscribable<{ n: number }> = {
				getSnapshot: () => store.getSnapshot(),
				subscribe: (listener) => {
					active++
					const off = store.subscribe(listener)
					return () => {
						active--
						off()
					}
				},
			}
			const view = h.mountStore(spy, (s) => s.n)
			await settle()
			expect(active).toBe(1)
			view.unmount()
			expect(active).toBe(0)
		})

		it("works the same on a query observer: one mental model for query and store", async () => {
			const { client } = setup()
			const observer = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve("x") })
			const view = h.mountStore(observer, (r) => r.data)
			await settle()
			expect(view.current()).toBe("x")
			view.unmount()
		})
	})
	describe(`${adapterName}: result flags, select and refetch options`, () => {
		it("exposes the boolean flags through loading, success and a background refetch", async () => {
			const { client } = setup()
			let release!: (value: string) => void
			const q = h.mountQuery(client, { queryKey: ["flags"], queryFn: () => new Promise<string>((r) => (release = r)) })
			expect(q.current()).toMatchObject({ isPending: true, isLoading: true, isSuccess: false, isError: false, isRefetching: false })
			await h.act(() => release("a"))
			await settle()
			expect(q.current()).toMatchObject({ isPending: false, isLoading: false, isSuccess: true, isRefetching: false })
			let refetch!: Promise<unknown>
			await h.act(() => {
				refetch = q.refetch()
			})
			expect(q.current()).toMatchObject({ isSuccess: true, isRefetching: true, isLoading: false })
			await h.act(() => release("b"))
			await h.act(() => refetch)
			expect(q.current()).toMatchObject({ data: "b", isRefetching: false })
			q.unmount()
		})

		it("reports a failed first load as isLoadingError, with the failure reason", async () => {
			const { client } = setup()
			const q = h.mountQuery(client, { queryKey: ["bad"], queryFn: () => Promise.reject(new Error("nope")), retry: 0 })
			await settle()
			expect(q.current()).toMatchObject({ isError: true, isLoadingError: true, isRefetchError: false, isPending: false })
			expect(q.current().failureReason).toEqual(new Error("nope"))
			q.unmount()
		})

		it("select derives the data, leaves the cache alone, and follows a new select without refetching", async () => {
			const { client } = setup()
			const fn = vi.fn(() => Promise.resolve([1, 2, 3, 4]))
			const q = h.mountSelectedQuery(client, { queryKey: ["nums"], queryFn: fn, staleTime: Infinity }, (nums) => nums.filter((n) => n % 2 === 0))
			expect(q.current().data).toBeUndefined()
			await settle()
			expect(q.current().data).toEqual([2, 4])
			expect(client.getQueryData(["nums"])).toEqual([1, 2, 3, 4])
			const stable = q.current().data
			await settle()
			expect(q.current().data).toBe(stable) // memoized while nothing changed
			await h.act(() => q.setSelect((nums) => nums.filter((n) => n > 2)))
			await settle()
			expect(q.current().data).toEqual([3, 4])
			expect(fn).toHaveBeenCalledTimes(1)
			let refetched: number[] | undefined
			await h.act(async () => {
				refetched = await q.refetch()
			})
			expect(refetched).toEqual([3, 4])
			q.unmount()
		})

		it("refetchOnMount: false shows stale cached data without fetching; 'always' refetches fresh data", async () => {
			const { client } = setup()
			client.setQueryData(["cached"], "old")
			const fn = vi.fn(() => Promise.resolve("new"))
			const quiet = h.mountQuery(client, { queryKey: ["cached"], queryFn: fn, refetchOnMount: false })
			expect(quiet.current()).toMatchObject({ data: "old", isFetching: false, isStale: true })
			await settle()
			expect(fn).not.toHaveBeenCalled()
			quiet.unmount()
			const eager = h.mountQuery(client, { queryKey: ["cached"], queryFn: fn, staleTime: Infinity, refetchOnMount: "always" })
			await settle()
			expect(fn).toHaveBeenCalledTimes(1)
			expect(eager.current().data).toBe("new")
			eager.unmount()
		})

		it("applies the client's defaultOptions, and a function-form enabled", async () => {
			const scheduler = new FakeScheduler()
			const client = new QueryClient({ scheduler, defaultOptions: { queries: { staleTime: Infinity, retry: 0 } } })
			client.setQueryData(["d"], 1)
			const fn = counter()
			const fresh = h.mountQuery(client, { queryKey: ["d"], queryFn: fn })
			await settle()
			expect(fn).not.toHaveBeenCalled() // fresh by default
			expect(fresh.current().isStale).toBe(false)
			fresh.unmount()

			const make = (on: boolean): QueryObserverOptions<number> => ({ queryKey: ["gated"], queryFn: fn, enabled: () => on })
			const gated = h.mountQuery(client, make(false))
			await settle()
			expect(gated.current()).toMatchObject({ status: "idle", isPending: true, isLoading: false })
			gated.update(make(true))
			await settle()
			expect(gated.current().data).toBe(1)
			gated.unmount()
		})

		it("passes the query key to the query function", async () => {
			const { client } = setup()
			const q = h.mountQuery(client, { queryKey: ["echo", 7], queryFn: ({ queryKey }) => Promise.resolve(queryKey[1] as number) })
			await settle()
			expect(q.current().data).toBe(7)
			q.unmount()
		})
	})
}
