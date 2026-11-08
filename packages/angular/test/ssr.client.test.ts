import { TransferState, makeStateKey } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { QueryClient } from "@unicore/query"
import type { DehydratedState } from "@unicore/query/hydration"
import { describe, expect, it, vi } from "vitest"
import { injectQuery, provideUnicore } from "../src"
import { provideUnicoreSsr } from "../src/ssr"
import { mountInjectable } from "./mount"

const state: DehydratedState = { queries: [{ queryKey: ["todos"], data: ["from-server"], dataUpdatedAt: Date.now() }] }

describe("Angular browser side of SSR", () => {
	it("loads the transferred cache before components ask, so fresh data is not fetched again", async () => {
		const transfer = new TransferState()
		transfer.set(makeStateKey<DehydratedState>("unicore:query-cache"), state)
		TestBed.configureTestingModule({ providers: [{ provide: TransferState, useValue: transfer }] })

		const client = new QueryClient({ gcTime: Infinity })
		const queryFn = vi.fn(async () => ["refetched"])
		const { result, unmount } = mountInjectable(
			() => injectQuery({ queryKey: ["todos"], queryFn, staleTime: 60_000 }),
			[provideUnicore(client), provideUnicoreSsr()],
		)
		expect(result.data()).toEqual(["from-server"])
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(queryFn).not.toHaveBeenCalled()
		unmount()
	})

	it("does nothing when the server sent no cache (a page without prefetching)", () => {
		TestBed.configureTestingModule({ providers: [{ provide: TransferState, useValue: new TransferState() }] })
		const client = new QueryClient({ gcTime: Infinity })
		const { unmount } = mountInjectable(() => 1, [provideUnicore(client), provideUnicoreSsr()])
		expect(client.getQueries()).toHaveLength(0)
		unmount()
	})
})
