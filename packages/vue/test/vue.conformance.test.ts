import {
	defineConformanceSuite,
	type Harness,
	type MutationHandle,
	type QueryHandle,
} from "@omnifront/conformance"
import type { MutationOptions, QueryClient, QueryObserverOptions } from "@omnifront/query"
import { nextTick, shallowRef } from "vue"
import { useMutation, useQuery, useStore } from "../src"
import { useIsFetching, useIsMutating } from "../src/activity"
import { useInfiniteQuery } from "../src/infinite"
import { useQueries } from "../src/queries"
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
				isPlaceholderData: r.isPlaceholderData.value,
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

	mountQueries(client, options) {
		const current = shallowRef(options)
		const { result: r, unmount } = mountComposable(() => useQueries(current), client)
		return {
			current: () => r.value as never,
			update: (next) => {
				current.value = next
			},
			unmount,
		}
	},

	mountInfiniteQuery(client, options) {
		const current = shallowRef(options)
		const { result: r, unmount } = mountComposable(() => useInfiniteQuery(current), client)
		return {
			current: () => ({
				status: r.status.value,
				data: r.data.value,
				error: r.error.value,
				isFetching: r.isFetching.value,
				isStale: r.isStale.value,
				isInvalidated: false,
				isPlaceholderData: false,
				failureCount: 0,
				dataUpdatedAt: undefined,
				hasNextPage: r.hasNextPage.value,
				hasPreviousPage: r.hasPreviousPage.value,
				isFetchingNextPage: r.isFetchingNextPage.value,
				isFetchingPreviousPage: r.isFetchingPreviousPage.value,
			}),
			fetchNextPage: () => r.fetchNextPage(),
			update: (next) => {
				current.value = next
			},
			unmount,
		}
	},

	mountStore(source, selector, equals) {
		const { result, unmount } = mountComposable(() => useStore(source, selector, equals))
		return { current: () => result.value, unmount }
	},

	mountActivity(client, filter) {
		const { result: r, unmount } = mountComposable(() => ({ fetching: useIsFetching(filter), mutating: useIsMutating() }), client)
		return { fetching: () => r.fetching.value, mutating: () => r.mutating.value, unmount }
	},

	mountMutation<TData, TVariables, TContext = unknown>(
		options: MutationOptions<TData, TVariables, TContext>,
		client?: QueryClient,
	): MutationHandle<TData, TVariables> {
		const { result: r, unmount } = mountComposable(() => useMutation(options), client)
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
