# Show HN draft

**Title:** Show HN: omnifront, one data layer (queries, store, HTTP) for React, Vue and Angular

**URL:** <repo URL> (or <docs URL>)

**First comment (post it right after submitting):**

Hi HN. I built omnifront because the teams I know rarely have one framework: a React app next to an Angular one, a Next.js site and a Vue admin, or a migration that takes two years. The data layer (cache, dedupe, retries, invalidation, optimistic updates, SSR) ends up written two or three times.

The design is a framework-free core where everything the UI listens to implements three functions (`subscribe`, `getSnapshot`, `getServerSnapshot`), and thin adapters that bind that to `useSyncExternalStore`, Vue refs and Angular signals. The core is 3.15 KB gzip; the React hooks on top bring it to 3.78 KB (TanStack Query is 9.31 and 10.27 for the same slice, with esbuild; method and caveats are in the docs).

The honest trade-off: it is small because it does less. No `fetchStatus` flags, no `mutationKey`, the API can still change, and it has no production mileage. If you need the full feature set today, use TanStack Query; there is a migration guide listing what lines up.

I would like to hear from people who run more than one framework: what would you need before trusting something like this?

---

Notes for the day: be online for the first 2-3 hours, answer every comment factually, link the benchmarks method when size comes up, and do not argue about TanStack Query: agree where it is better.
