---
title: Benchmarks: add a structural-sharing row for a fairer comparison
labels: help wanted, docs
---

`apps/benchmarks` compares `@omnifront/query` with `@tanstack/query-core` with omnifront's structural sharing **off**, while TanStack always does it. The README says so, but the numbers would be fairer with a second omnifront row that has `structuralSharing: replaceEqualDeep` enabled.

## What to do

- In `apps/benchmarks/speed.bench.ts`, add an "omnifront (structural sharing)" variant of each scenario using `import { replaceEqualDeep } from "@omnifront/query/structural"` and `new QueryClient({ structuralSharing: replaceEqualDeep })`.
- Update the speed table and the caveat in `apps/benchmarks/README.md` with the new rows (note the machine and Node version you ran on; the numbers vary by machine).

## Done when

- `pnpm --filter @omnifront/benchmarks bench` runs and the README table matches what you measured.
