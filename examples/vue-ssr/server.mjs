// A minimal Vite SSR dev server: renders pages with Vue, serves a tiny JSON API.
import { readFileSync } from "node:fs"
import { createServer } from "node:http"
import { createServer as createVite } from "vite"

const vite = await createVite({ server: { middlewareMode: true }, appType: "custom" })

// Safe to put inside <script>: no "<" can end the tag early.
const embed = (value) => JSON.stringify(value).replace(/</g, "\\u003c")

createServer((req, res) => {
	vite.middlewares(req, res, async () => {
		try {
			if (req.url === "/api/todos") {
				const db = await vite.ssrLoadModule("/src/db.ts")
				if (req.method === "POST") {
					const chunks = []
					for await (const chunk of req) chunks.push(chunk)
					await db.addTodo(JSON.parse(Buffer.concat(chunks).toString()).title)
				}
				res.setHeader("content-type", "application/json")
				return res.end(JSON.stringify(await db.listTodos()))
			}
			const { render } = await vite.ssrLoadModule("/src/entry-server.ts")
			const { html, state } = await render()
			const template = await vite.transformIndexHtml(req.url, readFileSync("index.html", "utf8"))
			res.setHeader("content-type", "text/html")
			res.end(template.replace("<!--app-->", html).replace("<!--state-->", `<script>window.__OMNIFRONT__=${embed(state)}</script>`))
		} catch (error) {
			vite.ssrFixStacktrace(error)
			res.statusCode = 500
			res.end(String(error?.stack ?? error))
		}
	})
}).listen(5190, () => console.log("http://localhost:5190"))
