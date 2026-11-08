// A pretend server: in-memory todos, ~600ms latency, and a switch to make it fail.
let todos = ["Read the ADRs", "Try unicore"]
export const server = { failing: false, calls: 0 }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listTodos(signal: AbortSignal): Promise<string[]> {
	server.calls++
	await sleep(600)
	signal.throwIfAborted()
	if (server.failing) throw new Error("server is down")
	return [...todos]
}

export async function addTodo(title: string): Promise<void> {
	await sleep(400)
	if (server.failing) throw new Error("server is down")
	todos = [...todos, title]
}
