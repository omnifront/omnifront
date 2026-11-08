<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@unicore/vue"

const client = useQueryClient()
const title = ref("")

// $fetch works on both sides: on the server Nuxt calls the API handler directly (no HTTP round trip).
const { data, status, isFetching, isStale } = useQuery({
	queryKey: ["todos"],
	queryFn: () => $fetch<string[]>("/api/todos"),
	staleTime: 10_000,
})

const add = useMutation({
	mutationFn: (value: string) => $fetch("/api/todos", { method: "POST", body: { title: value } }),
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
		<h1>unicore + Nuxt</h1>
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
