import { Component, PLATFORM_ID, inject } from "@angular/core"
import { isPlatformServer } from "@angular/common"
import { createApi } from "@omnifront/api"
import { injectMutation, injectQuery, injectQueryClient } from "@omnifront/angular"

@Component({
	selector: "app-todos",
	template: `
		<main style="font-family: system-ui; max-width: 480px; margin: 2rem auto">
			<h1>omnifront + Angular SSR</h1>
			<p data-testid="flags">status={{ todos.status() }} stale={{ todos.isStale() }} fetching={{ todos.isFetching() }}</p>
			<ul>
				@for (t of todos.data(); track t) {
					<li>{{ t }}</li>
				}
			</ul>
			<form (submit)="submit($event, input)">
				<input #input placeholder="New todo" />
				<button [disabled]="add.status() === 'pending'">{{ add.status() === 'pending' ? 'Saving…' : 'Add' }}</button>
			</form>
		</main>
	`,
})
export class TodosComponent {
	private client = injectQueryClient()
	private onServer = isPlatformServer(inject(PLATFORM_ID))

	private api = createApi()
	private list = this.api.queryOptions<string[]>("/api/todos")

	// On the server the query reads the database directly; in the browser it calls the API.
	// provideOmnifrontSsr() makes the server wait for it and sends the result along with the page.
	todos = injectQuery({
		queryKey: this.list.queryKey,
		queryFn: async (context) => (this.onServer ? (await import("./db")).listTodos() : this.list.queryFn(context)),
		staleTime: 10_000,
	})

	add = injectMutation({
		mutationFn: async (title: string) => {
			await this.api.post("/api/todos", { title })
		},
		onSuccess: () => this.client.invalidateQueries({ queryKey: this.api.queryKey("/api/todos") }),
	})

	submit(event: Event, input: HTMLInputElement) {
		event.preventDefault()
		if (!input.value) return
		this.add.mutate(input.value)
		input.value = ""
	}
}
