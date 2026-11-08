import { Component, signal } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { FakeScheduler } from "@unicore/core/testing"
import { QueryClient } from "@unicore/query"
import { describe, expect, it, vi } from "vitest"
import { createStore } from "@unicore/store"
import { injectMutation, injectQuery, injectQueryClient, injectStore, provideUnicore } from "../src"
import { flushEffects, mountInjectable } from "./mount"

const newClient = () => new QueryClient({ scheduler: new FakeScheduler() })
const settle = async () => {
	await new Promise((r) => setTimeout(r, 0))
	flushEffects()
}

describe("provideUnicore / injectQueryClient", () => {
	it("hands out the provided client", () => {
		const client = newClient()
		expect(mountInjectable(() => injectQueryClient(), [provideUnicore(client)]).result).toBe(client)
	})

	it("throws a helpful error without provideUnicore", () => {
		expect(() => mountInjectable(() => injectQueryClient())).toThrow(/provideUnicore/)
	})
})

describe("injectQuery / injectMutation", () => {
	it("accepts plain option objects; slices are signals", async () => {
		const client = newClient()
		const { result: q, unmount } = mountInjectable(
			() => injectQuery({ queryKey: ["k"], queryFn: () => Promise.resolve(5), staleTime: Infinity }),
			[provideUnicore(client)],
		)
		expect(q.status()).toBe("loading")
		await settle()
		expect([q.status(), q.data(), q.isFetching(), q.isStale(), q.failureCount()]).toEqual(["success", 5, false, false, 0])
		expect(q.error()).toBeUndefined()
		expect(q.isInvalidated()).toBe(false)
		expect(q.dataUpdatedAt()).toBeDefined()
		unmount()
	})

	it("injectMutation with plain options and a function of signals", async () => {
		const factor = signal(2)
		const { result: m, unmount } = mountInjectable(() =>
			injectMutation(() => ({ mutationFn: (n: number) => Promise.resolve(n * factor()) })),
		)
		expect(await m.mutateAsync(3)).toBe(6)
		factor.set(10)
		flushEffects()
		expect(await m.mutateAsync(3)).toBe(30)
		const plain = mountInjectable(() => injectMutation({ mutationFn: () => Promise.resolve(1) }))
		await plain.result.mutateAsync()
		expect(plain.result.status()).toBe("success")
		plain.unmount()
		unmount()
	})

	it("stops observing when its injector is destroyed", async () => {
		const client = newClient()
		const fn = vi.fn(() => Promise.resolve(1))
		const m = mountInjectable(() => injectQuery({ queryKey: ["k"], queryFn: fn, staleTime: Infinity }), [provideUnicore(client)])
		await settle()
		m.unmount()
		await client.invalidateQueries()
		expect(fn).toHaveBeenCalledTimes(1)
	})
})

describe("in a real component", () => {
	it("renders through templates and follows a signal-based key", async () => {
		const client = newClient()
		class Item {
			id = signal(1)
			item = injectQuery(() => ({
				queryKey: ["item", this.id()],
				queryFn: () => Promise.resolve(`item-${this.id()}`),
			}))
		}
		// Applying the decorator by hand: Angular's JIT mode needs it, but esbuild (vitest) does not run
		// Angular's decorator transform for us.
		Component({
			standalone: true,
			selector: "app-item",
			template: `<p>{{ item.status() === 'loading' ? 'loading' : item.data() }}</p>`,
		})(Item)

		TestBed.configureTestingModule({ providers: [provideUnicore(client)] })
		const fixture = TestBed.createComponent(Item)
		const text = () => (fixture.nativeElement as HTMLElement).textContent
		fixture.detectChanges()
		expect(text()).toBe("loading")
		await settle()
		fixture.detectChanges()
		expect(text()).toBe("item-1")
		fixture.componentInstance.id.set(2)
		fixture.detectChanges()
		await settle()
		fixture.detectChanges()
		expect(text()).toBe("item-2")
	})
})

describe("injectStore", () => {
	it("returns a read-only signal of the whole state without a selector", () => {
		const store = createStore({ n: 1 })
		const { result, unmount } = mountInjectable(() => injectStore(store))
		expect(result().n).toBe(1)
		store.setState({ n: 2 })
		expect(result().n).toBe(2)
		expect("set" in result).toBe(false)
		unmount()
	})
})
