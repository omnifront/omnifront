# Angular

::: info Pre-release
Not on npm yet. Once published: `npm install @unicore/angular @unicore/query` (Angular 17 or newer). Tested against the latest Angular, zoneless.
:::

## Set up

```ts
import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"
import { QueryClient } from "@unicore/query"
import { provideUnicore } from "@unicore/angular"

bootstrapApplication(AppComponent, {
	providers: [provideZonelessChangeDetection(), provideUnicore(new QueryClient())],
})
```

`provideUnicore` is an environment provider, so it also works in a route's `providers`.

## Fetch data

`injectQuery` works like Angular's own `inject()`: call it in a constructor or a field initializer. It returns **signals**.

```ts
import { Component } from "@angular/core"
import { injectQuery } from "@unicore/angular"

@Component({
	selector: "app-todos",
	template: `
		@if (todos.status() === 'loading') { <p>Loading…</p> }
		<ul>
			@for (t of todos.data(); track t) { <li>{{ t }}</li> }
		</ul>
		<button (click)="todos.refetch()">Refetch</button>
	`,
})
export class TodosComponent {
	todos = injectQuery({
		queryKey: ["todos"],
		queryFn: ({ signal }) => fetch("/api/todos", { signal }).then((r) => r.json() as Promise<string[]>),
		staleTime: 5_000,
	})
}
```

The result has a signal per field (`status`, `data`, `error`, `isFetching`, `isStale`, `isInvalidated`, `failureCount`, `dataUpdatedAt`), `result` (all of them as one signal) and `refetch()`.

### Reactive options

Pass a function that reads signals; the query switches when they change.

```ts
id = signal(1)
user = injectQuery(() => ({
	queryKey: ["user", this.id()],
	queryFn: () => fetchUser(this.id()),
}))
```

## Change data

```ts
export class AddComponent {
	private client = injectQueryClient()
	add = injectMutation({
		mutationFn: (title: string) => postTodo(title),
		onSuccess: () => this.client.invalidateQueries({ queryKey: ["todos"] }),
	})
	// template: <button (click)="add.mutate('x')" [disabled]="add.status() === 'pending'">
}
```

## Shared state

```ts
filter = injectStore(filterStore, (s) => s.text) // Signal<string>
```

## Lifecycle notes

- Subscriptions end with `DestroyRef`, i.e. when the component, route or injector that called `injectQuery` is destroyed.
- Reactive options use `effect` with `untracked`, so the observer's own work never becomes an accidental dependency.
- Server-side rendering: add `provideUnicoreSsr()` from `@unicore/angular/ssr`; see [Server-side rendering](/guide/ssr#angular).
