import { FakeScheduler } from "@unicore/core/testing"
import {
	QueryClient,
	type MutationOptions,
	type MutationState,
	type QueryObserverOptions,
	type QueryResult,
} from "@unicore/query"
import { describe, expect, it, vi } from "vitest"

export interface QueryHandle<TData> {
	current(): QueryResult<TData>
	/** Re-render with new options (e.g. a changed key). */
	update(options: QueryObserverOptions<TData>): void
	refetch(): Promise<unknown>
	unmount(): void
}

export interface MutationHandle<TData, TVariables> {
	current(): MutationState<TData, TVariables>
	mutate(variables: TVariables): void
	mutateAsync(variables: TVariables): Promise<TData>
	reset(): void
	unmount(): void
}

/** What an adapter package must provide so the shared behaviour tests can drive it. */
export interface Harness {
	mountQuery<TData>(client: QueryClient, options: QueryObserverOptions<TData>): QueryHandle<TData>
	mountMutation<TData, TVariables>(options: MutationOptions<TData, TVariables>): MutationHandle<TData, TVariables>
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

	describe(`${adapterName}: mutation conformance`, () => {
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

	// keep `expect` referenced for adapters that extend this file
	void expect
}
