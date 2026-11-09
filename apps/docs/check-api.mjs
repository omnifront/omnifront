// Keeps the API reference honest. For every package:
//   1. each name the built package exports must appear (in backticks) on its API page, and
//   2. each "### `name`" heading on that page must be a real export.
// Run after `pnpm build` (reads the generated .d.ts files). Used by `pnpm --filter @omnifront/docs build`.
import ts from "typescript"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")

// page -> [package, [d.ts entry files relative to packages/<package>/dist]]
const pages = {
	core: ["core", ["index.d.ts", "testing.d.ts"]],
	query: ["query", ["index.d.ts", "hydration.d.ts", "structural.d.ts", "prefetch.d.ts", "activity.d.ts", "filters.d.ts", "events.d.ts", "options.d.ts"]],
	"query-infinite": ["query-infinite", ["index.d.ts"]],
	store: ["store", ["index.d.ts"]],
	api: ["api", ["index.d.ts", "xhr.d.ts", "auth.d.ts", "testing.d.ts"]],
	react: ["react", ["index.d.ts", "infinite.d.ts", "suspense.d.ts", "queries.d.ts", "activity.d.ts"]],
	vue: ["vue", ["index.d.ts", "infinite.d.ts", "queries.d.ts", "activity.d.ts"]],
	angular: ["angular", ["index.d.ts", "infinite.d.ts", "ssr.d.ts", "queries.d.ts", "activity.d.ts"]],
	next: ["next", ["index.d.ts", "client.d.ts"]],
	persist: ["persist", ["index.d.ts", "indexeddb.d.ts"]],
	devtools: ["devtools", ["index.d.ts", "panel.d.ts"]],
}

function exportsOf(file) {
	const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true)
	const names = new Set()
	for (const node of source.statements) {
		if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
			for (const el of node.exportClause.elements) names.add(el.name.text)
		} else if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
			if (ts.isVariableStatement(node)) node.declarationList.declarations.forEach((d) => names.add(d.name.text))
			else if (node.name) names.add(node.name.text)
		}
	}
	names.delete("default")
	return names
}

let problems = 0
for (const [page, [pkg, entries]] of Object.entries(pages)) {
	const text = readFileSync(join(root, "apps/docs/api", `${page}.md`), "utf8")
	const exported = new Set(entries.flatMap((e) => [...exportsOf(join(root, "packages", pkg, "dist", e))]))
	for (const name of exported) {
		if (!text.includes(`\`${name}\``)) {
			console.error(`api/${page}.md: export \`${name}\` is not documented`)
			problems++
		}
	}
	for (const [, name] of text.matchAll(/^### `([A-Za-z0-9_$]+)/gm)) {
		if (!exported.has(name)) {
			console.error(`api/${page}.md: heading \`${name}\` is not exported by @omnifront/${pkg}`)
			problems++
		}
	}
}
if (problems) {
	console.error(`\n${problems} API documentation problem(s).`)
	process.exit(1)
}
console.log("API reference matches the built packages.")
