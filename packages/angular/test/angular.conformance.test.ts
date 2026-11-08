import {
	defineConformanceSuite,
	type Harness,
	type MutationHandle,
	type QueryHandle,
} from "@unicore/conformance"
import type { MutationOptions, QueryClient, QueryObserverOptions } from "@unicore/query"
import { signal } from "@angular/core"
import { injectMutation, injectQuery, injectStore, provideUnicore } from "../src"
import { injectInfiniteQuery } from "../src/infinite"
import { injectQueries } from "../src/queries"
import { flushEffects, mountInjectable } from "./mount"

const harness: Harness = {
	act: async (fn) => {
		await fn()
		flushEffects()
	},

	mountQuery<TData>(client: QueryClient, options: QueryObserverOptions<TData>): QueryHandle<TData> {
		const current = signal(options)
		const { result: r, unmount } = mountInjectable(() => injectQuery(() => current()), [provideUnicore(client)])
		return {
			current: () => r.result(),
			update: (next: QueryObserverOptions<TData>) => {
				current.set(next)
				flushEffects() // the effect applies the new options
			},
			refetch: () => r.refetch(),
			unmount,
		}
	},

	mountQueries(client, options) {
		const current = signal(options)
		const { result: r, unmount } = mountInjectable(() => injectQueries(() => current()), [provideUnicore(client)])
		return {
			current: () => r() as never,
			update: (next) => {
				current.set(next)
				flushEffects()
			},
			unmount,
		}
	},

	mountInfiniteQuery(client, options) {
		const current = signal(options)
		const { result: r, unmount } = mountInjectable(() => injectInfiniteQuery(() => current()), [provideUnicore(client)])
		return {
			current: () => r.result(),
			fetchNextPage: () => r.fetchNextPage(),
			update: (next) => {
				current.set(next)
				flushEffects()
			},
			unmount,
		}
	},

	mountStore(source, selector, equals) {
		const { result, unmount } = mountInjectable(() => injectStore(source, selector, equals))
		return { current: () => result(), unmount }
	},

	mountMutation<TData, TVariables, TContext = unknown>(
		options: MutationOptions<TData, TVariables, TContext>,
	): MutationHandle<TData, TVariables> {
		const { result: r, unmount } = mountInjectable(() => injectMutation(options))
		return {
			current: () => ({ status: r.status(), data: r.data(), error: r.error(), variables: r.variables() }),
			mutate: (variables: TVariables) => r.mutate(variables),
			mutateAsync: (variables: TVariables) => r.mutateAsync(variables),
			reset: () => r.reset(),
			unmount,
		}
	},
}

defineConformanceSuite("angular", harness)
