# Vue

::: info Pre-release
Not on npm yet. Once published: `npm install @omnifront/vue @omnifront/query` (Vue 3.3 or newer).
:::

## Set up

```ts
import { QueryClient } from "@omnifront/query"
import { QueryPlugin } from "@omnifront/vue"
import { createApp } from "vue"
import App from "./App.vue"

createApp(App).use(QueryPlugin, new QueryClient()).mount("#app")
```

`app.use(QueryPlugin, client)` makes the client injectable everywhere. To give one subtree a different client, call `provideQueryClient(client)` in a component's `setup()`.

## Fetch data

```vue
<script setup lang="ts">
import { useQuery } from "@omnifront/vue"

// Each field is its own ref, so you can destructure and use them directly in the template.
const { data, status, error, isFetching, refetch } = useQuery({
	queryKey: ["todos"],
	queryFn: ({ signal }) => fetch("/api/todos", { signal }).then((r) => r.json() as Promise<string[]>),
	staleTime: 5_000,
})
</script>

<template>
	<p v-if="status === 'loading'">Loading…</p>
	<ul><li v-for="t in data" :key="t">{{ t }}</li></ul>
	<button @click="refetch()">Refetch</button>
</template>
```

### Reactive keys

Pass a getter, a `ref` or a `computed` for the options; when what it reads changes, the query switches.

```ts
const id = ref(1)
const { data } = useQuery(() => ({
	queryKey: ["user", id.value],
	queryFn: () => fetchUser(id.value),
}))
id.value = 2 // fetches (or reads from cache) user 2
```

## Change data

```ts
import { useMutation, useQueryClient } from "@omnifront/vue"

const client = useQueryClient()
const add = useMutation({
	mutationFn: (title: string) => postTodo(title),
	onSuccess: () => client.invalidateQueries({ queryKey: ["todos"] }),
})
add.mutate("Write docs")        // add.status.value, add.error.value, ...
```

## Shared state

`useStore(store, selector)` returns a read-only `ComputedRef` of the selected slice.

```ts
import { useStore } from "@omnifront/vue"
const text = useStore(filter, (s) => s.text) // ComputedRef<string>
```

## Lifecycle notes

- The composables subscribe when the component is **mounted** (immediately when used outside a component). The first render uses a clock-independent snapshot, so a page rendered on the server hydrates without a mismatch; right after mount it switches to live data. The subscription is stopped with `onScopeDispose`, so unmounting the component lets an unused cache entry start its gc timer.
- On the server (no `window`) they do not subscribe. They register `onServerPrefetch`, so Vue waits for the data before rendering. See [Server-side rendering](/guide/ssr#vue) for the full flow and a Nuxt plugin.
