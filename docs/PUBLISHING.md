# Publishing: reserving names on npm

**Status: we do not publish yet.** This file records what to do before the first publish, and what we found when we checked the working name on 2026-11-09.

## Finding: `@unicore` is not available

| Check | Result |
|---|---|
| Unscoped package `unicore` | **Taken** (Ackee's "API Core", maintainer `ackeecz`, last published 2023) |
| Scope `@unicore` | **Taken**: `@unicore/http-request` exists, published by maintainer `siberiacomponents` (an org/user named `unicore` owns the scope) |
| GitHub user/org `unicore` | Taken (we use `AMHB-DEV/unicore`, which is fine for a repo, but not as an org name) |

So `@unicore/core`, `@unicore/react`, ... cannot be published by us. **Decide the final name before the first publish**, because the package names appear in every import, doc page, example and CI script (a rename is mechanical but touches the whole repo: search for `@unicore/` and `unicore`).

## How a name is reserved on npm

A scoped name (`@acme/core`) is owned by whoever owns the scope `acme`. A scope is the name of an npm **user** or **organization**; you own all package names under it. So you reserve *scopes*, not packages:

1. **npm account**: create one at <https://www.npmjs.com/signup>. Verify the email.
2. **Two-factor authentication**: Account settings -> Two-Factor Authentication -> "Authorization and writes" (required to publish; also protects you from takeover).
3. **Create an organization per candidate name**: <https://www.npmjs.com/org/create> -> type the name. The page tells you immediately if it is taken. **Free plan**: unlimited *public* packages. Creating the org is what reserves the scope; you do not need to publish anything.
4. Keep the orgs you create for names you may not use. npm may reclaim a name only in cases of abuse or a dispute; an empty org you created in good faith is yours. Do not create dozens of orgs you will never use: it is against the spirit of the rules and can be reclaimed on a dispute.
5. **Unscoped names** (for example a single package `acme-query`) are reserved only by publishing a version. Prefer scopes; they also protect all the packages of the family at once.
6. **GitHub**: create the org/user (or repo) with the same name so the project, npm scope and docs domain match. A domain (`.dev` is common) is separate: check at a registrar.
7. **Trademark search** (USPTO / EUIPO / WIPO Global Brand Database) for the short list before you commit to a name, especially if you plan a paid tier.

## Candidates (checked 2026-11-09, npm registry + GitHub)

"Free" means: no unscoped package, nothing published under that scope, and no GitHub user by that name. It does **not** prove the npm org name is free (an empty org is invisible); step 3 above is the real check.

| Name | Unscoped pkg | `@scope` packages | GitHub user | Note |
|---|---|---|---|---|
| `crossquery` | free | none | free | says "across frameworks"; query-centric (we also have a store) |
| `triquery` | free | none | free | "three frameworks"; we support four, so it may age badly |
| `anyquery` | free | none | free | clear and generic; probably contested as a brand |
| `interquery` | free | none | free | "between frameworks" |
| `cofetch` | free | none | free | short; hints at fetching only |
| `polyquery` | free | **1 package** under `@polyquery` | free | scope is in use: avoid |
| `uniquery` | free | **6 packages** under `@uniquery` | free | scope is in use: avoid |
| `ubiquery`, `omnicache`, `agnostiq`, `syncore`, `queryflux`, `datafold`, `fluxkit` | free | none | **taken** | npm may be fine, but the GitHub name is not available |
| `unicorekit` | free | none | free | keeps the "unicore" feel; check the org name in step 3 |

Reserving four or five of the "free" rows (as npm orgs) before deciding is reasonable. After you pick one, the rename is: package names and scope in every `package.json`, imports in `packages/*`, `examples/*`, `apps/*`, docs, READMEs and CI scripts; then `pnpm install`, `pnpm build` and the compat scripts.

## Before the first publish

- Pick the final name, reserve the scope, rename the repo.
- Add `publishConfig.access: "public"` (scoped packages are private by default) and re-enable the release workflow trigger.
- Use npm **provenance** (`npm publish --provenance` from GitHub Actions) and a granular automation token with 2FA required.
- Run `scripts/check-packages.sh` and `scripts/consumer-next.sh` on the exact commit you publish.
- `0.x` versions only until you are happy with the API; the packages are pre-release.
