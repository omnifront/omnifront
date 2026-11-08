"use client"

import { useMutation, useQuery, useQueryClient } from "@omnifront/next/client"
import { useState } from "react"
import { todosQuery } from "../lib/queries"

export function Todos({ where }: { where: string }) {
	const client = useQueryClient()
	const [title, setTitle] = useState("")
	const todos = useQuery(todosQuery)
	const add = useMutation<void, string>({
		mutationFn: async (title) => {
			await fetch("/api/todos", { method: "POST", body: JSON.stringify({ title }) })
		},
		onSuccess: () => client.invalidateQueries({ queryKey: todosQuery.queryKey }),
	})

	return (
		<section style={{ fontFamily: "system-ui", maxWidth: 480, margin: "2rem auto" }}>
			<h1>omnifront + Next ({where})</h1>
			<p data-testid="flags">
				{`status=${todos.status} stale=${todos.isStale} fetching=${todos.isFetching}`}
			</p>
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
			<p>
				<button onClick={() => void todos.refetch()}>Refetch</button>
			</p>
		</section>
	)
}
