import { FakeScheduler } from "@omnifront/core/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CancelledError, Mutation, onlineManager, QueryClient, QueryObserver } from "../src"
import { createMutatingCount, createMutationState, trackMutation } from "../src/activity"

const flush = () => new Promise<void>((r) => setTimeout(r, 0))
const setup = () => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}

// A listener keeps the signal from re-reading the real environment when the first observer attaches.
let release: () => void
beforeEach(() => {
	release = onlineManager.subscribe(() => {})
})
afterEach(() => {
	onlineManager.set(true)
	release()
})

describe("queries and the network", () => {
	it("pauses a fetch while offline and runs it when the network is back", async () => {
		const { client } = setup()
		onlineManager.set(false)
		const queryFn = vi.fn(() => Promise.resolve("v"))
		const promise = client.fetchQuery(["k"], queryFn)
		expect(client.getQueryState(["k"])).toMatchObject({ isFetching: true, isPaused: true, status: "loading" })
		expect(queryFn).not.toHaveBeenCalled()
		onlineManager.set(true)
		expect(await promise).toBe("v")
		expect(client.getQueryState(["k"])).toMatchObject({ isFetching: false, isPaused: false, status: "success" })
	})

	it("the observer reports fetchStatus, and isFetching only while a request really runs", async () => {
		const { client } = setup()
		const observer = new QueryObserver(client, { queryKey: ["k"], queryFn: () => Promise.resolve(1) })
		expect(observer.getSnapshot().fetchStatus).toBe("fetching") // about to fetch on mount
		onlineManager.set(false)
		const off = observer.subscribe(() => {})
		expect(observer.getSnapshot()).toMatchObject({ fetchStatus: "paused", isPaused: true, isFetching: false, isLoading: false, isPending: true })
		onlineManager.set(true)
		expect(observer.getSnapshot()).toMatchObject({ fetchStatus: "fetching", isPaused: false, isFetching: true, isLoading: true })
		await flush()
		expect(observer.getSnapshot()).toMatchObject({ fetchStatus: "idle", data: 1 })
		off()
	})

	it("cancelling a paused fetch stops waiting", async () => {
		const { client } = setup()
		onlineManager.set(false)
		const queryFn = vi.fn(() => Promise.resolve("v"))
		const promise = client.fetchQuery(["k"], queryFn)
		client.cancelQuery(["k"])
		await expect(promise).rejects.toBeInstanceOf(CancelledError)
		expect(client.getQueryState(["k"])).toMatchObject({ isFetching: false, isPaused: false, status: "idle" })
		onlineManager.set(true)
		await flush()
		expect(queryFn).not.toHaveBeenCalled()
	})

	it("networkMode 'always' never waits; 'offlineFirst' tries once and pauses before the retry", async () => {
		const { client, scheduler } = setup()
		onlineManager.set(false)
		expect(await client.fetchQuery({ queryKey: ["a"], queryFn: () => Promise.resolve("local"), networkMode: "always" })).toBe("local")

		let calls = 0
		const queryFn = vi.fn(() => (++calls === 1 ? Promise.reject(new Error("first")) : Promise.resolve("second")))
		const promise = client.fetchQuery({ queryKey: ["b"], queryFn, networkMode: "offlineFirst", retry: 1, retryDelay: 10 })
		await flush()
		expect(queryFn).toHaveBeenCalledOnce()
		scheduler.advance(10)
		expect(client.getQueryState(["b"])).toMatchObject({ isPaused: true, failureCount: 1 })
		expect(queryFn).toHaveBeenCalledOnce()
		onlineManager.set(true)
		expect(await promise).toBe("second")
	})

	it("going offline between retries pauses the next attempt (default mode)", async () => {
		const { client, scheduler } = setup()
		let calls = 0
		const promise = client.fetchQuery({
			queryKey: ["k"],
			queryFn: () => (++calls === 1 ? Promise.reject(new Error("x")) : Promise.resolve(calls)),
			retry: 1,
			retryDelay: 10,
		})
		await flush()
		onlineManager.set(false)
		scheduler.advance(10)
		expect(client.getQueryState(["k"])?.isPaused).toBe(true)
		onlineManager.set(true)
		expect(await promise).toBe(2)
	})
})

describe("mutations: retry, pause, callbacks", () => {
	it("retries with backoff, exposing failureCount and failureReason, and clears them on success", async () => {
		const scheduler = new FakeScheduler()
		const client = new QueryClient({ scheduler })
		let calls = 0
		const mutation = new Mutation<string, Error, number>(
			{ mutationFn: () => (++calls < 3 ? Promise.reject(new Error(`fail ${calls}`)) : Promise.resolve("ok")), retry: 2, retryDelay: (n) => n * 10 },
			client,
		)
		scheduler.advance(5)
		const promise = mutation.mutateAsync(1)
		await flush()
		expect(mutation.getSnapshot()).toMatchObject({ isPending: true, failureCount: 1, failureReason: new Error("fail 1"), submittedAt: 5 })
		scheduler.advance(10)
		await flush()
		expect(mutation.getSnapshot().failureCount).toBe(2)
		scheduler.advance(20)
		expect(await promise).toBe("ok")
		expect(mutation.getSnapshot()).toMatchObject({ isSuccess: true, failureCount: 0, failureReason: undefined })
	})

	it("gives up after the retries and reports the last error", async () => {
		const scheduler = new FakeScheduler()
		const mutation = new Mutation<string>({ mutationFn: () => Promise.reject(new Error("no")), retry: 1, retryDelay: 1 }, new QueryClient({ scheduler }))
		const promise = mutation.mutateAsync()
		promise.catch(() => {})
		await flush()
		scheduler.advance(1)
		await expect(promise).rejects.toThrow("no")
		expect(mutation.getSnapshot()).toMatchObject({ isError: true, failureReason: new Error("no") })
	})

	it("waits for the network, unless networkMode is 'always'", async () => {
		onlineManager.set(false)
		const mutationFn = vi.fn((n: number) => Promise.resolve(n * 2))
		const waiting = new Mutation({ mutationFn })
		const eager = new Mutation({ mutationFn, networkMode: "always" })
		expect(await eager.mutateAsync(1)).toBe(2)
		const promise = waiting.mutateAsync(2)
		await flush()
		expect(waiting.getSnapshot()).toMatchObject({ isPending: true, isPaused: true })
		expect(mutationFn).toHaveBeenCalledOnce()
		onlineManager.set(true)
		expect(await promise).toBe(4)
		expect(waiting.getSnapshot()).toMatchObject({ isSuccess: true, isPaused: false })
	})

	it("per-call callbacks run only for the latest call, after the options' callbacks", async () => {
		const order: string[] = []
		let releaseFirst!: (v: string) => void
		const mutation = new Mutation<string, Error, number, { tag: string }>({
			mutationFn: (n) => (n === 1 ? new Promise<string>((r) => (releaseFirst = r)) : Promise.resolve(`r${n}`)),
			onMutate: () => ({ tag: "ctx" }),
			onSuccess: (data) => void order.push(`options ${data}`),
		})
		const first = mutation.mutateAsync(1, { onSuccess: () => void order.push("first call"), onSettled: () => void order.push("first settled") })
		await flush()
		await mutation.mutateAsync(2, {
			onSuccess: (data, variables, context) => void order.push(`second call ${data} ${variables} ${context.tag}`),
			onSettled: (data, error) => void order.push(`second settled ${data} ${String(error)}`),
		})
		releaseFirst("r1")
		await first
		expect(order).toEqual(["options r2", "second call r2 2 ctx", "second settled r2 undefined", "options r1"])

		const onError = vi.fn()
		const onSettled = vi.fn()
		const failing = new Mutation<string, Error, number>({ mutationFn: () => Promise.reject(new Error("bad")) })
		failing.mutate(1, { onError, onSettled })
		await flush()
		expect(onError).toHaveBeenCalledWith(new Error("bad"), 1, undefined)
		expect(onSettled).toHaveBeenCalledWith(undefined, new Error("bad"), 1, undefined)
		const superseded = failing.mutateAsync(2, { onError })
		failing.reset()
		await superseded.catch(() => {})
		expect(onError).toHaveBeenCalledOnce()
	})

	it("a client's default mutation options apply and can be overridden", async () => {
		const defaults = vi.fn()
		const own = vi.fn()
		const client = new QueryClient({ defaultOptions: { mutations: { onSuccess: defaults, meta: { from: "defaults" } } } })
		const a = new Mutation({ mutationFn: () => Promise.resolve(1) }, client)
		const b = new Mutation<number>({ mutationFn: () => Promise.resolve(2), onSuccess: own }, client)
		await a.mutateAsync()
		await b.mutateAsync()
		expect(defaults).toHaveBeenCalledOnce()
		expect(own).toHaveBeenCalledOnce()
		expect(a.options.meta).toEqual({ from: "defaults" })
	})
})

describe("mutation filters and createMutationState", () => {
	it("counts and lists tracked mutations by key, status and predicate", async () => {
		const { client } = setup()
		const releases: Array<() => void> = []
		const pending = () => new Promise<void>((r) => releases.push(r))
		const add = new Mutation<void, Error, string>({ mutationKey: ["todos", "add"], mutationFn: pending, meta: { optimistic: true } }, client)
		const remove = new Mutation<void, Error, number>({ mutationKey: ["todos", "remove"], mutationFn: pending }, client)
		const anonymous = new Mutation<void, Error, string>({ mutationFn: pending }, client)
		const stops = [add, remove, anonymous].map((m) => trackMutation(client, m))

		const all = createMutatingCount(client)
		const todos = createMutatingCount(client, { mutationKey: ["todos"] })
		const exact = createMutatingCount(client, { mutationKey: ["todos"], exact: true })
		const optimistic = createMutatingCount(client, { predicate: (m) => m.meta?.["optimistic"] === true })
		const variables = createMutationState(client, { filters: { mutationKey: ["todos"], status: "pending" }, select: (m) => m.state.variables })
		const states = createMutationState(client)
		const listener = vi.fn()
		const off = variables.subscribe(listener)
		const offAll = all.subscribe(() => {})

		add.mutate("milk")
		remove.mutate(3)
		anonymous.mutate("x")
		await flush()
		expect([all, todos, exact, optimistic].map((c) => c.getSnapshot())).toEqual([3, 2, 0, 1])
		expect(variables.getSnapshot()).toEqual(["milk", 3])
		expect(variables.getSnapshot()).toBe(variables.getSnapshot()) // stable while nothing changes
		expect(states.getSnapshot().map((s) => s.status)).toEqual(["pending", "pending", "pending"])
		expect(listener).toHaveBeenCalled()

		listener.mockClear()
		anonymous.reset() // not matched by the filter: the list keeps its identity and nobody is told
		const before = variables.getSnapshot()
		expect(variables.getSnapshot()).toBe(before)
		expect(listener).not.toHaveBeenCalled()

		releases.forEach((r) => r())
		await flush()
		expect(variables.getSnapshot()).toEqual([])
		expect(todos.getSnapshot()).toBe(0)
		off()
		offAll()
		expect(variables.getSnapshot()).toEqual([]) // unsubscribed: computed on demand
		stops.forEach((stop) => stop())
		expect(states.getSnapshot()).toEqual([])
	})
})
