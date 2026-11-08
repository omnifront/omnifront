import { addTodo, listTodos } from "../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
	return Response.json(await listTodos())
}

export async function POST(request: Request) {
	const { title } = (await request.json()) as { title: string }
	await addTodo(title)
	return Response.json({ ok: true })
}
