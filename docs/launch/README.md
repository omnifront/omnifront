# Launch kit

Drafts for when omnifront goes public. Nothing here is published or posted; `<...>` placeholders must be filled first. The project is pre-release and the repository is private, so do not post anything before the checklist below is done.

## Pre-flight checklist

1. **Publish 0.1.0** to npm (see `docs/PUBLISHING.md`: `publishConfig`, provenance from GitHub Actions, a granular token with 2FA, `scripts/check-packages.sh` and `scripts/consumer-next.sh` on the exact commit).
2. **Make the repository public** and re-read the README as a stranger: it still says "Pre-release and private".
3. **Repository settings:** description, topics (`react`, `vue`, `angular`, `nextjs`, `data-fetching`, `cache`, `state-management`, `typescript`), homepage, enable Discussions, upload `docs/brand/omnifront-social.png` as the social preview.
4. **Docs site:** deploy `apps/docs` (see `apps/docs/deploy`), build it with `DOCS_BASE` and `DOCS_URL` set so link previews get an `og:image`.
5. **Playground:** a StackBlitz project per framework that installs the *published* packages (the `examples/*` use `workspace:*`, which cannot resolve there).
6. **Good first issues:** create the drafts in `issues/` (script below) so newcomers have something to pick up.
7. **Pull the numbers again:** `pnpm size` and `pnpm --filter @omnifront/benchmarks size`; every size quoted in the posts must match the README and benchmarks.

## Order and timing

1. A Dev.to article ([`devto.md`](devto.md)) on a Tuesday to Thursday, morning US Eastern.
2. The same day or next: Show HN ([`show-hn.md`](show-hn.md)); be present for the first hours.
3. Reddit ([`reddit.md`](reddit.md)): one subreddit at a time, days apart, each with its own text and its own rules check.
4. Collect feedback from 5 to 10 people who run more than one framework before calling it 1.0 (CLAUDE.md phase 7).

## Creating the issue drafts

Each file in `issues/` has a `title:` and `labels:` line in its front matter. After the repository is ready:

```bash
for f in docs/launch/issues/*.md; do
  title=$(sed -n 's/^title: //p' "$f" | head -1)
  labels=$(sed -n 's/^labels: //p' "$f" | head -1)
  body=$(awk '/^---$/{n++; next} n>=2' "$f")
  gh issue create --title "$title" --label "$labels" --body "$body"
done
```

