// A pretend database, kept on globalThis so route handlers and Server Components (which Next may
// bundle separately in dev) see the same data.
const g = globalThis as unknown as { __omnifrontTodos?: string[] }
g.__omnifrontTodos ??= ["Read the ADRs", "Try omnifront with SSR"]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listTodos(): Promise<string[]> {
	await sleep(300)
	return [...(g.__omnifrontTodos ?? [])]
}

export async function addTodo(title: string): Promise<void> {
	await sleep(200)
	g.__omnifrontTodos = [...(g.__omnifrontTodos ?? []), title]
}
