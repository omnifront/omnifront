<script setup lang="ts">
import { createApi } from "@omnifront/api"
import { useMutation, useQuery, useQueryClient } from "@omnifront/vue"

const client = useQueryClient()
const title = ref("")

// Created per request (this setup runs once per request on the server). `$fetch.native` is a
// fetch that works on both sides: on the server Nuxt calls the API handler directly, without an
// HTTP round trip, and relative URLs resolve.
const api = createApi({ fetch: ((input, init) => $fetch.native(input, init)) as typeof fetch })

const { data, status, isFetching, isStale } = useQuery({
	...api.queryOptions<string[]>("/api/todos"),
	staleTime: 10_000,
})

const add = useMutation({
	mutationFn: (value: string) => api.post("/api/todos", { title: value }),
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
		<h1>omnifront + Nuxt</h1>
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
