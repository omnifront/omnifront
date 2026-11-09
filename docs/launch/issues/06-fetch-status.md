---
title: fetchStatus flags (fetching / paused / idle) separate from status
labels: help wanted, enhancement, size
---

TanStack Query separates `status` (do we have data?) from `fetchStatus` (is a request running, paused because offline, or idle?). omnifront has `isFetching` only; when the network is offline a query simply fails or waits on retries.

## What to do (design first)

Open the discussion here before coding: is a `"paused"` state worth the bytes? It would build on `onlineManager` (`packages/query/src/environment.ts`) and the retry loop in `packages/query/src/query.ts`. The `@omnifront/query` budget is 3.1 KB and currently at 3063 B, so this probably means an opt-in entry or trading something else away: say which.

## Done when

- There is an agreed design (ADR), a size estimate, and tests including offline/online transitions with `FakeScheduler`.
