import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "@unicore/query"
import { computed, createApp, createSSRApp, defineComponent, h, nextTick, ref } from "vue"
import { renderToString } from "vue/server-renderer"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createStore } from "@unicore/store"
import { provideQueryClient, QueryPlugin, useMutation, useQuery, useQueryClient, useStore } from "../src"
import { mountComposable } from "./mount"

const newClient = () => new QueryClient({ scheduler: new FakeScheduler() })
const flush = async () => {
	await new Promise((r) => setTimeout(r, 0))
	await nextTick()
}

afterEach(() => vi.unstubAllGlobals())

describe("plugin / injection", () => {
	it("app.use(QueryPlugin, client) makes the client injectable", () => {
		const client = newClient()
		const { result } = mountComposable(() => useQueryClient(), client)
		expect(result).toBe(client)
	})

	it("throws a helpful error when nothing is installed", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
		expect(() => mountComposable(() => useQueryClient())).toThrow(/QueryPlugin/)
		warn.mockRestore()
	})

	it("provideQueryClient overrides the client for a subtree", () => {
		const outer = newClient()
		const inner = newClient()
		let seen: QueryClient | undefined
		const Child = defineComponent({
			setup() {
				seen = useQueryClient()
				return () => null
			},
		})
		const Parent = defineComponent({
			setup() {
				provideQueryClient(inner)
				return () => h(Child)
			},
		})
		const app = createApp(Parent).use(QueryPlugin, outer)
		app.mount(document.createElement("div"))
		expect(seen).toBe(inner)
		app.unmount()
	})
})

describe("useQuery in a component", () => {
	it("re-renders the template as the query progresses, and follows a ref key", async () => {
		const client = newClient()
		const id = ref(1)
		const Comp = defineComponent({
			setup() {
				const { data, status } = useQuery(() => ({
					queryKey: ["item", id.value],
					queryFn: () => Promise.resolve(`item-${id.value}`),
				}))
				return () => h("p", status.value === "loading" ? "loading" : data.value)
			},
		})
		const el = document.createElement("div")
		const app = createApp(Comp).use(QueryPlugin, client)
		app.mount(el)
		expect(el.textContent).toBe("loading")
		await flush()
		expect(el.textContent).toBe("item-1")
		id.value = 2
		await flush()
		expect(el.textContent).toBe("item-2")
		app.unmount()
	})

	it("accepts a plain object, a ref and a computed as options", async () => {
		const client = newClient()
		const make = (n: number) => ({ queryKey: ["n", n], queryFn: () => Promise.resolve(n) })
		const plain = mountComposable(() => useQuery(make(1)), client)
		const viaRef = mountComposable(() => useQuery(ref(make(2))), client)
		const viaComputed = mountComposable(() => useQuery(computed(() => make(3))), client)
		await flush()
		expect([plain, viaRef, viaComputed].map((m) => m.result.data.value)).toEqual([1, 2, 3])
		for (const m of [plain, viaRef, viaComputed]) m.unmount()
	})

	it("the result fields are individually reactive refs", async () => {
		const client = newClient()
		const { result, unmount } = mountComposable(
			() => useQuery({ queryKey: ["k"], queryFn: () => Promise.resolve(5), staleTime: Infinity }),
			client,
		)
		const { status, data } = result // destructuring must keep reactivity
		expect(status.value).toBe("loading")
		await flush()
		expect([status.value, data.value]).toEqual(["success", 5])
		unmount()
	})

	it("stops observing when its component is unmounted", async () => {
		const client = newClient()
		const fn = vi.fn(() => Promise.resolve(1))
		const m = mountComposable(() => useQuery({ queryKey: ["k"], queryFn: fn, staleTime: Infinity, gcTime: 10 }), client)
		await flush()
		m.unmount()
		await client.invalidateQueries()
		expect(fn).toHaveBeenCalledTimes(1)
	})

	it("on the server it fetches before rendering (onServerPrefetch) and never subscribes", async () => {
		const client = newClient()
		const fn = vi.fn(() => Promise.resolve("x"))
		vi.stubGlobal("window", undefined)
		const Comp = defineComponent({
			setup() {
				const { status, data } = useQuery({ queryKey: ["k"], queryFn: fn })
				return () => h("p", `${status.value}:${data.value}`)
			},
		})
		const html = await renderToString(createSSRApp(Comp).use(QueryPlugin, client))
		expect(html).toContain("success:x")
		expect(fn).toHaveBeenCalledTimes(1)
		expect(client.getQuery(["k"]).hasListeners).toBe(false)
	})

	it("on the server a fresh cached entry is not fetched again", async () => {
		const client = newClient()
		client.setQueryData(["k"], "cached")
		const fn = vi.fn(() => Promise.resolve("new"))
		vi.stubGlobal("window", undefined)
		const Comp = defineComponent({
			setup() {
				const { data } = useQuery({ queryKey: ["k"], queryFn: fn, staleTime: Infinity })
				return () => h("p", String(data.value))
			},
		})
		expect(await renderToString(createSSRApp(Comp).use(QueryPlugin, client))).toContain("cached")
		expect(fn).not.toHaveBeenCalled()
	})
})

describe("useMutation in a component", () => {
	it("tracks status and uses the latest callbacks when options are reactive", async () => {
		const client = newClient()
		const a = vi.fn()
		const b = vi.fn()
		const onSuccess = ref(a)
		const { result, unmount } = mountComposable(
			() => useMutation(() => ({ mutationFn: (n: number) => Promise.resolve(n * 2), onSuccess: onSuccess.value })),
			client,
		)
		onSuccess.value = b
		await nextTick()
		await result.mutateAsync(4)
		expect(result.data.value).toBe(8)
		expect(a).not.toHaveBeenCalled()
		expect(b).toHaveBeenCalledWith(8, 4, undefined)
		unmount()
	})
})

describe("useStore", () => {
	it("returns the whole state without a selector, and updates a template", async () => {
		const store = createStore({ n: 1 })
		const Comp = defineComponent({
			setup() {
				const state = useStore(store)
				return () => h("p", `n=${state.value.n}`)
			},
		})
		const el = document.createElement("div")
		const app = createApp(Comp)
		app.mount(el)
		expect(el.textContent).toBe("n=1")
		store.setState({ n: 2 })
		await nextTick()
		expect(el.textContent).toBe("n=2")
		app.unmount()
	})

	it("does not subscribe on the server", async () => {
		const store = createStore({ n: 1 })
		let subscribed = false
		const spy = { getSnapshot: () => store.getSnapshot(), subscribe: () => ((subscribed = true), () => {}) }
		vi.stubGlobal("window", undefined)
		const Comp = defineComponent({
			setup() {
				const n = useStore(spy, (s) => s.n)
				return () => h("p", `n=${n.value}`)
			},
		})
		expect(await renderToString(createApp(Comp))).toContain("n=1")
		expect(subscribed).toBe(false)
	})
})
