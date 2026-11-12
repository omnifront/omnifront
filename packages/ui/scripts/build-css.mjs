// Builds dist/*.css: tokens.css (the default theme as CSS variables, from createTheme), one file per
// component, and styles.css = baseline + tokens + every component. Needs `tsup` to have run first.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const { createTheme, themeToCss } = await import(pathToFileURL(join(root, "dist/index.js")).href)

const out = join(root, "dist")
mkdirSync(out, { recursive: true })
// The default tokens sit in their own layer, declared first, so a user's unlayered CSS and any
// ThemeProvider output always win over them.
const tokens = `@layer omnifront-tokens {\n${themeToCss(createTheme())}\n}\n`
writeFileSync(join(out, "tokens.css"), tokens)

const dir = join(root, "src/styles")
const files = readdirSync(dir).filter((f) => f.endsWith(".css")).sort()
const parts = []
for (const f of files) {
	const css = readFileSync(join(dir, f), "utf8")
	writeFileSync(join(out, f), css)
	parts.push(css)
}
writeFileSync(join(out, "styles.css"), `@layer omnifront-tokens, omnifront;\n${tokens}${parts.join("\n")}`)
console.log(`css: tokens.css, ${files.join(", ")}, styles.css`)
