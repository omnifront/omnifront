import {
	defineConformanceSuite,
	type Harness,
	type MutationHandle,
	type QueryHandle,
} from "@omnifront/conformance"
import type { MutationOptions, QueryClient, QueryObserverOptions } from "@omnifront/query"
import { act, renderHook } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { QueryProvider, useMutation, useQuery, useStore } from "../src"
import { useIsFetching, useIsMutating, useMutationState } from "../src/activity"
import { useInfiniteQuery } from "../src/infinite"
import { useQueries } from "../src/queries"

const harness: Harness = {
	act: async (fn) => {
		await act(async () => {
			await fn()
		})
	},

	mountQuery<TData>(client: QueryClient, options: QueryObserverOptions<TData>): QueryHandle<TData> {
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		const hook = renderHook((props: QueryObserverOptions<TData>) => useQuery(props), {
			wrapper,
			initialProps: options,
		})
		return {
			current: () => hook.result.current,
			update: (next: QueryObserverOptions<TData>) => hook.rerender(next),
			refetch: () => hook.result.current.refetch(),
			unmount: () => hook.unmount(),
		}
	},

	mountSelectedQuery(client, options, select) {
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		const hook = renderHook((props: { select: typeof select }) => useQuery({ ...options, select: props.select }), {
			wrapper,
			initialProps: { select },
		})
		return {
			current: () => hook.result.current,
			setSelect: (next) => hook.rerender({ select: next }),
			refetch: () => hook.result.current.refetch(),
			unmount: () => hook.unmount(),
		}
	},

	mountQueries(client, options) {
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		const hook = renderHook((props: typeof options) => useQueries<unknown[]>(props as never), { wrapper, initialProps: options })
		return {
			current: () => hook.result.current as never,
			update: (next) => hook.rerender(next),
			unmount: () => hook.unmount(),
		}
	},

	mountCombinedQueries(client, options, combine) {
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		const hook = renderHook((props: typeof options) => useQueries<unknown[], ReturnType<typeof combine>>(props as never, { combine: combine as never }), {
			wrapper,
			initialProps: options,
		})
		return { current: () => hook.result.current, update: (next) => hook.rerender(next), unmount: () => hook.unmount() }
	},

	mountInfiniteQuery(client, options) {
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		const hook = renderHook((props: typeof options) => useInfiniteQuery(props), { wrapper, initialProps: options })
		return {
			current: () => hook.result.current,
			// Start the request inside a synchronous act (so "fetching" renders), and let the test await
			// its end separately; one long act around the whole wait would overlap the test's own acts.
			fetchNextPage: () => {
				let pending!: Promise<void>
				act(() => {
					pending = hook.result.current.fetchNextPage()
				})
				return pending.then(() => act(async () => {})) as Promise<void>
			},
			update: (next) => hook.rerender(next),
			unmount: () => hook.unmount(),
		}
	},

	mountStore(source, selector, equals) {
		const hook = renderHook(() => useStore(source, selector, equals))
		return { current: () => hook.result.current, unmount: () => hook.unmount() }
	},

	mountActivity(client, filter) {
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		const hook = renderHook(() => ({ fetching: useIsFetching(filter), mutating: useIsMutating() }), { wrapper })
		return {
			fetching: () => hook.result.current.fetching,
			mutating: () => hook.result.current.mutating,
			unmount: () => hook.unmount(),
		}
	},

	mountMutationInsight(client, filters, select) {
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		// Inline objects on purpose: a filter written in a component is a new object on every render.
		const hook = renderHook(() => ({ mutating: useIsMutating({ ...filters }), states: useMutationState({ filters: { ...filters }, select }) }), { wrapper })
		return {
			mutating: () => hook.result.current.mutating,
			states: () => hook.result.current.states,
			unmount: () => hook.unmount(),
		}
	},

	mountMutation<TData, TVariables, TContext = unknown>(
		options: MutationOptions<TData, Error, TVariables, TContext>,
		client?: QueryClient,
	): MutationHandle<TData, TVariables> {
		const wrapper = client
			? ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
			: undefined
		const hook = renderHook(() => useMutation(options), wrapper ? { wrapper } : {})
		return {
			current: () => hook.result.current,
			mutate: (variables: TVariables, callbacks) => void act(() => hook.result.current.mutate(variables, callbacks as never)),
			async mutateAsync(variables: TVariables) {
				let out!: Promise<TData>
				await act(async () => {
					out = hook.result.current.mutateAsync(variables)
					await out.catch(() => {})
				})
				return out
			},
			reset: () => void act(() => hook.result.current.reset()),
			unmount: () => hook.unmount(),
		}
	},
}

defineConformanceSuite("react", harness)
