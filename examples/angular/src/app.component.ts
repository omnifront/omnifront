import { Component, signal } from "@angular/core"
import { injectMutation, injectQuery, injectQueryClient } from "@unicore/angular"
import { addTodo, listTodos, server } from "./api"

@Component({
	selector: "app-root",
	template: `
		<main style="font-family: system-ui; max-width: 480px; margin: 2rem auto">
			<h1>unicore + Angular</h1>

			<p>
				status: <b>{{ todos.status() }}</b> · fetching: <b>{{ todos.isFetching() }}</b> · stale:
				<b>{{ todos.isStale() }}</b> · failures: <b>{{ todos.failureCount() }}</b>
			</p>

			@if (todos.status() === 'loading') {
				<p>Loading…</p>
			}
			@if (todos.status() === 'error') {
				<p style="color: crimson">{{ errorMessage(todos.error()) }}</p>
			}
			<ul>
				@for (t of todos.data(); track t) {
					<li>{{ t }}</li>
				}
			</ul>

			<form (submit)="submit($event, input)">
				<input #input placeholder="New todo" />
				<button [disabled]="add.status() === 'pending'">
					{{ add.status() === 'pending' ? 'Saving…' : 'Add' }}
				</button>
			</form>
			@if (add.status() === 'error') {
				<p style="color: crimson">Could not save: {{ errorMessage(add.error()) }}</p>
			}

			<p>
				<button (click)="todos.refetch()">Refetch</button>
				<label>
					<input type="checkbox" [checked]="failing()" (change)="toggleFailing($event)" />
					simulate server failure
				</label>
			</p>
		</main>
	`,
})
export class AppComponent {
	private client = injectQueryClient()
	failing = signal(false)

	// inject* functions work in field initializers, like Angular's own inject().
	todos = injectQuery({
		queryKey: ["todos"],
		queryFn: ({ signal }) => listTodos(signal),
		staleTime: 5_000,
		retryDelay: 800,
	})

	add = injectMutation({
		mutationFn: addTodo,
		// Stay "pending" until the list has been refetched.
		onSuccess: () => this.client.invalidateQueries({ queryKey: ["todos"] }),
	})

	submit(event: Event, input: HTMLInputElement) {
		event.preventDefault()
		if (!input.value) return
		this.add.mutate(input.value)
		input.value = ""
	}

	toggleFailing(event: Event) {
		const checked = (event.target as HTMLInputElement).checked
		server.failing = checked
		this.failing.set(checked)
	}

	errorMessage(error: unknown): string {
		return (error as Error).message
	}
}
