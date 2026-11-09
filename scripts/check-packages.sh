#!/usr/bin/env bash
# What a consumer of the npm tarballs would hit: pack every publishable package, then lint the
# package.json / exports (publint) and check that TypeScript sees correct types for ESM and CJS (attw).
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
packs="$(mktemp -d)"; trap 'rm -rf "$packs"' EXIT
cd "$root"
pnpm build >/dev/null
status=0
for pkg in core query query-infinite store api react vue angular next persist devtools; do
  pnpm --filter "@omnifront/$pkg" pack --pack-destination "$packs" >/dev/null
  tgz="$packs/omnifront-$pkg-0.0.0.tgz"
  echo "== @omnifront/$pkg"
  pnpm --registry=https://registry.npmjs.org/ dlx publint "$tgz" --level warning || status=1
  # @omnifront/next/client is a "use client" CommonJS file on purpose (Next.js 14 cannot read it as ESM);
  # attw cannot see its `0 && (module.exports = ...)` export names although Node can, so skip that rule there.
  ignore=(); [ "$pkg" = next ] && ignore=(--ignore-rules named-exports)
  pnpm --registry=https://registry.npmjs.org/ dlx @arethetypeswrong/cli "$tgz" --profile node16 ${ignore[@]+"${ignore[@]}"} || status=1
done
exit $status
