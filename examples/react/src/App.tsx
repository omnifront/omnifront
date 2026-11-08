import { addTodoMutation, matchesFilter, server, todoFilter, todosQuery } from "@omnifront/example-shared"
import { useMutation, useQuery, useQueryClient, useStore } from "@omnifront/react"
import { useState } from "react"

const selectFilter = (s: { filter: string }) => s.filter

export function App() {
	const client = useQueryClient()
	const [title, setTitle] = useState("")
	const [failing, setFailing] = useState(false)

	const todos = useQuery(todosQuery)
	const add = useMutation(addTodoMutation(client))
	const filter = useStore(todoFilter, selectFilter)
	const visible = todos.data?.filter((t) => matchesFilter(t, filter))

	return (
		<main style={{ fontFamily: "system-ui", maxWidth: 480, margin: "2rem auto" }}>
			<h1>omnifront + React</h1>

			<p>
				status: <b>{todos.status}</b> · fetching: <b>{String(todos.isFetching)}</b> · stale:{" "}
				<b>{String(todos.isStale)}</b> · failures: <b>{todos.failureCount}</b>
			</p>

			<input value={filter} onChange={(e) => todoFilter.getState().setFilter(e.target.value)} placeholder="Filter" />
			{todos.status === "loading" && <p>Loading…</p>}
			{todos.status === "error" && <p style={{ color: "crimson" }}>{String((todos.error as Error).message)}</p>}
			<ul>
				{visible?.map((t) => (
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
