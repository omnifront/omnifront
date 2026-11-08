# Mutations

A mutation is a write: it runs when you call it, is not cached or shared, and does not retry.

```tsx
const add = useMutation<Todo, string>({
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

1. `mutationFn` runs.
2. On success, `onSuccess` is **awaited**, and only then does the status become `"success"`. If it returns the promise from `invalidateQueries`, the mutation stays `"pending"` until the list has refetched, so your button shows "Saving…" until the new data is on screen.
3. `onSettled` runs afterwards, on either outcome.
4. If `mutationFn` **or** `onSuccess` throws, `onError` runs (and is awaited) and the status becomes `"error"`.

## Calling it several times

If you call `mutate` again before the previous call finishes, both run to completion and both resolve their own promise, but only the **latest** call drives `status`, `data` and `error`.

## Not yet

There is no `onMutate` and no built-in rollback, so optimistic updates are manual: write with `client.setQueryData` in `onMutate`-like code before calling, and `invalidateQueries` in `onError`/`onSettled` to recover.
