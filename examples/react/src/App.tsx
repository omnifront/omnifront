import { useQueryClient, useMutation, useQuery } from "@unicore/react"
import { useState } from "react"
import { addTodo, listTodos, server } from "./api"

export function App() {
	const client = useQueryClient()
	const [title, setTitle] = useState("")
	const [failing, setFailing] = useState(false)

	const todos = useQuery({
		queryKey: ["todos"],
		queryFn: ({ signal }) => listTodos(signal),
		staleTime: 5_000,
		retryDelay: 800,
	})

	const add = useMutation({
		mutationFn: addTodo,
		// Stay "pending" until the list has been refetched.
		onSuccess: () => client.invalidateQueries({ queryKey: ["todos"] }),
	})

	return (
		<main style={{ fontFamily: "system-ui", maxWidth: 480, margin: "2rem auto" }}>
			<h1>unicore + React</h1>

			<p>
				status: <b>{todos.status}</b> · fetching: <b>{String(todos.isFetching)}</b> · stale:{" "}
				<b>{String(todos.isStale)}</b> · failures: <b>{todos.failureCount}</b> · server calls:{" "}
				<b>{server.calls}</b>
			</p>

			{todos.status === "loading" && <p>Loading…</p>}
			{todos.status === "error" && <p style={{ color: "crimson" }}>{String((todos.error as Error).message)}</p>}
			<ul>
				{todos.data?.map((t) => (
					<li key={t}>{t}</li>
				))}
			</ul>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					if (!title) return
					add.mutate(title)
					setTitle("")
				}}
			>
				<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New todo" />{" "}
				<button disabled={add.status === "pending"}>{add.status === "pending" ? "Saving…" : "Add"}</button>
			</form>
			{add.status === "error" && <p style={{ color: "crimson" }}>Could not save: {String((add.error as Error).message)}</p>}

			<p>
				<button onClick={() => void todos.refetch()}>Refetch</button>{" "}
				<label>
					<input
						type="checkbox"
						checked={failing}
						onChange={(e) => {
							server.failing = e.target.checked
							setFailing(e.target.checked)
						}}
					/>{" "}
					simulate server failure
				</label>
			</p>
		</main>
	)
}
