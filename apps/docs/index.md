---
layout: home

hero:
  name: omnifront
  text: One data layer. Every framework.
  tagline: Queries, caching and state that work the same in React, Next.js, Vue and Angular, in about 3 KB.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: API reference
      link: /api/query

features:
  - title: Write the logic once
    details: Query and store logic lives in a framework-free core. React, Vue and Angular get thin adapters (about 1 KB or less each) over the same engine, so teams on more than one framework, or migrating between them, share their data layer.
  - title: Small on purpose
    details: The query core is about 3 KB gzipped (including the shared core), the store about 0.5 KB. That is a deliberate trade against feature count; see the benchmarks for exactly what you give up.
  - title: One mental model
    details: Everything the UI listens to (a query observer, a store, a derived slice) implements the same tiny Subscribable contract, so selectors and tests work the same on all of them.
  - title: An HTTP client that fits
    details: A small fetch-based client with interceptors, typed errors and cancellation. Its query and mutation options plug into every adapter, and its auth helpers read from a store, with no framework code inside.
  - title: SSR that does not mismatch
    details: dehydrate/hydrate, a clock-independent server snapshot and a Next.js package for the App Router and Pages Router. Hydration mismatches are covered by tests.
---

<script setup>
import { withBase } from "vitepress"
</script>

<p style="text-align: center; margin: 2rem 0">
	<img :src="withBase('/flow.svg')" alt="One query update leaves the omnifront core and reaches the React, Next.js, Vue and Angular adapters at the same time." width="720" style="display: block; margin: 0 auto; max-width: 100%; height: auto" />
</p>

::: warning Pre-release
omnifront is not on npm yet and the API can still change. Everything in these docs is exercised by the repository's tests and example apps.
:::
