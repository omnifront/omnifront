export default defineEventHandler(async (event) => {
	const { title } = await readBody<{ title: string }>(event)
	await addTodo(title)
	return { ok: true }
})
