// A pretend database, on globalThis so every API route (and the renderer) shares it.
const g = globalThis as unknown as { __unicoreNuxtTodos?: string[] }
g.__unicoreNuxtTodos ??= ["Read the ADRs", "Render with Nuxt"]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listTodos(): Promise<string[]> {
	await sleep(250)
	return [...(g.__unicoreNuxtTodos ?? [])]
}

export async function addTodo(title: string): Promise<void> {
	await sleep(150)
	g.__unicoreNuxtTodos = [...(g.__unicoreNuxtTodos ?? []), title]
}
