## What and why

<!-- What changes, and what problem it solves. Link the issue or ADR if there is one. -->

## How I checked it

<!-- Tick what you ran. If you could not run something, say so here. -->

- [ ] `pnpm lint` `pnpm typecheck` `pnpm test`
- [ ] `pnpm deps:check` `pnpm size`
- [ ] Tested in a real app / example (which?)
- [ ] Compat scripts (`scripts/test-matrix.sh`, `scripts/consumer-next.sh`) if I touched adapters or packaging

## Checklist

- [ ] Tests added or updated (a conformance case if an adapter can observe it)
- [ ] Docs updated (guides and API page; `pnpm --filter @unicore/docs build` passes)
- [ ] Changeset added (`pnpm changeset`) for user-facing changes
- [ ] No size budget exceeded; an ADR if the design or a budget changed

## Notes for the reviewer

<!-- Anything surprising: trade-offs, things deliberately left out, follow-ups. -->
