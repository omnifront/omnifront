# Benchmarks

Measured 2026-11-08 (re-measured after refetch-on-focus, polling, `initialData`, `placeholderData` and `onMutate` landed) on an Apple-silicon Mac, Node 24.15, against `@tanstack/query-core` / `@tanstack/react-query` 5.107.1 and `swr` 2.5.1.

```bash
pnpm build
pnpm --filter @omnifront/benchmarks size    # bundle sizes (deterministic)
pnpm --filter @omnifront/benchmarks bench   # speed (varies by machine; compare ratios, not absolutes)
```

## Read this first

omnifront is **much smaller and does much less**. These numbers are not "omnifront beats TanStack Query"; they are "what you give up and gain by choosing a small core".

Things TanStack Query has that omnifront does **not** (yet): structural sharing of results, the `select` option (use `derive`/`useStore` instead), `useIsFetching`. Structural sharing exists but is opt-in, and the benchmarks run without it. Part of the size and speed difference is simply that work not being done. Several of those are on the roadmap and will cost bytes.

## Bundle size (minified + gzip, React excluded)

Each entry imports the features shown, bundled with esbuild (tree-shaking on). `@omnifront/*` rows include `@omnifront/core`.

| Scope | Library | min | min+gzip |
|---|---|---:|---:|
| Framework-agnostic core (client + observer + mutation) | `@omnifront/query` | 9.38 KB | **3.07 KB** |
| | `@tanstack/query-core` | 32.11 KB | 9.31 KB |
| React (provider + `useQuery` + `useMutation` + client) | `@omnifront/react` | 10.52 KB | **3.52 KB** |
| | `@tanstack/react-query` | 34.63 KB | 10.27 KB |
| | `swr` (`useSWR` + `useSWRMutation`) | 13.12 KB | 6.02 KB |
| State store (reference) | `@omnifront/store` | 1.12 KB | 0.52 KB |

The repo's `size-limit` budgets (`pnpm size`) are per package and exclude their `@omnifront/*` dependencies, so they report smaller numbers than the table above.

## Speed (core only, no UI)

`vitest bench`, 1,000 to 10,000 operations per iteration, gc timers and retries disabled in both. Higher is better.

| Scenario | omnifront | `@tanstack/query-core` | ratio |
|---|---:|---:|---:|
| 1,000 concurrent `fetchQuery` of one key (deduplication) | 4,796 ops/s | 3,654 ops/s | 1.31x |
| Write 10,000 distinct keys, then read them back | 144 ops/s | 85 ops/s | 1.69x |
| 1,000 observers on one query, one update delivered to all | 451 ops/s | 302 ops/s | 1.49x |

Caveats:

- Different semantics. omnifront notifies listeners synchronously (batched by `notifyManager`); TanStack schedules notifications with `setTimeout`. The observer scenario waits one macrotask in both so each has delivered everything before the timer stops.
- No structural sharing in omnifront, which TanStack does on every result. That is real work omnifront skips.
- Vitest's `bench` is marked experimental, and these are micro-benchmarks. Treat a 1.3x difference as "similar", not as a selling point.
- UI rendering cost (React/Vue/Angular) is not measured here.
