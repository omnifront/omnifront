import { FakeScheduler } from "@omnifront/core/testing"
import { describe, expect, it, vi } from "vitest"
import { trackMutation } from "../src/activity"
import { onMutationEvents, onQueryEvents } from "../src/events"
import { Mutation } from "../src/mutation"
import { QueryClient } from "../src/query-client"
import { QueryObserver } from "../src/query-observer"

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const setup = () => {
	const scheduler = new FakeScheduler()
	return { scheduler, client: new QueryClient({ scheduler, gcTime: Infinity }) }
}

describe("onQueryEvents", () => {
	it("reports success once per fetch, with the key and state", async () => {
		const { client } = setup()
		const onSuccess = vi.fn()
		const onSettled = vi.fn()
		const stop = onQueryEvents(client, { onSuccess, onSettled })
		await client.fetchQuery(["k"], () => Promise.resolve("data"))
		await flush()
		expect(onSuccess).toHaveBeenCalledOnce()
		expect(onSuccess.mock.calls[0]![0]).toBe("data")
		expect(onSuccess.mock.calls[0]![1]).toMatchObject({ queryKey: ["k"], state: { status: "success", data: "data" } })
		expect(onSettled).toHaveBeenCalledWith("data", undefined, expect.objectContaining({ queryKey: ["k"] }))
		stop()
		await client.fetchQuery(["k"], () => Promise.resolve("again"))
		await flush()
		expect(onSuccess).toHaveBeenCalledOnce()
	})

	it("reports an error once, after the retries, even when the same error repeats", async () => {
		const { client, scheduler } = setup()
		const onError = vi.fn()
		const onSettled = vi.fn()
		onQueryEvents(client, { onError, onSettled })
		const error = new Error("boom")
		const first = client.fetchQuery(["k"], () => Promise.reject(error), { retry: 1, retryDelay: 10 })
		first.catch(() => {})
		await flush()
		expect(onError).not.toHaveBeenCalled()
		scheduler.advance(10)
		await flush()
		expect(onError).toHaveBeenCalledOnce()
		expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({ queryKey: ["k"] }))
		expect(onSettled).toHaveBeenCalledWith(undefined, error, expect.anything())
		client.fetchQuery(["k"], () => Promise.reject(error)).catch(() => {})
		await flush()
		expect(onError).toHaveBeenCalledTimes(2)
	})

	it("stays silent for cancelled fetches, setQueryData, and after being stopped mid-fetch", async () => {
		const { client } = setup()
		const handlers = { onSuccess: vi.fn(), onError: vi.fn(), onSettled: vi.fn() }
		const stop = onQueryEvents(client, handlers)
		client.setQueryData(["k"], 1)
		client.fetchQuery(["k"], () => new Promise(() => {})).catch(() => {})
		await flush()
		client.cancelQuery(["k"])
		// Cancelled before the listener could even join.
		client.fetchQuery(["k"], () => new Promise(() => {})).catch(() => {})
		client.cancelQuery(["k"])
		await flush()
		let release!: (v: string) => void
		const pending = client.fetchQuery(["other"], () => new Promise<string>((r) => (release = r)))
		await flush()
		stop()
		release("late")
		await pending
		let fail!: (e: unknown) => void
		const failing = client.fetchQuery(["third"], () => new Promise<string>((_, r) => (fail = r)))
		failing.catch(() => {})
		await flush()
		fail(new Error("late"))
		await flush()
		for (const fn of Object.values(handlers)) expect(fn).not.toHaveBeenCalled()
	})

	it("picks up a fetch that was already running, and reports one event to several observers", async () => {
		const { client } = setup()
		let release!: (v: string) => void
		const queryFn = () => new Promise<string>((r) => (release = r))
		const a = new QueryObserver(client, { queryKey: ["k"], queryFn })
		const b = new QueryObserver(client, { queryKey: ["k"], queryFn })
		const offA = a.subscribe(() => {})
		const offB = b.subscribe(() => {})
		const onSuccess = vi.fn()
		onQueryEvents(client, { onSuccess })
		onQueryEvents(client, {}) // handlers are optional
		await flush()
		release("v")
		await flush()
		expect(onSuccess).toHaveBeenCalledOnce()
		client.fetchQuery(["bad"], () => Promise.reject(new Error("x"))).catch(() => {})
		await flush()
		offA()
		offB()
	})
})

describe("onMutationEvents", () => {
	it("reports start, success and failure of tracked mutations", async () => {
		const { client } = setup()
		const mutation = new Mutation<string, Error, number>({
			mutationFn: (n) => (n > 0 ? Promise.resolve(`ok ${n}`) : Promise.reject(new Error("neg"))),
		})
		const running = new Mutation<string, Error, number>({ mutationFn: () => new Promise(() => {}) })
		trackMutation(client, running)
		running.mutate(9)
		const handlers = { onMutate: vi.fn(), onSuccess: vi.fn(), onError: vi.fn(), onSettled: vi.fn() }
		const stop = onMutationEvents(client, handlers)
		const untrack = trackMutation(client, mutation)
		expect(handlers.onMutate).not.toHaveBeenCalled() // `running` started before we listened

		await mutation.mutateAsync(1)
		expect(handlers.onMutate).toHaveBeenCalledWith(1)
		expect(handlers.onSuccess).toHaveBeenCalledWith("ok 1", 1)
		expect(handlers.onSettled).toHaveBeenCalledWith("ok 1", undefined, 1)

		await mutation.mutateAsync(-1).catch(() => {})
		expect(handlers.onError).toHaveBeenCalledWith(expect.objectContaining({ message: "neg" }), -1)
		expect(handlers.onSettled).toHaveBeenLastCalledWith(undefined, expect.anything(), -1)

		mutation.reset()
		expect(handlers.onSettled).toHaveBeenCalledTimes(2)

		// A second call while the first is pending is a new start; only the latest run is reported.
		running.mutate(10)
		expect(handlers.onMutate).toHaveBeenLastCalledWith(10)
		running.reset()
		expect(handlers.onSettled).toHaveBeenCalledTimes(2)

		stop()
		await mutation.mutateAsync(2)
		expect(handlers.onSuccess).toHaveBeenCalledOnce()
		untrack()
		onMutationEvents(client, {})()
	})

	it("works with no handlers", async () => {
		const { client } = setup()
		const mutation = new Mutation<string, Error, number>({ mutationFn: (n) => (n ? Promise.resolve("ok") : Promise.reject(new Error("x"))) })
		onMutationEvents(client, {})
		trackMutation(client, mutation)
		await mutation.mutateAsync(1)
		await mutation.mutateAsync(0).catch(() => {})
		expect(mutation.getSnapshot().status).toBe("error")
	})
})
