import {
	defineConformanceSuite,
	type Harness,
	type MutationHandle,
	type QueryHandle,
} from "@omnifront/conformance"
import type { MutationOptions, QueryClient, QueryObserverOptions } from "@omnifront/query"
import { isRef, nextTick, shallowRef } from "vue"
import { useMutation, useQuery, useStore } from "../src"
import { useIsFetching, useIsMutating } from "../src/activity"
import { useInfiniteQuery } from "../src/infinite"
import { useQueries } from "../src/queries"
import { mountComposable } from "./mount"

/** The plain values behind a composable's refs (functions like `refetch` are left out). */
const values = (refs: object): Record<string, unknown> =>
	Object.fromEntries(
		Object.entries(refs)
			.filter(([, value]) => isRef(value))
			.map(([key, value]) => [key, (value as { value: unknown }).value]),
	)

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
			current: () => values(r) as never,
			update: (next: QueryObserverOptions<TData>) => {
				current.value = next
			},
			refetch: () => r.refetch(),
			unmount,
		}
	},

	mountSelectedQuery(client, options, select) {
		const current = shallowRef(select)
		const { result: r, unmount } = mountComposable(() => useQuery(() => ({ ...options, select: current.value })), client)
		return {
			current: () => values(r) as never,
			setSelect: (next) => {
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

	mountCombinedQueries(client, options, combine) {
		const current = shallowRef(options)
		const { result: r, unmount } = mountComposable(() => useQueries(current, { combine: combine as never }), client)
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
			current: () => ({ isInvalidated: false, isPlaceholderData: false, failureCount: 0, dataUpdatedAt: undefined, ...values(r) }) as never,
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
		options: MutationOptions<TData, Error, TVariables, TContext>,
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
