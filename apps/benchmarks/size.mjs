// Bundle size of comparable entry points, minified + gzipped, with React itself excluded.
// Run after `pnpm build`:  pnpm --filter @omnifront/benchmarks size
import { build } from "esbuild"
import { readFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { join } from "node:path"

const version = (name) => JSON.parse(readFileSync(join(process.cwd(), "node_modules", name, "package.json"), "utf8")).version

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
		["@omnifront/query (incl. core)", `import { QueryClient, QueryObserver, Mutation } from "@omnifront/query"; console.log(QueryClient, QueryObserver, Mutation)`],
		[`@tanstack/query-core ${version("@tanstack/query-core")}`, `import { QueryClient, QueryObserver, MutationObserver } from "@tanstack/query-core"; console.log(QueryClient, QueryObserver, MutationObserver)`],
	],
	"React: provider + useQuery + useMutation (+ the client)": [
		["@omnifront/react (incl. query + core)", `import { QueryProvider, useQuery, useMutation } from "@omnifront/react"; import { QueryClient } from "@omnifront/query"; console.log(QueryProvider, useQuery, useMutation, QueryClient)`],
		[`@tanstack/react-query ${version("@tanstack/react-query")}`, `import { QueryClientProvider, useQuery, useMutation, QueryClient } from "@tanstack/react-query"; console.log(QueryClientProvider, useQuery, useMutation, QueryClient)`],
		[`swr ${version("swr")} (useSWR + useSWRMutation)`, `import useSWR from "swr"; import useSWRMutation from "swr/mutation"; console.log(useSWR, useSWRMutation)`],
	],
	"HTTP client: create an instance, get + post": [
		["@omnifront/api (incl. core)", `import { createApi } from "@omnifront/api"; const a = createApi({ baseURL: "/" }); console.log(a.get, a.post)`],
		["@omnifront/api + /xhr adapter (upload progress)", `import { createApi } from "@omnifront/api"; import { xhrAdapter } from "@omnifront/api/xhr"; console.log(createApi({ adapter: xhrAdapter }).post)`],
		[`axios ${version("axios")}`, `import axios from "axios"; const a = axios.create({ baseURL: "/" }); console.log(a.get, a.post)`],
		[`ky ${version("ky")}`, `import ky from "ky"; const a = ky.create({ prefix: "/" }); console.log(a.get, a.post)`],
	],
	"Store (omnifront only, for reference)": [
		["@omnifront/store (incl. core)", `import { createStore } from "@omnifront/store"; console.log(createStore)`],
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
