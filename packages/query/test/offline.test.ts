import { FakeScheduler } from "@omnifront/core/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Mutation, onlineManager, QueryClient } from "../src"
import { createMutatingCount, trackMutation } from "../src/activity"
import {
	dehydrateMutations,
	enableOffline,
	getMutationDefaults,
	hydrateMutations,
	resumePausedMutations,
	setMutationDefaults,
} from "../src/offline"

const flush = () => new Promise<void>((r) => setTimeout(r, 0))
const setup = () => {
	const scheduler = new FakeScheduler()
	const client = new QueryClient({ scheduler, gcTime: Infinity })
	enableOffline(client)
	return { scheduler, client }
}
const tracked = <TData, TVariables>(client: QueryClient, options: ConstructorParameters<typeof Mutation<TData, Error, TVariables>>[0]) => {
	const mutation = new Mutation<TData, Error, TVariables>(options, client)
	trackMutation(client, mutation)
	return mutation
}

let release: () => void
beforeEach(() => {
	release = onlineManager.subscribe(() => {}) // keep the signal from re-reading the real environment
})
afterEach(() => {
	onlineManager.set(true)
	release()
})

/** A mutation function that stays pending until the test lets it finish, recording the order it started in. */
const gated = () => {
	const started: string[] = []
	const finish = new Map<string, () => void>()
	const fn = (name: string) =>
		new Promise<string>((resolve) => {
			started.push(name)
			finish.set(name, () => resolve(name))
		})
	return { started, finish, fn }
}

describe("scope", () => {
	it("runs mutations of one scope one after another, in the order they were called", async () => {
		const { client } = setup()
		const g = gated()
		const m = tracked<string, string>(client, { mutationFn: g.fn, scope: { id: "todos" } })
		m.mutate("a")
		m.mutate("b")
		m.mutate("c")
		await flush()
		expect(g.started).toEqual(["a"])
		g.finish.get("a")!()
		await flush()
		expect(g.started).toEqual(["a", "b"])
		g.finish.get("b")!()
		await flush()
		g.finish.get("c")!()
		await flush()
		expect(g.started).toEqual(["a", "b", "c"])
		expect(m.getSnapshot()).toMatchObject({ isSuccess: true, data: "c" })
	})

	it("shows a call that waits for its turn as paused, until it is its turn", async () => {
		const { client } = setup()
		const g = gated()
		const m = tracked<string, string>(client, { mutationFn: g.fn, scope: { id: "s" } })
		m.mutate("a")
		await flush()
		expect(m.getSnapshot()).toMatchObject({ isPending: true, isPaused: false })
		m.mutate("b") // the latest call, and it has to wait for "a"
		await flush()
		expect(m.getSnapshot()).toMatchObject({ variables: "b", isPending: true, isPaused: true })
		g.finish.get("a")!()
		await flush()
		expect(m.getSnapshot()).toMatchObject({ isPaused: false })
		g.finish.get("b")!()
		await flush()
		expect(m.getSnapshot()).toMatchObject({ isSuccess: true, isPaused: false })
	})

	it("runs different scopes, and mutations without a scope, side by side", async () => {
		const { client } = setup()
		const g = gated()
		const a = tracked<string, string>(client, { mutationFn: g.fn, scope: { id: "a" } })
		const b = tracked<string, string>(client, { mutationFn: g.fn, scope: { id: "b" } })
		const free = tracked<string, string>(client, { mutationFn: g.fn })
		a.mutate("a1")
		b.mutate("b1")
		free.mutate("free")
		await flush()
		expect(g.started).toEqual(["a1", "b1", "free"])
	})

	it("onMutate of a waiting mutation runs at once, so optimistic updates show immediately", async () => {
		const { client } = setup()
		const g = gated()
		const onMutate = vi.fn((name: string) => `ctx ${name}`)
		const onSettled = vi.fn()
		const m = tracked<string, string>(client, { mutationFn: g.fn, scope: { id: "s" }, onMutate, onSettled })
		m.mutate("a")
		m.mutate("b")
		await flush()
		expect(onMutate).toHaveBeenCalledTimes(2) // both, although only "a" is running
		expect(g.started).toEqual(["a"])
		g.finish.get("a")!()
		await flush()
		expect(onSettled).toHaveBeenCalledWith("a", undefined, "a", "ctx a")
		g.finish.get("b")!()
		await flush()
		expect(onSettled).toHaveBeenLastCalledWith("b", undefined, "b", "ctx b")
	})

	it("a failure does not block the line, nor does an onMutate that throws", async () => {
		const { client } = setup()
		const order: string[] = []
		const m = tracked<string, string>(client, {
			scope: { id: "s" },
			onMutate: (name) => {
				if (name === "bad-mutate") throw new Error("onMutate")
			},
			mutationFn: (name) => {
				order.push(name)
				return name === "fails" ? Promise.reject(new Error("fn")) : Promise.resolve(name)
			},
		})
		m.mutate("fails")
		m.mutate("bad-mutate")
		m.mutate("last")
		await flush()
		await flush()
		expect(order).toEqual(["fails", "last"])
		expect(m.getSnapshot()).toMatchObject({ isSuccess: true, data: "last" })
	})

	it("the same Mutation can be called twice: each call has its own place in line", async () => {
		const { client } = setup()
		const g = gated()
		const m = tracked<string, string>(client, { mutationFn: g.fn, scope: { id: "s" } })
		const first = m.mutateAsync("a")
		const second = m.mutateAsync("b")
		await flush()
		g.finish.get("a")!()
		await first
		g.finish.get("b")!()
		await second
		expect(g.started).toEqual(["a", "b"])
	})

	it("the scope table does not grow: an id that is idle again is forgotten", async () => {
		const { client } = setup()
		const m = tracked<string, string>(client, { mutationFn: (n) => Promise.resolve(n), scope: { id: "s" } })
		await m.mutateAsync("a")
		await m.mutateAsync("b")
		expect(m.getSnapshot().data).toBe("b")
	})

	it("is ignored without enableOffline, and enableOffline twice changes nothing", async () => {
		const scheduler = new FakeScheduler()
		const plain = new QueryClient({ scheduler })
		const g = gated()
		const m = new Mutation<string, Error, string>({ mutationFn: g.fn, scope: { id: "s" } }, plain)
		m.mutate("a")
		m.mutate("b")
		await flush()
		expect(g.started).toEqual(["a", "b"]) // no scope without enableOffline

		const { client } = setup()
		enableOffline(client)
		const wrap = client.getDefaultOptions().mutations?.wrap
		enableOffline(client)
		expect(client.getDefaultOptions().mutations?.wrap).toBe(wrap)
	})

	it("a wrap already in the client's defaults runs around the scope", async () => {
		const scheduler = new FakeScheduler()
		const seen: string[] = []
		const client = new QueryClient({
			scheduler,
			defaultOptions: { mutations: { wrap: (attempts) => (seen.push("outer"), attempts()) } },
		})
		enableOffline(client)
		await new Mutation<string, Error, string>({ mutationFn: (n) => Promise.resolve(n), scope: { id: "s" } }, client).mutateAsync("x")
		expect(seen).toEqual(["outer"])
	})

	it("keeps the other defaults of the client", () => {
		const client = new QueryClient({ defaultOptions: { queries: { staleTime: 5 }, mutations: { retry: 2 } } })
		enableOffline(client)
		expect(client.getDefaultOptions()).toMatchObject({ queries: { staleTime: 5 }, mutations: { retry: 2 } })
	})
})

describe("dehydrateMutations", () => {
	it("lists the mutations waiting for the network, with their context, oldest first", async () => {
		const { client, scheduler } = setup()
		onlineManager.set(false)
		const m = tracked<string, string>(client, {
			mutationKey: ["add"],
			mutationFn: (n) => Promise.resolve(n),
			onMutate: (n) => ({ snapshot: `before ${n}` }) as never,
			meta: { why: "test" },
		})
		const other = tracked<string, number>(client, { mutationKey: ["remove"], mutationFn: () => Promise.resolve("x"), scope: { id: "s" } })
		m.mutate("milk")
		await flush()
		scheduler.advance(5)
		other.mutate(7)
		await flush()
		expect(dehydrateMutations(client)).toEqual([
			{ mutationKey: ["add"], variables: "milk", context: { snapshot: "before milk" }, scope: undefined, meta: { why: "test" }, submittedAt: 0 },
			{ mutationKey: ["remove"], variables: 7, context: undefined, scope: { id: "s" }, meta: undefined, submittedAt: 5 },
		])
		expect(JSON.parse(JSON.stringify(dehydrateMutations(client)))).toHaveLength(2)
	})

	it("includes a mutation waiting for its turn in a scope, but not the one that is running", async () => {
		const { client } = setup()
		const g = gated()
		const m = tracked<string, string>(client, { mutationKey: ["k"], mutationFn: g.fn, scope: { id: "s" } })
		m.mutate("running")
		await flush()
		expect(dehydrateMutations(client)).toEqual([]) // sent: it may have reached the server
		m.mutate("waiting")
		await flush()
		expect(dehydrateMutations(client).map((d) => d.variables)).toEqual(["waiting"])
		g.finish.get("running")!()
		await flush()
		expect(dehydrateMutations(client)).toEqual([]) // now "waiting" is the one running
	})

	it("leaves out mutations without a key, finished ones and idle ones", async () => {
		const { client } = setup()
		onlineManager.set(false)
		tracked<string, string>(client, { mutationFn: (n) => Promise.resolve(n) }).mutate("no key")
		tracked<string, string>(client, { mutationKey: ["idle"], mutationFn: (n) => Promise.resolve(n) })
		await flush()
		expect(dehydrateMutations(client)).toEqual([])
		onlineManager.set(true)
		const done = tracked<string, string>(client, { mutationKey: ["done"], mutationFn: (n) => Promise.resolve(n) })
		await done.mutateAsync("x")
		expect(dehydrateMutations(client)).toEqual([])
	})

	it("lists every waiting call, also several from one mutation, and drops them as soon as the network is back", async () => {
		const { client } = setup()
		onlineManager.set(false)
		const m = tracked<string, string>(client, { mutationKey: ["add"], mutationFn: (n) => Promise.resolve(n), onMutate: (n) => `ctx ${n}` as never })
		m.mutate("a")
		m.mutate("b")
		m.mutate("c")
		await flush()
		expect(dehydrateMutations(client).map((d) => [d.variables, d.context])).toEqual([["a", "ctx a"], ["b", "ctx b"], ["c", "ctx c"]])
		onlineManager.set(true) // they are about to be sent: no longer "not sent"
		expect(dehydrateMutations(client)).toEqual([])
		await flush()
		expect(m.getSnapshot().isSuccess).toBe(true)
	})

	it("a call that started while the network was up is never listed, even if the network drops afterwards", async () => {
		const { client } = setup()
		const g = gated()
		const m = tracked<string, string>(client, { mutationKey: ["add"], mutationFn: g.fn })
		m.mutate("in flight")
		await flush()
		onlineManager.set(false)
		expect(dehydrateMutations(client)).toEqual([])
		g.finish.get("in flight")!()
		await flush()
	})

	it("also lists a call whose mutation is not tracked, and a mutation in 'always' mode is never waiting", async () => {
		const { client } = setup()
		onlineManager.set(false)
		new Mutation<string, Error, string>({ mutationKey: ["untracked"], mutationFn: (n) => Promise.resolve(n) }, client).mutate("x")
		new Mutation<string, Error, string>({ mutationKey: ["local"], mutationFn: (n) => Promise.resolve(n), networkMode: "always" }, client).mutate("y")
		await flush()
		expect(dehydrateMutations(client).map((d) => d.mutationKey)).toEqual([["untracked"]])
	})

	it("returns nothing for a client that never called enableOffline", async () => {
		const plain = new QueryClient({ scheduler: new FakeScheduler() })
		onlineManager.set(false)
		new Mutation<string, Error, string>({ mutationKey: ["k"], mutationFn: (n) => Promise.resolve(n) }, plain).mutate("x")
		await flush()
		expect(dehydrateMutations(plain)).toEqual([])
		await resumePausedMutations(plain)
	})
})

describe("hydrateMutations", () => {
	const create = (client: QueryClient) => (options: Parameters<typeof setMutationDefaults>[2]) => new Mutation(options, client)

	it("restores saved mutations: no onMutate, the saved context, the network wait, oldest first", async () => {
		const { client } = setup()
		const sent: string[] = []
		const onMutate = vi.fn()
		const onSettled = vi.fn()
		setMutationDefaults(client, ["add"], {
			mutationFn: (v) => (sent.push(String(v)), Promise.resolve(`saved ${String(v)}`)),
			onMutate,
			onSettled,
		})
		onlineManager.set(false)
		const skipped = hydrateMutations(
			client,
			[
				{ mutationKey: ["add"], variables: "second", context: "ctx2", submittedAt: 20 },
				{ mutationKey: ["add"], variables: "first", context: "ctx1", submittedAt: 10 },
			],
			create(client),
		)
		await flush()
		expect(skipped).toEqual([])
		expect(sent).toEqual([]) // offline: waiting
		expect(onMutate).not.toHaveBeenCalled()
		expect(createMutatingCount(client).getSnapshot()).toBe(2)
		expect(dehydrateMutations(client).map((d) => [d.variables, d.context])).toEqual([["first", "ctx1"], ["second", "ctx2"]])

		onlineManager.set(true)
		await flush()
		expect(sent).toEqual(["first", "second"])
		expect(onSettled).toHaveBeenCalledWith("saved first", undefined, "first", "ctx1")
		expect(onSettled).toHaveBeenCalledWith("saved second", undefined, "second", "ctx2")
		expect(createMutatingCount(client).getSnapshot()).toBe(0)
		expect(dehydrateMutations(client)).toEqual([])
	})

	it("restores the scope too, so restored mutations still run in order", async () => {
		const { client } = setup()
		const g = gated()
		setMutationDefaults(client, ["add"], { mutationFn: (v) => g.fn(String(v)) })
		hydrateMutations(
			client,
			[
				{ mutationKey: ["add"], variables: "a", context: undefined, scope: { id: "s" }, submittedAt: 1 },
				{ mutationKey: ["add"], variables: "b", context: undefined, scope: { id: "s" }, submittedAt: 2 },
			],
			create(client),
		)
		await flush()
		expect(g.started).toEqual(["a"])
		g.finish.get("a")!()
		await flush()
		expect(g.started).toEqual(["a", "b"])
	})

	it("returns the saved mutations it could not restore for lack of defaults, and restores the rest", async () => {
		const { client } = setup()
		const sent = vi.fn(() => Promise.resolve("ok"))
		setMutationDefaults(client, ["known"], { mutationFn: sent })
		const skipped = hydrateMutations(
			client,
			[
				{ mutationKey: ["unknown"], variables: 1, context: 2, meta: { a: 1 }, scope: { id: "s" }, submittedAt: 1 },
				{ mutationKey: ["known"], variables: 3, context: undefined, submittedAt: 2 },
			],
			create(client),
		)
		await flush()
		expect(skipped).toEqual([{ mutationKey: ["unknown"], variables: 1, context: 2, meta: { a: 1 }, scope: { id: "s" }, submittedAt: 0 }])
		expect(sent).toHaveBeenCalledOnce()
	})

	it("defaults are looked up by key, per client", () => {
		const { client } = setup()
		const other = setup().client
		const options = { mutationFn: () => Promise.resolve(1) }
		setMutationDefaults(client, ["a", { id: 1, b: 2 }], options)
		expect(getMutationDefaults(client, ["a", { b: 2, id: 1 }])).toBe(options)
		expect(getMutationDefaults(client, ["a"])).toBeUndefined()
		expect(getMutationDefaults(other, ["a", { id: 1, b: 2 }])).toBeUndefined()
	})
})

describe("resumePausedMutations", () => {
	it("resolves when the waiting mutations have settled, and at once when none is waiting", async () => {
		const { client } = setup()
		await resumePausedMutations(client)
		onlineManager.set(false)
		const m = tracked<string, string>(client, { mutationKey: ["k"], mutationFn: (n) => Promise.resolve(n) })
		const running = tracked<string, string>(client, { mutationKey: ["r"], mutationFn: () => new Promise<string>(() => {}), networkMode: "always" })
		running.mutate("x") // sent, not waiting: not waited for
		m.mutate("a")
		await flush()
		let done = false
		void resumePausedMutations(client).then(() => (done = true))
		await flush()
		expect(done).toBe(false)
		onlineManager.set(true)
		await flush()
		expect(done).toBe(true)
		expect(m.getSnapshot().data).toBe("a")
	})

	it("also waits for mutations queued in a scope", async () => {
		const { client } = setup()
		const g = gated()
		const m = tracked<string, string>(client, { mutationFn: g.fn, scope: { id: "s" } })
		m.mutate("a")
		m.mutate("b")
		await flush()
		let done = false
		void resumePausedMutations(client).then(() => (done = true))
		g.finish.get("a")!()
		await flush()
		expect(done).toBe(false)
		g.finish.get("b")!()
		await flush()
		expect(done).toBe(true)
	})
})
