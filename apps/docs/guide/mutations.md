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

## Callbacks for one call

```ts
add.mutate(title, {
	onSuccess: (todo) => navigate(`/todos/${todo.id}`),
	onError: (error) => toast(error.message),
})
```

They run after the callbacks in the options (and after those have been awaited), and only for the **latest** call: if `mutate` is called again first, the earlier call's own callbacks are skipped. Put what must always happen (invalidating the cache) in the options, and what belongs to this screen (navigating away) here.

## Retries and the network

Mutations are not retried unless you ask: `retry: 2` (or a function), with the same `retryDelay` as queries.

Without a network a mutation waits instead of failing: `isPaused` is true, `status` stays `"pending"`, and it is sent when the network is back. Queries do the same (`fetchStatus: "paused"`). Set `networkMode: "always"` for work that does not use the network, or `"offlineFirst"` to try once before waiting. The wait lasts as long as the page: a paused mutation is not saved across a reload.

## Seeing a mutation from elsewhere

Give it a `mutationKey`, and any component can count it or read its state:

```ts
const add = useMutation({ mutationKey: ["addTodo"], mutationFn: addTodo })

// in the list component: rows for the todos being added right now
const adding = useMutationState({ filters: { mutationKey: ["addTodo"], status: "pending" }, select: (m) => m.state.variables })
const saving = useIsMutating({ mutationKey: ["addTodo"] }) > 0
```

Vue has the same names; Angular has `injectMutationState` and `injectIsMutating`.

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
