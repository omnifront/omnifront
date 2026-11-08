import {
	defineConformanceSuite,
	type Harness,
	type MutationHandle,
	type QueryHandle,
} from "@unicore/conformance"
import type { MutationOptions, QueryClient, QueryObserverOptions } from "@unicore/query"
import { signal } from "@angular/core"
import { injectMutation, injectQuery, provideUnicore } from "../src"
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

	mountMutation<TData, TVariables>(options: MutationOptions<TData, TVariables>): MutationHandle<TData, TVariables> {
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
