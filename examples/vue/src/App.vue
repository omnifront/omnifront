<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@unicore/vue"
import { ref, watch } from "vue"
import { addTodo, listTodos, server } from "./api"

const client = useQueryClient()
const title = ref("")
const failing = ref(false)
watch(failing, (value) => (server.failing = value))

// Refs come back, so they work directly in the template (no .value there).
const { data: todos, status, error, isFetching, isStale, failureCount, refetch } = useQuery({
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

function submit() {
	if (!title.value) return
	add.mutate(title.value)
	title.value = ""
}
</script>

<template>
	<main style="font-family: system-ui; max-width: 480px; margin: 2rem auto">
		<h1>unicore + Vue</h1>

		<p>
			status: <b>{{ status }}</b> · fetching: <b>{{ isFetching }}</b> · stale: <b>{{ isStale }}</b> · failures:
			<b>{{ failureCount }}</b>
		</p>

		<p v-if="status === 'loading'">Loading…</p>
		<p v-if="status === 'error'" style="color: crimson">{{ (error as Error).message }}</p>
		<ul>
			<li v-for="t in todos" :key="t">{{ t }}</li>
		</ul>

		<form @submit.prevent="submit">
			<input v-model="title" placeholder="New todo" />
			<button :disabled="add.status.value === 'pending'">
				{{ add.status.value === "pending" ? "Saving…" : "Add" }}
			</button>
		</form>
		<p v-if="add.status.value === 'error'" style="color: crimson">
			Could not save: {{ (add.error.value as Error).message }}
		</p>

		<p>
			<button @click="refetch()">Refetch</button>
			<label><input v-model="failing" type="checkbox" /> simulate server failure</label>
		</p>
	</main>
</template>
