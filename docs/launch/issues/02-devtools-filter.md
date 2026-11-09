---
title: Devtools panel: filter queries by key text
labels: good first issue, enhancement
---

`mountDevtools(client)` (`packages/devtools/src/panel.ts`) lists every cache entry. With dozens of queries it is hard to find one.

## What to do

Add a small text input at the top of the panel that filters the list to entries whose serialized key contains the typed text (case-insensitive). The model (`DevtoolsModel` in `packages/devtools/src/index.ts`) is headless and should stay unchanged; filtering belongs in the panel.

## Done when

- Typing in the input hides non-matching entries and clearing it shows all again; the filter survives the panel's periodic refresh.
- A test in `packages/devtools/test` covers it (the panel already has tests to copy from).
- `pnpm size` still passes: the panel entry has a 2.5 KB budget, so keep the addition tiny.

## Pointers

- See `CONTRIBUTING.md` for the checks to run before opening a PR.
