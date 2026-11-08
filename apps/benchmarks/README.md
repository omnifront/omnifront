# Benchmarks

Measured 2026-11-08 on an Apple-silicon Mac, Node 24.15, against `@tanstack/query-core` / `@tanstack/react-query` 5.107.1 and `swr` 2.5.1.

```bash
pnpm build
pnpm --filter @unicore/benchmarks size    # bundle sizes (deterministic)
pnpm --filter @unicore/benchmarks bench   # speed (varies by machine; compare ratios, not absolutes)
```

## Read this first

unicore is **much smaller and does much less**. These numbers are not "unicore beats TanStack Query"; they are "what you give up and gain by choosing a small core".

Things TanStack Query has that unicore does **not** (yet): structural sharing of results, refetch on window focus / reconnect, infinite and paginated queries, optimistic-update helpers, persistence, devtools, `placeholderData`/`initialData`, `select`, parallel/dependent query helpers, a Suspense integration, streaming SSR. Part of the size and speed difference is simply that work not being done. Several of those are on the roadmap and will cost bytes.

## Bundle size (minified + gzip, React excluded)

Each entry imports the features shown, bundled with esbuild (tree-shaking on). `@unicore/*` rows include `@unicore/core`.

| Scope | Library | min | min+gzip |
|---|---|---:|---:|
| Framework-agnostic core (client + observer + mutation) | `@unicore/query` | 7.51 KB | **2.48 KB** |
| | `@tanstack/query-core` | 32.11 KB | 9.31 KB |
| React (provider + `useQuery` + `useMutation` + client) | `@unicore/react` | 8.55 KB | **2.88 KB** |
| | `@tanstack/react-query` | 34.63 KB | 10.27 KB |
| | `swr` (`useSWR` + `useSWRMutation`) | 13.12 KB | 6.02 KB |
| State store (reference) | `@unicore/store` | 1.12 KB | 0.52 KB |

The repo's `size-limit` budgets (`pnpm size`) are per package and exclude their `@unicore/*` dependencies, so they report smaller numbers than the table above.

## Speed (core only, no UI)

`vitest bench`, 1,000 to 10,000 operations per iteration, gc timers and retries disabled in both. Higher is better.

| Scenario | unicore | `@tanstack/query-core` | ratio |
|---|---:|---:|---:|
| 1,000 concurrent `fetchQuery` of one key (deduplication) | 4,791 ops/s | 3,676 ops/s | 1.30x |
| Write 10,000 distinct keys, then read them back | 149 ops/s | 83 ops/s | 1.80x |
| 1,000 observers on one query, one update delivered to all | 552 ops/s | 334 ops/s | 1.65x |

Caveats:

- Different semantics. unicore notifies listeners synchronously (batched by `notifyManager`); TanStack schedules notifications with `setTimeout`. The observer scenario waits one macrotask in both so each has delivered everything before the timer stops.
- No structural sharing in unicore, which TanStack does on every result. That is real work unicore skips.
- Vitest's `bench` is marked experimental, and these are micro-benchmarks. Treat a 1.3x difference as "similar", not as a selling point.
- UI rendering cost (React/Vue/Angular) is not measured here.
