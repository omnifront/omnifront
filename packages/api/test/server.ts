import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"

export interface Seen {
	method: string
	url: string
	headers: IncomingMessage["headers"]
	body: string
}

export interface TestServer {
	url: string
	seen: Seen[]
	close(): Promise<void>
}

/** A real HTTP server on a random port; `handler` decides each reply. */
export async function startServer(
	handler: (req: Seen, res: ServerResponse) => void,
): Promise<TestServer> {
	const seen: Seen[] = []
	const server: Server = createServer((req, res) => {
		const chunks: Buffer[] = []
		req.on("data", (c: Buffer) => chunks.push(c))
		req.on("end", () => {
			const entry: Seen = {
				method: req.method ?? "",
				url: req.url ?? "",
				headers: req.headers,
				body: Buffer.concat(chunks).toString("utf8"),
			}
			seen.push(entry)
			handler(entry, res)
		})
	})
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
	const { port } = server.address() as AddressInfo
	return {
		url: `http://127.0.0.1:${port}`,
		seen,
		close: () =>
			new Promise<void>((resolve) => {
				server.closeAllConnections()
				server.close(() => resolve())
			}),
	}
}

export function json(res: ServerResponse, data: unknown, status = 200): void {
	res.writeHead(status, { "content-type": "application/json" })
	res.end(JSON.stringify(data))
}
