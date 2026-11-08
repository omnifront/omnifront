#!/usr/bin/env bash
# Run a framework's tests against its OLDEST supported version, in a throwaway copy of the repo.
#   scripts/test-matrix.sh react18 | vue33 | angular17 | angular18 | next14
# Uses pnpm overrides, so the committed lockfile and node_modules are never touched.
set -euo pipefail
name="${1:?usage: test-matrix.sh <react18|vue33|angular17|angular18|next14>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)/unicore-matrix-$name"
git -C "$root" worktree add --detach "$work" HEAD >/dev/null
trap 'git -C "$root" worktree remove --force "$work" >/dev/null 2>&1 || true' EXIT
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
  next14)    overrides='next: 14.2.35
  react: 18.3.1
  react-dom: 18.3.1
  "@types/react": 18.3.12
  "@types/react-dom": 18.3.1'; filter="@unicore/example-next" ;;
  *) echo "unknown matrix entry: $name" >&2; exit 2 ;;
esac

printf 'overrides:\n  %s\n' "$overrides" >> pnpm-workspace.yaml
pnpm install --no-frozen-lockfile --ignore-scripts=false --reporter=append-only
# Build everything the filtered packages depend on, then test or build them.
for pkg in $filter; do
  pnpm --filter "$pkg..." --workspace-concurrency=1 run build 2>&1 | tail -5
  if [ "$pkg" = "@unicore/example-next" ]; then : ; else pnpm --filter "$pkg" run test; fi
done
