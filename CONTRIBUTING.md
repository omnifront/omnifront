# Contributing to unicore

Thanks for helping. This file is the short version of how the project works; the reasoning behind the big decisions is in [`docs/adr`](docs/adr).

## Setup

Requires Node >= 24 and pnpm >= 12.

```bash
git clone https://github.com/AMHB-DEV/unicore.git && cd unicore
pnpm install
pnpm build          # packages, examples and docs (packages first, in dependency order)
pnpm test
```

If your pnpm is configured with a mirror that lacks some packages, add `--registry=https://registry.npmjs.org/` to installs.

## Layout and the one hard rule

| Where | What |
|---|---|
| `packages/core` | `Subscribable`, `notifyManager`, `Scheduler`, `derive`, `combine` |
| `packages/query`, `store`, `query-infinite`, `persist`, `devtools` | framework-free logic |
| `packages/react`, `vue`, `angular`, `next` | adapters |
| `packages/conformance` | the behaviour suite every adapter must pass (private) |
| `apps/docs`, `apps/benchmarks` | documentation site, benchmarks |
| `examples/*` | runnable apps; also our integration tests |

**Only adapters may import `react`, `vue`, `@angular/*` or `next`.** `pnpm deps:check` enforces it (rules in `.dependency-cruiser.cjs`). If you think a rule is wrong, say so in an issue: we change the rule through an ADR, not by working around it.

## Checks (CI runs all of them)

```bash
pnpm lint
pnpm typecheck      # also runs the type-level tests (expectTypeOf / @ts-expect-error)
pnpm test           # unit tests, the shared conformance suite, hydration tests (coverage thresholds apply)
pnpm deps:check     # package boundaries
pnpm size           # gzip size budgets per package (query <= 3 KB, core <= 1 KB, adapters <= 1 KB)
```

Slower compatibility checks (also run in CI on a schedule):

```bash
scripts/test-matrix.sh react18      # oldest supported versions: react18 | vue33 | angular17 | angular18
scripts/check-packages.sh           # pack every package, then publint + arethetypeswrong
scripts/consumer-next.sh 14.2.35 18.3.1   # packed packages installed into a fresh Next.js app
```

## Rules of thumb

- **Tests come with the change.** New core/query behaviour gets a unit test. If an adapter could observe it, it also gets a case in `packages/conformance`, which runs on React, Vue and Angular. Type behaviour goes in a `types.test.ts`.
- **Size is a feature.** Check `pnpm size` after every feature. If a budget is tight, the answer is usually an opt-in subpath entry or a separate package, not a bigger budget. Changing a budget needs an ADR.
- **No `setTimeout` / `Date.now` in logic.** Use the injected `Scheduler` so tests can use `FakeScheduler`.
- **Snapshots are immutable and stable.** `getSnapshot()` returns the same reference until something changes; adapters rely on it.
- **Docs stay true.** The API reference is checked against the built packages (`pnpm --filter @unicore/docs build`). Code in the guides should be code you ran.
- **Architecture changes get an ADR.** Copy `docs/adr/0000-template.md`, number it, and open the PR with it.

## Pull requests

1. Branch from `main`, keep one concern per PR and small commits.
2. Add a changeset for any user-facing change: `pnpm changeset`.
3. Fill in the PR template. Say what you ran; if you could not run something, say that instead of leaving it out.
4. CI must be green. A maintainer reviews; expect questions about tests and bundle size.

## Good first issues

Look for the `good first issue` label. Documentation fixes, extra conformance cases and examples for other frameworks are always welcome.

## Security

Please do not open a public issue for a vulnerability. Use GitHub's "Report a vulnerability" (private security advisory) on the repository's Security tab.
