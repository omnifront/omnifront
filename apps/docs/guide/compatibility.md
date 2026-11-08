# Compatibility

What is actually tested, and how. "Oldest" means the earliest version we claim to support, installed on purpose.

| Framework | Oldest tested | Latest tested | Notes |
|---|---|---|---|
| React | 18.3.1 | 19.x | Streaming SSR works on both (`renderToPipeableStream` on 18). `React.cache` does not exist in 18; see [Next.js](/guide/next#things-to-know). |
| Next.js | 14.2.35 | 15 and 16 | App Router and Pages Router, built from the **packed** packages in a fresh app (see below). |
| Vue | 3.3.13 | 3.5.x | Needs `toValue` / `MaybeRefOrGetter` (3.3+). SSR verified with Vite SSR and Nuxt 4. |
| Angular | 17.3 | 22.x | 17 runs with zone.js (no zoneless). Server-side waiting for queries needs 18+; on 17 `provideUnicoreSsr` still transfers the cache but cannot hold the render open. |
| Node | 18 (declared `engines`) | 24 | CI uses 24. |

## How it is checked

- **Oldest versions**: `scripts/test-matrix.sh react18 | vue33 | angular17 | angular18` runs that framework's whole suite (including the shared conformance tests) with the old version forced through pnpm overrides, in a throwaway copy of the repo. CI runs all four, and also on a weekly schedule to catch new releases.
- **Packaging**: `scripts/check-packages.sh` packs every package exactly as npm would and runs `publint` and `arethetypeswrong`. This is what found that the `require` condition of the export maps pointed TypeScript at ESM types (fixed with per-condition `types`).
- **A real consumer**: `scripts/consumer-next.sh <next> <react>` installs the *packed* packages (not workspace links) into a new Next.js app outside the repo, builds it and checks the server-rendered HTML of both routers. This is the only check that can tell how Next's bundler treats the published files. It found that Next 14 cannot read a `"use client"` entry published as ESM, so `@unicore/next/client` ships as CommonJS (Node and newer bundlers read it fine).
- **Real SSR apps**: `examples/vue-ssr`, `examples/nuxt`, `examples/angular-ssr` and `examples/next` are exercised in a browser: the HTML contains the data, there are no hydration warnings and no initial request.

Type declarations are published for both ESM and CommonJS (`.d.ts` / `.d.cts`). The `node10` module resolution mode is not supported (no `typesVersions`); use `node16`, `nodenext` or `bundler`.
