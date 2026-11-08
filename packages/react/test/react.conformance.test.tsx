import {
	defineConformanceSuite,
	type Harness,
	type MutationHandle,
	type QueryHandle,
} from "@unicore/conformance"
import type { MutationOptions, QueryClient, QueryObserverOptions } from "@unicore/query"
import { act, renderHook } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { QueryProvider, useMutation, useQuery, useStore } from "../src"
import { useInfiniteQuery } from "../src/infinite"

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

	mountInfiniteQuery(client, options) {
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryProvider, { client }, children)
		const hook = renderHook((props: typeof options) => useInfiniteQuery(props), { wrapper, initialProps: options })
		return {
			current: () => hook.result.current,
			fetchNextPage: async () => {
				await act(async () => {
					await hook.result.current.fetchNextPage()
				})
			},
			update: (next) => hook.rerender(next),
			unmount: () => hook.unmount(),
		}
	},

	mountStore(source, selector, equals) {
		const hook = renderHook(() => useStore(source, selector, equals))
		return { current: () => hook.result.current, unmount: () => hook.unmount() }
	},

	mountMutation<TData, TVariables, TContext = unknown>(
		options: MutationOptions<TData, TVariables, TContext>,
	): MutationHandle<TData, TVariables> {
		const hook = renderHook(() => useMutation(options))
		return {
			current: () => hook.result.current,
			mutate: (variables: TVariables) => void act(() => hook.result.current.mutate(variables)),
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
