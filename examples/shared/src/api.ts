// A pretend server behind a real @omnifront/api client: in-memory todos, ~600ms latency, and a
// switch to make it fail. Swap `adapter` for nothing (and set baseURL) to talk to a real server.
import { createApi } from "@omnifront/api"
import { createMockAdapter } from "@omnifront/api/testing"

let todos = ["Read the ADRs", "Try omnifront"]
export const server = { failing: false, calls: 0 }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const adapter = createMockAdapter({
	"GET /todos": async (request) => {
		server.calls++
		await sleep(600)
		request.signal.throwIfAborted()
		return server.failing ? { status: 503, data: { message: "server is down" } } : { data: todos }
	},
	"POST /todos": async (request) => {
		await sleep(400)
		if (server.failing) return { status: 503, data: { message: "server is down" } }
		todos = [...todos, String(request.body)] // a string body is sent as is
		return { status: 201, data: {} }
	},
})

/** The one HTTP client of the demos; the query and mutation definitions in `index.ts` are built from it. */
export const api = createApi({ adapter, timeout: 5_000 })
