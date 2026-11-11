import { Component, computed, signal } from "@angular/core"
import { addTodoMutation, matchesFilter, pendingTodos, server, setOffline, todoFilter, todosQuery } from "@omnifront/example-shared"
import { injectMutation, injectQuery, injectQueryClient, injectStore } from "@omnifront/angular"
import { injectMutationState } from "@omnifront/angular/activity"

@Component({
	selector: "app-root",
	template: `
		<main style="font-family: system-ui; max-width: 480px; margin: 2rem auto">
			<h1>omnifront + Angular</h1>

			<p>
				status: <b>{{ todos.status() }}</b> · fetching: <b>{{ todos.isFetching() }}</b> · stale:
				<b>{{ todos.isStale() }}</b> · failures: <b>{{ todos.failureCount() }}</b>
			</p>

			<input placeholder="Filter" [value]="filter()" (input)="setFilter($event)" />
			@if (todos.status() === 'loading') {
				<p>Loading…</p>
			}
			@if (todos.status() === 'error') {
				<p style="color: crimson">{{ errorMessage(todos.error()) }}</p>
			}
			<ul>
				@for (t of visible(); track t) {
					<li>{{ t }}</li>
				}
				@for (t of adding(); track $index) {
					<li style="opacity: 0.5">{{ t }} {{ add.isPaused() ? '(waiting for the network)' : '(saving…)' }}</li>
				}
			</ul>

			<form (submit)="submit($event, input)">
				<input #input placeholder="New todo" />
				<button [disabled]="add.isPending() && !add.isPaused()">
					{{ add.isPending() ? 'Saving…' : 'Add' }}
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
				<label>
					<input type="checkbox" (change)="toggleOffline($event)" />
					simulate offline
				</label>
			</p>
		</main>
	`,
})
export class AppComponent {
	private client = injectQueryClient()
	failing = signal(false)

	// inject* functions work in field initializers, like Angular's own inject().
	todos = injectQuery(todosQuery)
	add = injectMutation(addTodoMutation(this.client))
	// What is being added right now, shown before it is saved.
	adding = injectMutationState(pendingTodos)
	filter = injectStore(todoFilter, (s) => s.filter)
	visible = computed(() => this.todos.data()?.filter((t) => matchesFilter(t, this.filter())) ?? [])

	setFilter(event: Event) {
		todoFilter.getState().setFilter((event.target as HTMLInputElement).value)
	}

	submit(event: Event, input: HTMLInputElement) {
		event.preventDefault()
		if (!input.value) return
		this.add.mutate(input.value)
		input.value = ""
	}

	toggleOffline(event: Event) {
		setOffline((event.target as HTMLInputElement).checked)
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
