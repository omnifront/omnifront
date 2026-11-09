#!/usr/bin/env bash
# Install the PACKED packages (as from npm, not as workspace links) into a fresh Next.js app outside
# the repo, build it, start it and check that the server-rendered HTML has the prefetched data.
#   scripts/consumer-next.sh [next-version] [react-version]      e.g.  16.4.5 19.3.1   or   14.2.35 18.3.1
set -euo pipefail
next="${1:-latest}"; react="${2:-latest}"
root="$(cd "$(dirname "$0")/.." && pwd)"
packs="$(mktemp -d)"; app="$(mktemp -d)/consumer-next"
mkdir -p "$app"
trap 'kill "${server_pid:-0}" 2>/dev/null || true; [ -n "${KEEP:-}" ] || rm -rf "$packs" "$(dirname "$app")"' EXIT

for pkg in core query query-infinite store api react next; do
  pnpm --dir "$root" --filter "@omnifront/$pkg" pack --pack-destination "$packs" >/dev/null
done
cp -R "$root/examples/next/app" "$root/examples/next/pages" "$root/examples/next/components" "$root/examples/next/lib" \
  "$root/examples/next/tsconfig.json" "$root/examples/next/next.config.mjs" "$app/"

cd "$app"
python3 - "$packs" "$next" "$react" <<'PY'
import json, sys, glob
packs, nxt, react = sys.argv[1:4]
tgz = {p.split('omnifront-')[1].rsplit('-0.0.0.tgz', 1)[0]: p for p in glob.glob(f'{packs}/omnifront-*.tgz')}
pkg = {
  "name": "consumer-next", "version": "0.0.0", "private": True,
  "scripts": {"build": "next build", "start": "next start -p 3201"},
  "dependencies": {"next": nxt, "react": react, "react-dom": react, **{f"@omnifront/{k}": f"file:{v}" for k, v in tgz.items() if k in ("next", "api")}},
  "devDependencies": {"typescript": "~5.9.3", "@types/node": "^22", "@types/react": "^19" if not react.startswith("18") else "^18", "@types/react-dom": "^19" if not react.startswith("18") else "^18"},
}
json.dump(pkg, open('package.json', 'w'), indent=2)
overrides = "\n".join(f'  "@omnifront/{k}": "file:{v}"' for k, v in tgz.items())
open('pnpm-workspace.yaml', 'w').write(f"packages: []\noverrides:\n{overrides}\n")
PY
pnpm install --registry=https://registry.npmjs.org/ --reporter=append-only 2>&1 | tail -3
NEXT_TELEMETRY_DISABLED=1 pnpm build 2>&1 | tail -18
NEXT_TELEMETRY_DISABLED=1 pnpm start >/tmp/consumer-next.log 2>&1 &
server_pid=$!
for _ in $(seq 1 30); do curl -s -o /dev/null -m 2 http://localhost:3201/api/todos && break; sleep 1; done
check() { # name, url
  local html; html="$(curl -s "$2")"
  echo "--- $1: $(echo "$html" | python3 -c "import sys,re; h=sys.stdin.read(); print(re.findall(r'<li>(.*?)</li>',h), re.findall(r'status=[^<]*',h)[:1])")"
  echo "$html" | grep -q "Try omnifront with SSR" || { echo "FAIL: $1 did not render the prefetched data"; exit 1; }
}
check "App Router" http://localhost:3201/
check "Pages Router" http://localhost:3201/legacy
