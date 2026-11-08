#!/usr/bin/env bash
# Run a framework's tests against its OLDEST supported version, in a throwaway copy of the repo.
#   scripts/test-matrix.sh react18 | vue33 | angular17 | angular18
# (Next.js is tested differently: scripts/consumer-next.sh installs the PACKED packages into a fresh app.)
# Uses pnpm overrides, so the committed lockfile and node_modules are never touched.
set -euo pipefail
name="${1:?usage: test-matrix.sh <react18|vue33|angular17|angular18>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)/unicore-matrix-$name"
mkdir -p "$work"
[ -n "${KEEP:-}" ] || trap 'rm -rf "$(dirname "$work")"' EXIT
[ -z "${KEEP:-}" ] || echo "kept: $work"
# A copy of the working tree (uncommitted changes included), without installed or built files.
rsync -a --exclude node_modules --exclude dist --exclude .git --exclude .next --exclude .angular \
  --exclude coverage --exclude .vitepress/cache --exclude .vitepress/dist "$root/" "$work/"
cd "$work"

case "$name" in
  react18)   overrides='react: 18.3.1
  react-dom: 18.3.1
  "@types/react": 18.3.12
  "@types/react-dom": 18.3.1'; filter="@unicore/react @unicore/next" ;;
  vue33)     overrides='vue: 3.3.13'; filter="@unicore/vue" ;;
  angular17) overrides='"@angular/core": 17.3.12
  "@angular/common": 17.3.12
  "@angular/compiler": 17.3.12
  "@angular/platform-browser": 17.3.12
  "@angular/platform-server": 17.3.12
  rxjs: 7.8.1
  zone.js: 0.14.10'; filter="@unicore/angular" ;;
  angular18) overrides='"@angular/core": 18.2.13
  "@angular/common": 18.2.13
  "@angular/compiler": 18.2.13
  "@angular/platform-browser": 18.2.13
  "@angular/platform-server": 18.2.13
  rxjs: 7.8.1
  zone.js: 0.14.10'; filter="@unicore/angular" ;;
  *) echo "unknown matrix entry: $name" >&2; exit 2 ;;
esac

printf 'overrides:\n  %s\n' "$overrides" >> pnpm-workspace.yaml
pnpm install --no-frozen-lockfile --reporter=append-only
case "$name" in
  # Old Angular needs the dynamic platform for JIT in tests, and 17 needs zone.js (no zoneless yet).
  angular17|angular18)
    ng="${name#angular}"; v=$([ "$ng" = 17 ] && echo 17.3.12 || echo 18.2.13)
    pnpm --filter @unicore/angular add -D "@angular/platform-browser-dynamic@$v" zone.js@0.14.10 --reporter=append-only ;;
esac
# Build everything the filtered packages depend on, then test or build them.
for pkg in $filter; do
  pnpm --filter "$pkg..." --workspace-concurrency=1 run build 2>&1 | tail -40
  pnpm --filter "$pkg" run test
done
