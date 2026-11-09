# Benchmarks

Measured 2026-11-09 on an Apple-silicon Mac, Node 24.15, against `@tanstack/query-core` / `@tanstack/react-query` 5.107.1, `swr` 2.5.1, `axios` 1.21.0 and `ky` 2.2.0.

```bash
pnpm build
pnpm --filter @omnifront/benchmarks size    # bundle sizes (deterministic)
pnpm --filter @omnifront/benchmarks bench   # speed (varies by machine; compare ratios, not absolutes)
```

## Read this first

omnifront is **much smaller and does much less**. These numbers are not "omnifront beats TanStack Query"; they are "what you give up and gain by choosing a small core".

Things TanStack Query has that omnifront does **not** (yet): `fetchStatus` flags, a `mutationKey` filter for `useIsMutating`, and the `select` option (use `derive`/`useStore` instead). Structural sharing exists but is opt-in, and the benchmarks run without it; `useIsFetching`, `useIsMutating` and `combine` exist. Part of the size and speed difference is simply that work not being done. Several of those are on the roadmap and will cost bytes.

## Bundle size (minified + gzip, React excluded)

Each entry imports the features shown, bundled with esbuild (tree-shaking on). `@omnifront/*` rows include `@omnifront/core`.

| Scope | Library | min | min+gzip |
|---|---|---:|---:|
| Framework-agnostic core (client + observer + mutation) | `@omnifront/query` | 9.68 KB | **3.15 KB** |
| | `@tanstack/query-core` | 32.11 KB | 9.31 KB |
| React (provider + `useQuery` + `useMutation` + client) | `@omnifront/react` | 11.32 KB | **3.78 KB** |
| | `@tanstack/react-query` | 34.63 KB | 10.27 KB |
| | `swr` (`useSWR` + `useSWRMutation`) | 13.12 KB | 6.02 KB |
| State store (reference) | `@omnifront/store` | 1.15 KB | 0.54 KB |
| HTTP client (instance + get + post) | `@omnifront/api` | 5.79 KB | **2.58 KB** |
| | `@omnifront/api` + `/xhr` adapter | 6.82 KB | 2.92 KB |
| | `axios` | 57.18 KB | 21.73 KB |
| | `ky` | 30.37 KB | 10.71 KB |

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

## HTTP client speed (no network)

`vitest bench`, 1,000 requests per iteration. Every client gets the same fake `fetch` that answers with a small JSON body, so this measures each client's **own overhead** (building the URL, merging config, running interceptors, parsing the body), not the network. axios runs with its `fetch` adapter. Higher is better.

| Scenario | `@omnifront/api` | `axios` | `ky` |
|---|---:|---:|---:|
| 1,000 sequential GETs with query params | 337 ops/s | 44 ops/s (7.7x slower) | 82 ops/s (4.1x slower) |
| 1,000 concurrent GETs | 322 ops/s | 49 ops/s (6.5x slower) | 89 ops/s (3.6x slower) |
| 1,000 POSTs with a JSON body and 3 + 3 interceptors | 295 ops/s | 39 ops/s (7.5x slower) | not measured |

Caveats, in the same spirit as above:

- These ratios are large because the other two clients do much more per request: axios builds a config object per call, a `Headers` class, transform pipelines, cancel-token compatibility and a promise chain; ky builds a `Request`, hooks and retry machinery. `@omnifront/api` leaves most of that out on purpose (no cookie jar or proxy support, no `CancelToken`, retry off by default). Read it as "the cost of the features you do not use", not as a verdict on axios or ky.
- Real requests spend milliseconds on the network. A difference of a few microseconds per request disappears there; this matters for hot paths such as server rendering many requests, not for a typical page.
- ky is a `fetch` wrapper with a different API (`.json()`, hooks); the scenarios use its closest equivalents.
- Fake `fetch` means no streaming, no real header sizes and no connection effects.
