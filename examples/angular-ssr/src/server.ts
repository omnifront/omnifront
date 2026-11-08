import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from "@angular/ssr/node"
import express from "express"
import { join } from "node:path"
import { addTodo, listTodos } from "./app/db"

const browserDistFolder = join(import.meta.dirname, "../browser")
const app = express()
const angularApp = new AngularNodeAppEngine({ allowedHosts: ["localhost", "127.0.0.1"] }) // Angular rejects unknown Host headers (SSRF protection); list yours in production

// A tiny JSON API (the browser's queryFn calls it; the server reads the database directly).
app.get("/api/todos", async (_req, res) => void res.json(await listTodos()))
app.post("/api/todos", express.json({ type: () => true }), async (req, res) => {
	await addTodo((req.body as { title: string }).title)
	res.json({ ok: true })
})

app.use(express.static(browserDistFolder, { maxAge: "1y", index: false, redirect: false }))
app.use((req, res, next) => {
	angularApp
		.handle(req)
		.then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
		.catch(next)
})

if (isMainModule(import.meta.url)) {
	const port = Number(process.env["PORT"] ?? 4200)
	app.listen(port, () => console.log(`http://localhost:${port}`))
}

export const reqHandler = createNodeRequestHandler(app)
