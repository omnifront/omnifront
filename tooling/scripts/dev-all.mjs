#!/usr/bin/env node
// Runs the docs site and every example together, each on a fixed port.
// Usage: pnpm dev:all            (everything)
//        pnpm dev:all react vue  (only these)
//        pnpm dev:all --list
import { spawn } from "node:child_process"

const apps = {
	docs: { filter: "@omnifront/docs", port: 5173, args: (p) => ["--port", p] },
	react: { filter: "@omnifront/example-react", port: 5174, args: (p) => ["--port", p, "--strictPort"] },
	vue: { filter: "@omnifront/example-vue", port: 5175, args: (p) => ["--port", p, "--strictPort"] },
	angular: { filter: "@omnifront/example-angular", port: 5176, args: (p) => ["--port", p] },
	"angular-ssr": { filter: "@omnifront/example-angular-ssr", port: 5177, args: (p) => ["--port", p] },
	next: { filter: "@omnifront/example-next", port: 5178, args: (p) => ["--port", p] },
	nuxt: { filter: "@omnifront/example-nuxt", port: 5179, args: (p) => ["--port", p] },
	// vue-ssr hardcodes 5190 in its server.mjs
	"vue-ssr": { filter: "@omnifront/example-vue-ssr", port: 5190, args: () => [] },
}

const argv = process.argv.slice(2)
if (argv.includes("--list")) {
	for (const [n, a] of Object.entries(apps)) console.log(`${n.padEnd(12)} http://localhost:${a.port}`)
	process.exit(0)
}
const names = argv.length ? argv : Object.keys(apps)
const unknown = names.filter((n) => !apps[n])
if (unknown.length) {
	console.error(`Unknown: ${unknown.join(", ")}. Available: ${Object.keys(apps).join(", ")}`)
	process.exit(1)
}

const colors = [36, 35, 33, 32, 34, 31, 96, 95]
const children = []
names.forEach((name, i) => {
	const a = apps[name]
	const c = colors[i % colors.length]
	const tag = `\x1b[${c}m${name.padEnd(11)}|\x1b[0m `
	const child = spawn("pnpm", ["--filter", a.filter, "run", "dev", ...(a.args(String(a.port)).length ? a.args(String(a.port)) : [])], {
		stdio: ["ignore", "pipe", "pipe"],
		env: { ...process.env, FORCE_COLOR: "1", PORT: String(a.port) },
	})
	for (const s of [child.stdout, child.stderr]) {
		let buf = ""
		s.on("data", (d) => {
			buf += d
			const lines = buf.split("\n")
			buf = lines.pop()
			for (const l of lines) console.log(tag + l)
		})
	}
	child.on("exit", (code) => console.log(`${tag}exited (${code})`))
	children.push(child)
})

console.log("\nStarting:")
for (const n of names) console.log(`  ${n.padEnd(12)} http://localhost:${apps[n].port}`)
console.log()

const stop = () => { for (const c of children) c.kill("SIGTERM"); setTimeout(() => process.exit(0), 500) }
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
