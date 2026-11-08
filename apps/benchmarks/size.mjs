// Bundle size of comparable entry points, minified + gzipped, with React itself excluded.
// Run after `pnpm build`:  pnpm --filter @unicore/benchmarks size
import { build } from "esbuild"
import { readFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const version = (name) => JSON.parse(readFileSync(require.resolve(`${name}/package.json`), "utf8")).version

async function measure(name, code) {
	const result = await build({
		stdin: { contents: code, resolveDir: process.cwd(), loader: "js" },
		bundle: true,
		minify: true,
		format: "esm",
		platform: "browser",
		treeShaking: true,
		external: ["react", "react-dom", "react/jsx-runtime", "use-sync-external-store/*"],
		define: { "process.env.NODE_ENV": '"production"' },
		write: false,
	})
	const bytes = result.outputFiles[0].contents
	return { name, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length }
}

const sections = {
	"Framework-agnostic core: client + observer + mutation": [
		["@unicore/query (incl. core)", `import { QueryClient, QueryObserver, Mutation } from "@unicore/query"; console.log(QueryClient, QueryObserver, Mutation)`],
		[`@tanstack/query-core ${version("@tanstack/query-core")}`, `import { QueryClient, QueryObserver, MutationObserver } from "@tanstack/query-core"; console.log(QueryClient, QueryObserver, MutationObserver)`],
	],
	"React: provider + useQuery + useMutation (+ the client)": [
		["@unicore/react (incl. query + core)", `import { QueryProvider, useQuery, useMutation } from "@unicore/react"; import { QueryClient } from "@unicore/query"; console.log(QueryProvider, useQuery, useMutation, QueryClient)`],
		[`@tanstack/react-query ${version("@tanstack/react-query")}`, `import { QueryClientProvider, useQuery, useMutation, QueryClient } from "@tanstack/react-query"; console.log(QueryClientProvider, useQuery, useMutation, QueryClient)`],
		[`swr ${version("swr")} (useSWR + useSWRMutation)`, `import useSWR from "swr"; import useSWRMutation from "swr/mutation"; console.log(useSWR, useSWRMutation)`],
	],
	"Store (unicore only, for reference)": [
		["@unicore/store (incl. core)", `import { createStore } from "@unicore/store"; console.log(createStore)`],
	],
}

const lines = []
for (const [title, entries] of Object.entries(sections)) {
	lines.push(`\n### ${title}\n`, "| Library | min | min+gzip |", "|---|---:|---:|")
	for (const [name, code] of entries) {
		const r = await measure(name, code)
		lines.push(`| ${r.name} | ${(r.raw / 1024).toFixed(2)} KB | ${(r.gzip / 1024).toFixed(2)} KB |`)
	}
}
console.log(lines.join("\n"))
