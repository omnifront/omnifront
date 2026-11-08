// Micro-benchmarks of the framework-agnostic cores. Run:  pnpm --filter @omnifront/benchmarks bench
// Both libraries get an equivalent setup (no gc timers, no retries). Semantics differ: omnifront
// notifies listeners synchronously, TanStack schedules notifications with setTimeout, so every
// scenario waits for one macrotask so both have delivered everything when the timer stops.
import { QueryClient as TanStackClient, QueryObserver as TanStackObserver } from "@tanstack/query-core"
import { QueryClient, QueryObserver } from "@omnifront/query"
import { bench, describe } from "vitest"

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

describe("1,000 concurrent fetches of the same key (deduplication)", () => {
	bench("omnifront", async () => {
		const client = new QueryClient({ gcTime: Infinity })
		await Promise.all(Array.from({ length: 1000 }, () => client.fetchQuery(["k"], async () => 1)))
	})
	bench("@tanstack/query-core", async () => {
		const client = new TanStackClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } })
		await Promise.all(Array.from({ length: 1000 }, () => client.fetchQuery({ queryKey: ["k"], queryFn: async () => 1 })))
	})
})

describe("write 10,000 distinct keys, then read them back", () => {
	const keys = Array.from({ length: 10_000 }, (_, i) => ["item", i] as const)
	bench("omnifront", () => {
		const client = new QueryClient({ gcTime: Infinity })
		for (const key of keys) client.setQueryData(key, key[1])
		for (const key of keys) client.getQueryData(key)
	})
	bench("@tanstack/query-core", () => {
		const client = new TanStackClient({ defaultOptions: { queries: { gcTime: Infinity } } })
		for (const key of keys) client.setQueryData(key, key[1])
		for (const key of keys) client.getQueryData(key)
	})
})

describe("1,000 observers on one query, one update delivered to all", () => {
	bench("omnifront", async () => {
		const client = new QueryClient({ gcTime: Infinity })
		client.setQueryData(["k"], 0)
		const options = { queryKey: ["k"], queryFn: async () => 0, staleTime: Infinity, enabled: false }
		let seen = 0
		const offs = Array.from({ length: 1000 }, () => new QueryObserver(client, options).subscribe(() => seen++))
		client.setQueryData(["k"], 1)
		await tick()
		if (seen !== 1000) throw new Error(`delivered ${seen}`)
		offs.forEach((off) => off())
	})
	bench("@tanstack/query-core", async () => {
		const client = new TanStackClient({ defaultOptions: { queries: { gcTime: Infinity } } })
		client.setQueryData(["k"], 0)
		const options = { queryKey: ["k"], queryFn: async () => 0, staleTime: Infinity, enabled: false }
		let seen = 0
		const offs = Array.from({ length: 1000 }, () => new TanStackObserver(client, options).subscribe(() => seen++))
		client.setQueryData(["k"], 1)
		await tick()
		if (seen !== 1000) throw new Error(`delivered ${seen}`)
		offs.forEach((off) => off())
	})
})
