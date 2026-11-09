# Mutations

A mutation is a write: it runs when you call it, is not cached or shared, and does not retry.

```tsx
const add = useMutation<Todo, Error, string>({
	mutationFn: (title) => api.addTodo(title),
	onSuccess: (todo, title) => client.invalidateQueries({ queryKey: ["todos"] }),
	onError: (error, title) => toast.error(String(error)),
	onSettled: (todo, error, title) => log("done"),
})

add.mutate("Write docs")               // fire and forget; failures are in add.status / add.error
const todo = await add.mutateAsync("Write docs") // resolves with data, rejects with the error
add.reset()                            // back to "idle"
```

`status` is `"idle" | "pending" | "success" | "error"`, with `data`, `error` and `variables` (of the latest call) alongside.

## Callback order

1. `onMutate(variables)` runs and is **awaited**; whatever it returns is the `context`, passed as the last argument to the other callbacks.
2. `mutationFn` runs.
3. On success, `onSuccess` is **awaited**, and only then does the status become `"success"`. If it returns the promise from `invalidateQueries`, the mutation stays `"pending"` until the list has refetched, so your button shows "Saving…" until the new data is on screen.
4. `onSettled` runs afterwards, on either outcome.
5. If `onMutate`, `mutationFn` **or** `onSuccess` throws, `onError` runs (and is awaited) and the status becomes `"error"`. If `onMutate` threw, `context` is `undefined`.

## Calling it several times

If you call `mutate` again before the previous call finishes, both run to completion and both resolve their own promise, but only the **latest** call drives `status`, `data` and `error`.

## Optimistic updates

Change the cache in `onMutate`, return what you need to undo it, and restore it in `onError`:

```ts
const add = useMutation({
	mutationFn: (title: string) => api.addTodo(title),

	onMutate: async (title) => {
		client.cancelQuery(["todos"])                            // stop a refetch overwriting our change
		const previous = client.getQueryData<string[]>(["todos"])
		client.setQueryData<string[]>(["todos"], (old) => [...(old ?? []), title])
		return previous                                           // becomes `context`
	},
	onError: (_error, _title, previous) => client.setQueryData(["todos"], previous), // roll back
	onSettled: () => client.invalidateQueries({ queryKey: ["todos"] }),                // re-sync with the server
})
```

The shared conformance suite runs a flow like this (optimistic add, then a failing add that rolls back) on React, Vue and Angular.
