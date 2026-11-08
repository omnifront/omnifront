// A pretend database, on globalThis so the API routes and the server renderer share it.
const g = globalThis as unknown as { __unicoreNgSsrTodos?: string[] }
g.__unicoreNgSsrTodos ??= ["Read the ADRs", "Render with Angular SSR"]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listTodos(): Promise<string[]> {
	await sleep(250)
	return [...(g.__unicoreNgSsrTodos ?? [])]
}

export async function addTodo(title: string): Promise<void> {
	await sleep(150)
	g.__unicoreNgSsrTodos = [...(g.__unicoreNgSsrTodos ?? []), title]
}
