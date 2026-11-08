// A pretend database, on globalThis so every API route (and the renderer) shares it.
const g = globalThis as unknown as { __omnifrontNuxtTodos?: string[] }
g.__omnifrontNuxtTodos ??= ["Read the ADRs", "Render with Nuxt"]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listTodos(): Promise<string[]> {
	await sleep(250)
	return [...(g.__omnifrontNuxtTodos ?? [])]
}

export async function addTodo(title: string): Promise<void> {
	await sleep(150)
	g.__omnifrontNuxtTodos = [...(g.__omnifrontNuxtTodos ?? []), title]
}
