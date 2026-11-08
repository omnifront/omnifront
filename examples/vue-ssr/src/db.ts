// A pretend database, on globalThis so the API routes and the server renderer share it.
const g = globalThis as unknown as { __omnifrontVueSsrTodos?: string[] }
g.__omnifrontVueSsrTodos ??= ["Read the ADRs", "Render with Vue SSR"]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listTodos(): Promise<string[]> {
	await sleep(250)
	return [...(g.__omnifrontVueSsrTodos ?? [])]
}

export async function addTodo(title: string): Promise<void> {
	await sleep(150)
	g.__omnifrontVueSsrTodos = [...(g.__omnifrontVueSsrTodos ?? []), title]
}
