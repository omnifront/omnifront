<script setup lang="ts">
import { addTodoMutation, matchesFilter, server, todoFilter, todosQuery } from "@unicore/example-shared"
import { useMutation, useQuery, useQueryClient, useStore } from "@unicore/vue"
import { computed, ref, watch } from "vue"

const client = useQueryClient()
const title = ref("")
const failing = ref(false)
watch(failing, (value) => (server.failing = value))

// Refs come back, so they work directly in the template (no .value there).
const { data: todos, status, error, isFetching, isStale, failureCount, refetch } = useQuery(todosQuery)
const add = useMutation(addTodoMutation(client))
const filter = useStore(todoFilter, (s) => s.filter)
const visible = computed(() => todos.value?.filter((t) => matchesFilter(t, filter.value)))

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

		<input
			:value="filter"
			placeholder="Filter"
			@input="todoFilter.getState().setFilter(($event.target as HTMLInputElement).value)"
		/>
		<p v-if="status === 'loading'">Loading…</p>
		<p v-if="status === 'error'" style="color: crimson">{{ (error as Error).message }}</p>
		<ul>
			<li v-for="t in visible" :key="t">{{ t }}</li>
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
