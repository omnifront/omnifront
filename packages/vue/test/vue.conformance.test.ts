import {
	defineConformanceSuite,
	type Harness,
	type MutationHandle,
	type QueryHandle,
} from "@unicore/conformance"
import type { MutationOptions, QueryClient, QueryObserverOptions } from "@unicore/query"
import { nextTick, shallowRef } from "vue"
import { useMutation, useQuery } from "../src"
import { mountComposable } from "./mount"

const harness: Harness = {
	// Vue has no act(): run the work, then let watchers (flush: "pre") and microtasks settle.
	act: async (fn) => {
		await fn()
		await nextTick()
	},

	mountQuery<TData>(client: QueryClient, options: QueryObserverOptions<TData>): QueryHandle<TData> {
		const current = shallowRef(options)
		const { result: r, unmount } = mountComposable(() => useQuery(current), client)
		return {
			current: () => ({
				status: r.status.value,
				data: r.data.value,
				error: r.error.value,
				isFetching: r.isFetching.value,
				isStale: r.isStale.value,
				isInvalidated: r.isInvalidated.value,
				failureCount: r.failureCount.value,
				dataUpdatedAt: r.dataUpdatedAt.value,
			}),
			update: (next: QueryObserverOptions<TData>) => {
				current.value = next
			},
			refetch: () => r.refetch(),
			unmount,
		}
	},

	mountMutation<TData, TVariables>(options: MutationOptions<TData, TVariables>): MutationHandle<TData, TVariables> {
		const { result: r, unmount } = mountComposable(() => useMutation(options))
		return {
			current: () => ({
				status: r.status.value,
				data: r.data.value,
				error: r.error.value,
				variables: r.variables.value,
			}),
			mutate: (variables: TVariables) => r.mutate(variables),
			mutateAsync: (variables: TVariables) => r.mutateAsync(variables),
			reset: () => r.reset(),
			unmount,
		}
	},
}

defineConformanceSuite("vue", harness)
