# Testing

Nothing in unicore calls `setTimeout` or `Date.now` directly. Time comes from an injectable `Scheduler`, and `@unicore/core/testing` provides `FakeScheduler`, where time moves only when you say so.

```ts
import { QueryClient, QueryObserver } from "@unicore/query"
import { FakeScheduler } from "@unicore/core/testing"

it("goes stale after staleTime and is collected after gcTime", async () => {
	const scheduler = new FakeScheduler()
	const client = new QueryClient({ scheduler })
	const observer = new QueryObserver(client, {
		queryKey: ["k"],
		queryFn: async () => "data",
		staleTime: 1000,
		gcTime: 5000,
	})

	const off = observer.subscribe(() => {})   // starts the fetch
	await observer.refetch()                   // joins it, so the data has arrived
	expect(observer.getSnapshot().isStale).toBe(false)

	scheduler.advance(1000)  // runs due timers in order
	expect(observer.getSnapshot().isStale).toBe(true)

	off()                    // last subscriber leaves: the gc timer starts
	scheduler.advance(5000)
	expect(client.getQueryState(["k"])).toBeUndefined()
})
```

`scheduler.advance(ms)` runs every timer that becomes due, including ones scheduled by other timers, in order. `scheduler.pendingTimers` tells you how many are waiting.

## Testing against a real framework

The `@unicore/conformance` package in the repository (private, not published) contains the behaviour suite that every adapter must pass: loading and data, deduplication, key changes, `enabled`, staleness, invalidation, retries, unmount and gc, mutations, and stores. To test an adapter, implement its small `Harness`; see `packages/react/test/react.conformance.test.tsx`.

## Type tests

The repository checks inference with `expectTypeOf` and `// @ts-expect-error` in `types.test.ts` files; `pnpm typecheck` fails if inference regresses.
