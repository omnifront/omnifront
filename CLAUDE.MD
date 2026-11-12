# Project Context: `omnifront`

> Drop this file in the repo root as `CLAUDE.md`. It captures every decision made so far during planning. Treat the "Decisions" sections as settled unless the review triggers in them fire. Ask before changing them.

## 1. What we are building

A framework-agnostic front-end toolkit: a core that handles the things most apps need (API/data fetching with caching first, then state management), plus thin adapters so the same logic works in **React, Next.js, Vue, and Angular**. Think "a library for libraries and frameworks".

Goals, in priority order:
1. Technically deep, portfolio-grade open-source project (owner is a React developer learning Vue; Angular is new territory, so explain adapter choices when writing Vue/Angular code).
2. Genuinely useful: teams running more than one framework (or migrating between them) should be able to share data-layer logic.
3. Small, well-tested, well-documented, with real examples.

Differentiation angle (pick this when making product decisions): **multi-framework teams and gradual migration** (for example, moving from Angular to React without rewriting data logic). Secondary angles: small bundle size (core + query is about 5KB gzip, and every extra is an opt-in entry with its own budget) and one unified mental model for query + store.

A second layer sits on top of the data layer: a MUI-style component library (`@omnifront/ui` plus `ui-react`, `ui-vue`, `ui-angular`, ADR-0014) with one theme and one behaviour implementation shared by all frameworks. The small-bundle angle applies to the data layer only.

Non-goals for v1: forms/validation, Svelte/Solid/Qwik adapters, a custom GraphQL client, a full DevTools extension.

## 2. Tech decisions (settled)

- **Monorepo:** pnpm workspaces only. **No Turborepo, no Nx** in v0.x (see review triggers below).
- **Language:** TypeScript, `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` from day one.
- **Build:** `tsup` per package (ESM + CJS + `.d.ts`). Angular package may later need `ng-packagr`; revisit in the Angular phase.
- **Test:** Vitest. Type tests with `expect-type` or `tsd`. Adapter tests use a shared conformance suite (see section 6).
- **Release:** Changesets.
- **Size guard:** `size-limit` in CI. Budgets (gzip): `core` ≤ 1KB, `query` ≤ 4KB (ADR-0013, with a per-feature byte ledger), `api` ≤ 3KB (ADR-0009), each adapter ≤ 1KB (Vue ≤ 1.1KB), plus a budget per opt-in entry (see `.size-limit.json`).
- **Supported targets:** React ≥ 18, Vue ≥ 3.3, Angular ≥ 17, Next ≥ 14 (App Router and Pages Router).
- **Package manager:** pnpm 9. Package scope: `@omnifront/*`.

Review trigger for adding Turborepo: CI exceeds about 5 minutes, docs/examples/Angular builds become painfully slow, or contributor count grows. Migration is easy because Turbo would just call each package's existing scripts.

## 3. Repo structure

```
omnifront/
├─ .changeset/
├─ .github/workflows/
│   ├─ ci.yml                  # lint + typecheck + test + size-limit
│   └─ release.yml             # Changesets publish
├─ docs/adr/
│   ├─ 0000-template.md
│   ├─ 0001-subscribable-contract.md
│   ├─ 0002-monorepo-and-build.md
│   └─ 0003 … 0013               # one per later decision; 0013 = where a feature goes, and parity with TanStack Query / axios
├─ packages/
│   ├─ core/                   # Subscribable, notifyManager, Scheduler, utils
│   ├─ query/                  # QueryClient, Query, QueryObserver, Mutation; opt-in entries /hydration /structural /prefetch /activity /filters /events /options /offline
│   ├─ store/                  # phase 4
│   ├─ api/                    # fetch-based HTTP client (ADR-0009); entries ./xhr ./auth ./testing ./serialize ./progress
│   ├─ query-infinite/ persist/ devtools/   # opt-in extras (ADR-0006, ADR-0007)
│   ├─ react/                  # hooks
│   ├─ vue/                    # composables
│   ├─ angular/                # inject* / provide*
│   ├─ next/                   # SSR helpers, built on react
│   ├─ ui/                     # ADR-0014: createTheme, behaviour machines (Subscribable), a11y utils, static CSS. No framework
│   ├─ ui-react/ ui-vue/ ui-angular/   # ADR-0014: components, rendering only
│   └─ conformance/            # shared adapter test suite (private)
├─ apps/docs/                  # VitePress or Starlight
├─ examples/{react,vue,angular,next}/
├─ tooling/
│   ├─ tsconfig/base.json
│   └─ vitest/shared.config.ts
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.json
└─ .size-limit.json
```

### Dependency rules (enforce in CI with `dependency-cruiser` or `eslint-plugin-boundaries`)

```
core  → (nothing)
query → core
store → core
api   → core   (never query or store: integration is structural, ADR-0009)
query-infinite / persist / devtools → query, core
react / vue / angular → query, store, core   (+ peerDependency on the framework)
next  → react
ui    → core, store   (never query or api; ADR-0014)
ui-react → ui, react    ui-vue → ui, vue    ui-angular → ui, angular
```

**Hard rule:** no package except the adapters and the `ui-*` packages (each only its own framework) may import from `react`, `vue`, or `@angular/*`. This is the most important invariant in the project.

### Root files

`pnpm-workspace.yaml`
```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "examples/*"
  - "tooling/*"
```

Root `package.json` scripts
```json
{
  "name": "omnifront-monorepo",
  "private": true,
  "packageManager": "pnpm@9",
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "typecheck": "pnpm -r run typecheck",
    "lint": "eslint .",
    "dev": "pnpm -r --parallel run dev",
    "size": "size-limit",
    "changeset": "changeset",
    "release": "pnpm build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2",
    "eslint": "^9",
    "size-limit": "^11",
    "@size-limit/preset-small-lib": "^11",
    "typescript": "^5.5",
    "vitest": "^2"
  }
}
```
(Pin to the latest stable versions at install time.)

Useful commands
```bash
pnpm --filter @omnifront/query... build        # package + its dependencies
pnpm --filter "...[origin/main]" test        # only changed packages
```

`tooling/tsconfig/base.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true,
    "declaration": true,
    "skipLibCheck": true
  }
}
```

Per-package `package.json` template (example: `@omnifront/query`)
```json
{
  "name": "@omnifront/query",
  "version": "0.0.0",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "@omnifront/core": "workspace:*" }
}
```
`sideEffects: false` is required for tree-shaking. Adapters add `peerDependencies` (for example `"react": ">=18"`).

## 4. ADR-0001: Subscribable contract (Proposed)

**Context.** Core must hold state and query results with zero framework dependency and notify the UI of changes. Each framework has its own reactivity model (React: `useSyncExternalStore`; Vue: `ref` plus effect scopes; Angular: Signals and RxJS). We need one tiny, stable connection point that keeps adapters trivial.

**Decision.** Everything the UI listens to (`QueryObserver`, `Store`, ...) implements:

```ts
export interface Subscribable<TSnapshot> {
  /** Register a listener; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void
  /** Current state. Must return the SAME reference until something changes. */
  getSnapshot(): TSnapshot
  /** Optional: snapshot used during SSR. */
  getServerSnapshot?(): TSnapshot
}
```

Mandatory rules:
1. Snapshots are immutable. A change produces a new object; no change returns the same reference (React requires this).
2. Listeners take no arguments. Consumers read via `getSnapshot()`, not from event payloads.
3. Notification is synchronous, but core batches consecutive notifications internally (`notifyManager`) so adapters need not worry about redundant renders.
4. First subscribe starts work (for example the fetch). Last unsubscribe starts the GC timer. Lifecycle is driven by subscriber count, never by the framework.
5. No direct `setTimeout` in logic code; use an injectable `Scheduler` (testability).

Adapter shapes (intent, not final code):
```ts
// react
useSyncExternalStore(o.subscribe, o.getSnapshot, o.getServerSnapshot ?? o.getSnapshot)

// vue
const state = shallowRef(o.getSnapshot())
const off = o.subscribe(() => { state.value = o.getSnapshot() })
onScopeDispose(off)

// angular
const state = signal(o.getSnapshot())
const off = o.subscribe(() => state.set(o.getSnapshot()))
inject(DestroyRef).onDestroy(off)
```

**Rejected.** Custom signals inside core (too big, competes with frameworks' own reactivity; may return later). RxJS Observable as the contract (heavy, unwanted for React/Vue users). EventEmitter with payloads (loses snapshots, makes SSR/hydration hard).

**Consequences.** Adapters are about 20 to 50 lines each; a shared conformance suite is possible; SSR works naturally via `getServerSnapshot`. Downsides: framework-specific features (React Suspense, Angular `resource()`) need an extra layer in the adapter; no fine-grained field-level reactivity, so a `select` option is likely needed.

**Review trigger.** If writing the Vue or Angular adapter forces a change to this contract, reopen this ADR. Open questions to examine early: rule 3 (batching semantics) and the `select` API.

## 5. ADR-0002: Monorepo and build (Proposed)

Covered by section 2. Chosen: pnpm workspaces, tsup, Vitest, Changesets, size-limit. Rejected: Turborepo and Nx (not worth it at this size; add Turbo later per the trigger), Rollup/Vite library mode (tsup is simpler), Jest (slower, ESM config pain). Consequence: no build/test caching, so CI slows as the project grows; Angular may need a separate build pipeline.

ADR template (`docs/adr/0000-template.md`):
```md
# ADR-XXXX: Title
**Status:** Proposed | Accepted | Superseded by ADR-YYYY
**Date:**

## Context
## Decision
## Rejected options
## Consequences (positive and negative)
## Review trigger
```

## 6. Roadmap and scope per phase

Rule: do not start a phase until the previous one meets its exit criteria.

**Status (2026-11-11):** Phases 0 to 6 are done (core, query, store, api, query-infinite, persist, devtools, React/Vue/Angular/Next adapters with SSR, conformance suite, docs, benchmarks, examples). Nothing has been published to npm. **Phase 7 (launch) is on hold: do not publish to npm, make the repo public or post anything until the owner says so.**

Current work, on branch `feat/parity-phases-1-2` (not pushed): closing the gap to TanStack Query and axios, following ADR-0013 and `docs/parity-plan.md`. Plan phases 0 to 4 are done: typed errors (`TError` is the second type argument), result flags, `select`, `defaultOptions`, `refetchOnMount`, network modes and paused fetches, mutation options, scopes and persisted waiting mutations (`@omnifront/query/offline`), the axios options in `api`, and the opt-in entries `/filters`, `/events`, `/options`, `/serialize`, `/progress`. Next is plan phase 5 (adapter-only items such as `throwOnError`, `useSuspenseQueries`, streamed pending queries); the leftovers and what was dropped are listed in the plan and in ADR-0013 section 9. The Devtools UI (ADR-0012) is separate work in progress.

**UI library (ADR-0014, Accepted 2026-11-12; wave 0 is built and verified (conformance, axe, pixel comparison across frameworks, hydration; branch `feat/ui-wave-0`, not pushed); the ADR's "wave 0 outcome" lists what remains):** starts before phase 7. Settled: headless machines + static CSS with CSS variables in `@omnifront/ui`, thin `ui-react` / `ui-vue` / `ui-angular`; Material Design 2 as the default look; no `styled()` and no full `sx` (system props on layout components only); Vue as SFCs built with Vite, Angular with `ng-packagr`; no hard size cap for `ui*` (sizes are recorded). Work goes in waves; wave 0 is the foundation plus Button, TextField, Dialog, Menu and Tabs in all three frameworks, and a wave is done only when all three frameworks, the conformance tests and the docs are done. Real-browser checks live in `tooling/e2e-ui` (`pnpm --filter @omnifront/e2e-ui build:examples` then `e2e`).

**Size budgets are nearly spent:** the main entry of `@omnifront/query` is at 3.975 KB of 4 KB (and `api` at 2.83 of 3 KB). The cap does not go up without an ADR; a new feature goes to an opt-in entry, an adapter or its own package (ADR-0013 section 1), or is paid for by removing something. `Mutation`'s `wrap` option is the extension point for behaviour that needs to sit around sending.

**Phase 0: Prerequisites (weeks 1 to 2).** Study `query-core` in TanStack Query, plus Zustand/Nanostores (simple external stores), Pinia and NgRx SignalStore (what Vue/Angular users expect). Needed knowledge: advanced TypeScript (generics, conditional types, `infer`), reactivity patterns (pub-sub, signals, proxy), caching concepts (stale-while-revalidate, cache keys, GC), each framework's external-store sync mechanism.

**Phase 1: Scaffold and ADRs (weeks 2 to 3).** Create the repo per section 3, CI, lint, size-limit, dependency-boundary check. Commit ADR-0001 and ADR-0002.

**Phase 2: `core` and `query` plus React adapter (months 1 to 2).**
- `core`: `Subscribable`, `notifyManager`, `Scheduler`, small utilities.
- `query` MVP: cache key based queries, in-flight request deduplication, states (`idle/loading/success/error`, `isFetching`, `isStale`), `staleTime`/`gcTime`, retry with exponential backoff, invalidation and manual refetch, mutations with `onSuccess/onError`, cancellation via `AbortController`.
- After MVP: optimistic updates with rollback, pagination and infinite queries, refetch on focus/reconnect, prefetch, cache persistence (localStorage/IndexedDB), plugin/middleware (auth, logging).
- React adapter: `useQuery`, `useMutation`, `QueryProvider`; Suspense/concurrent safe via `useSyncExternalStore`; React Testing Library tests.
- Exit criteria: core test coverage above 90%, zero imports of `react` inside `query`, working demo.

**Phase 3: Vue adapter (month 3).** `useQuery` with `ref`/`computed` and reactive inputs (a `ref` key works), auto cleanup with `onScopeDispose`, plugin via `app.use()`, Nuxt SSR hydration support. This phase is the real test of the core design: anything leaking React assumptions must be fixed in core.

**Phase 4: Angular adapter and `store` (month 4).** `injectQuery()`/`injectMutation()` returning Signals (and Observables where useful), lifecycle via `DestroyRef`, `provideOmnifront()` for standalone components. `store` package: state with selectors, derived state, actions, with adapters for all frameworks.

**Phase 5: Next and SSR (months 4 to 5).** Prefetch in Server Components plus `dehydrate/hydrate` for Client Components; App Router and Pages Router; a fresh client instance per request to avoid cross-request state sharing; hydration mismatch tests.

**Phase 6: Quality (continuous).**
- Shared **conformance suite** (`packages/conformance`): the same behavioral tests run against every adapter.
- Type tests so inference never regresses.
- Benchmarks vs TanStack Query and SWR (size and speed).
- Docs: Getting Started per framework, API reference, migration guides (from TanStack/Redux), side-by-side code in four frameworks.
- Examples: one real dashboard app per framework sharing the same logic.
- Optional later: DevTools to inspect cache and queries.

**Phase 7: Launch (months 5 to 6).** Strong README (GIF, comparison table, four-framework code), docs site with StackBlitz playground, launch posts (Dev.to, Reddit r/reactjs r/vuejs r/Angular2, Show HN), `CONTRIBUTING.md`, `good first issue` labels, feedback from 5 to 10 real users before v1.0.

## 7. Risks and controls

| Risk | Control |
|---|---|
| Scope creep | A phase must meet exit criteria before the next begins |
| Burnout | Releasable, demo-able increment every 2 weeks |
| Leaky abstraction | Conformance suite on all adapters from the start; dependency-boundary lint |
| No adoption | Clear differentiation angle (multi-framework/migration), real examples |

## 8. First tasks (start here)

1. Scaffold the repo exactly as in section 3 (pnpm workspaces only), with CI, ESLint, Vitest, size-limit, Changesets and the dependency-boundary rule.
2. Write `docs/adr/0000-template.md`, `0001-subscribable-contract.md`, `0002-monorepo-and-build.md` from sections 4 and 5.
3. Implement `packages/core`: `Subscribable` interface, `notifyManager` (batching), `Scheduler` (injectable timers), with unit tests.
4. Implement a minimal `QueryClient` in `packages/query` (fetch + cache + in-flight dedupe) in under about 200 lines, with tests.
5. Then the React adapter (`useQuery`) and a React example.

## 9. Working conventions for Claude Code

- Before writing code that touches an architectural decision, check the ADRs here. If you think a decision is wrong, say so and propose an ADR change instead of silently deviating.
- Keep packages tiny and tree-shakeable; check size-limit after every feature.
- Every new core behavior gets a test in core, and a conformance test if it affects adapters.
- Never import a framework outside its adapter package.
- Prefer small commits, one concern each; add a Changeset for every user-facing change.
- Where a feature goes is decided by ADR-0013 (main entry only if it needs internals and nearly everyone needs it; otherwise an opt-in entry, an adapter or a separate package). Record every byte added to `@omnifront/query`'s main entry in that ADR's ledger.
- A feature that changes an adapter's API is added to all three adapters and to the conformance suite in the same change.
- When writing Vue or Angular adapters, briefly explain the framework-specific lifecycle choices in comments or PR descriptions.