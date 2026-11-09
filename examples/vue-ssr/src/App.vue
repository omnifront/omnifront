<script setup lang="ts">
import { createApi } from "@omnifront/api"
import { useMutation, useQuery, useQueryClient } from "@omnifront/vue"
import { ref } from "vue"

const client = useQueryClient()
const title = ref("")

// On the server the query runs against the database directly; in the browser it calls the API.
// Vue waits for it (onServerPrefetch inside useQuery) before rendering, so the HTML has the list.
const api = createApi()
const list = api.queryOptions<string[]>("/api/todos")

const { data, status, isFetching, isStale } = useQuery({
	queryKey: list.queryKey,
	queryFn: async (context) => (import.meta.env.SSR ? (await import("./db")).listTodos() : list.queryFn(context)),
	staleTime: 10_000,
})

const add = useMutation({
	mutationFn: async (value: string) => {
		await api.post("/api/todos", { title: value })
	},
	onSuccess: () => client.invalidateQueries({ queryKey: api.queryKey("/api/todos") }),
})

function submit() {
	if (!title.value) return
	add.mutate(title.value)
	title.value = ""
}
</script>

<template>
	<main style="font-family: system-ui; max-width: 480px; margin: 2rem auto">
		<h1>omnifront + Vue SSR</h1>
		<p data-testid="flags">status={{ status }} stale={{ isStale }} fetching={{ isFetching }}</p>
		<ul>
			<li v-for="t in data" :key="t">{{ t }}</li>
		</ul>
		<form @submit.prevent="submit">
			<input v-model="title" placeholder="New todo" />
			<button :disabled="add.status.value === 'pending'">{{ add.status.value === "pending" ? "Saving…" : "Add" }}</button>
		</form>
	</main>
</template>
