import { describe, expect, it, vi } from "vitest"
import { Mutation } from "../src/mutation"

const deferred = <T>() => {
	let resolve!: (v: T) => void
	let reject!: (e: unknown) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

describe("Mutation", () => {
	it("starts idle, goes pending, then success", async () => {
		const d = deferred<string>()
		const m = new Mutation<string, number>({ mutationFn: () => d.promise })
		expect(m.getSnapshot()).toEqual({ status: "idle", data: undefined, error: undefined, variables: undefined })
		const p = m.mutateAsync(5)
		expect(m.getSnapshot()).toMatchObject({ status: "pending", variables: 5 })
		d.resolve("ok")
		await expect(p).resolves.toBe("ok")
		expect(m.getSnapshot()).toMatchObject({ status: "success", data: "ok", variables: 5 })
	})

	it("calls onSuccess then onSettled, and waits for onSuccess before reporting success", async () => {
		const log: string[] = []
		const gate = deferred<void>()
		const m = new Mutation<number, void>({
			mutationFn: () => Promise.resolve(1),
			onSuccess: async (data) => {
				log.push(`success:${data}`)
				await gate.promise
			},
			onSettled: (data, error) => {
				log.push(`settled:${data}:${String(error)}`)
			},
		})
		const p = m.mutateAsync()
		await Promise.resolve()
		await Promise.resolve()
		expect(m.getSnapshot().status).toBe("pending")
		gate.resolve()
		await p
		expect(log).toEqual(["success:1", "settled:1:undefined"])
		expect(m.getSnapshot().status).toBe("success")
	})

	it("on failure: error state, onError, onSettled, and the promise rejects", async () => {
		const log: string[] = []
		const m = new Mutation<number, string>({
			mutationFn: () => Promise.reject(new Error("nope")),
			onSuccess: () => void log.push("success"),
			onError: (e, v) => void log.push(`error:${(e as Error).message}:${v}`),
			onSettled: (d, e) => void log.push(`settled:${d}:${(e as Error).message}`),
		})
		await expect(m.mutateAsync("v")).rejects.toThrow("nope")
		expect(log).toEqual(["error:nope:v", "settled:undefined:nope"])
		expect(m.getSnapshot()).toMatchObject({ status: "error", variables: "v" })
	})

	it("a throwing onSuccess turns the mutation into an error", async () => {
		const onError = vi.fn()
		const m = new Mutation<number, void>({
			mutationFn: () => Promise.resolve(1),
			onSuccess: () => {
				throw new Error("cb")
			},
			onError,
		})
		await expect(m.mutateAsync()).rejects.toThrow("cb")
		expect(onError).toHaveBeenCalledTimes(1)
		expect(m.getSnapshot().status).toBe("error")
	})

	it("a throwing onError still ends in the error state", async () => {
		const m = new Mutation<number, void>({
			mutationFn: () => Promise.reject(new Error("a")),
			onError: () => {
				throw new Error("b")
			},
		})
		await expect(m.mutateAsync()).rejects.toThrow("b")
		expect(m.getSnapshot().status).toBe("error")
	})

	it("a throwing onSettled rejects the call but keeps the success state", async () => {
		const m = new Mutation<number, void>({
			mutationFn: () => Promise.resolve(1),
			onSettled: () => {
				throw new Error("late")
			},
		})
		await expect(m.mutateAsync()).rejects.toThrow("late")
		expect(m.getSnapshot()).toMatchObject({ status: "success", data: 1 })
	})

	it("mutate() swallows the rejection", async () => {
		const m = new Mutation<number, void>({ mutationFn: () => Promise.reject(new Error("x")) })
		m.mutate()
		await new Promise((r) => setTimeout(r, 0))
		expect(m.getSnapshot().status).toBe("error")
	})

	it("only the latest run drives state, but every run settles on its own", async () => {
		const first = deferred<string>()
		const second = deferred<string>()
		const queue = [first, second]
		const onSuccess = vi.fn()
		const m = new Mutation<string, number>({ mutationFn: () => queue.shift()!.promise, onSuccess })
		const p1 = m.mutateAsync(1)
		const p2 = m.mutateAsync(2)
		second.resolve("two")
		await p2
		first.resolve("one")
		await expect(p1).resolves.toBe("one")
		expect(onSuccess).toHaveBeenCalledTimes(2)
		expect(m.getSnapshot()).toMatchObject({ status: "success", data: "two", variables: 2 })
	})

	it("reset() returns to idle and ignores the run in flight", async () => {
		const d = deferred<number>()
		const m = new Mutation<number, void>({ mutationFn: () => d.promise })
		const p = m.mutateAsync()
		m.reset()
		d.resolve(1)
		await p
		expect(m.getSnapshot().status).toBe("idle")
	})

	it("setOptions swaps callbacks for the next run; subscribers are notified; snapshot is stable", async () => {
		const a = vi.fn()
		const b = vi.fn()
		const m = new Mutation<number, void>({ mutationFn: () => Promise.resolve(1), onSuccess: a })
		const l = vi.fn()
		m.subscribe(l)
		expect(m.getSnapshot()).toBe(m.getSnapshot())
		m.setOptions({ mutationFn: () => Promise.resolve(1), onSuccess: b })
		await m.mutateAsync()
		expect(a).not.toHaveBeenCalled()
		expect(b).toHaveBeenCalledTimes(1)
		expect(l).toHaveBeenCalledTimes(2) // pending, success
	})
})

describe("Mutation onMutate / context", () => {
	it("passes onMutate's result to every callback, after awaiting it and before mutationFn", async () => {
		const log: string[] = []
		const m = new Mutation<string, number, { snapshot: string }>({
			onMutate: async (n) => {
				log.push(`mutate:${n}`)
				return { snapshot: `s${n}` }
			},
			mutationFn: (n) => {
				log.push("fn")
				return Promise.resolve(`#${n}`)
			},
			onSuccess: (data, v, ctx) => void log.push(`success:${data}:${v}:${ctx.snapshot}`),
			onSettled: (data, e, v, ctx) => void log.push(`settled:${data}:${String(e)}:${ctx?.snapshot}`),
		})
		await m.mutateAsync(1)
		expect(log).toEqual(["mutate:1", "fn", "success:#1:1:s1", "settled:#1:undefined:s1"])
	})

	it("on failure, onError gets the context so it can roll back", async () => {
		let rolledBack = ""
		const m = new Mutation<void, void, string>({
			onMutate: () => "previous",
			mutationFn: () => Promise.reject(new Error("no")),
			onError: (_e, _v, ctx) => void (rolledBack = ctx ?? "none"),
		})
		await expect(m.mutateAsync()).rejects.toThrow("no")
		expect(rolledBack).toBe("previous")
	})

	it("a throwing onMutate skips mutationFn, errors, and onError gets undefined context", async () => {
		const fn = vi.fn(() => Promise.resolve(1))
		let seen: unknown = "unset"
		const m = new Mutation<number, void, string>({
			onMutate: () => {
				throw new Error("mutate failed")
			},
			mutationFn: fn,
			onError: (_e, _v, ctx) => void (seen = ctx),
		})
		await expect(m.mutateAsync()).rejects.toThrow("mutate failed")
		expect(fn).not.toHaveBeenCalled()
		expect(seen).toBeUndefined()
		expect(m.getSnapshot().status).toBe("error")
	})
})
