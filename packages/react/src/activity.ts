import type { Subscribable } from "@omnifront/core"
import { hashKey, type InvalidateFilter, type MutationState } from "@omnifront/query"
import {
	createFetchingCount,
	createMutatingCount,
	createMutationState,
	type MutationFilters,
	type MutationStateOptions,
} from "@omnifront/query/activity"
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { useQueryClient } from "./provider"

function useCount(counter: Subscribable<number>): number {
	const getSnapshot = useCallback(() => counter.getSnapshot(), [counter])
	// The server (and the hydrating render) shows 0: nothing is in flight before the first effect.
	const getServerSnapshot = useCallback(() => counter.getServerSnapshot?.() ?? counter.getSnapshot(), [counter])
	return useSyncExternalStore(counter.subscribe, getSnapshot, getServerSnapshot)
}

/**
 * How many queries are fetching right now (first loads and background refetches), for a global
 * spinner. Pass a filter to count only some: `{ queryKey: ["todos"] }` (prefix) or add `exact: true`.
 * Defining the filter inline is fine; it is compared by value.
 */
export function useIsFetching(filter?: InvalidateFilter): number {
	const client = useQueryClient()
	const identity = filter ? `${filter.queryKey ? hashKey(filter.queryKey) : ""}|${filter.exact === true}` : ""
	const counter = useMemo(() => createFetchingCount(client, filter), [client, identity])
	return useCount(counter)
}

/** A filters object as a string, so one written inline does not look new on every render. Predicates count as equal. */
const identityOf = (filters: MutationFilters | undefined): string =>
	filters ? `${filters.mutationKey ? hashKey(filters.mutationKey) : ""}|${filters.exact === true}|${filters.status ?? ""}` : ""

/** The latest value, readable from callbacks that must not change identity. */
function useLatest<T>(value: T): { current: T } {
	const ref = useRef(value)
	useEffect(() => {
		ref.current = value
	})
	return ref
}

/**
 * How many mutations started with `useMutation` under this provider are pending. Pass filters to
 * count only some: `{ mutationKey: ["todos"] }` matches by prefix.
 */
export function useIsMutating(filters?: MutationFilters): number {
	const client = useQueryClient()
	const latest = useLatest(filters)
	const counter = useMemo(
		() => createMutatingCount(client, { ...filters, predicate: (m) => latest.current?.predicate?.(m) ?? true }),
		[client, identityOf(filters)],
	)
	return useCount(counter)
}

/**
 * The state of the mutations under this provider that pass `filters`, to show elsewhere what a
 * mutation is doing. `select` picks what to keep of each (default: its whole state).
 *
 *   const pending = useMutationState({ filters: { mutationKey: ["addTodo"], status: "pending" }, select: (m) => m.state.variables })
 */
export function useMutationState<TResult = MutationState<unknown, unknown, unknown>>(
	options: MutationStateOptions<TResult> = {},
): TResult[] {
	const client = useQueryClient()
	const latest = useLatest(options)
	const states = useMemo(
		() =>
			createMutationState<TResult>(client, {
				filters: { ...options.filters, predicate: (m) => latest.current.filters?.predicate?.(m) ?? true },
				select: (m) => (latest.current.select ? latest.current.select(m) : (m.state as TResult)),
			}),
		[client, identityOf(options.filters)],
	)
	const getSnapshot = useCallback(() => states.getSnapshot(), [states])
	// Nothing is tracked while rendering on the server.
	const getServerSnapshot = useCallback((): TResult[] => EMPTY as TResult[], [])
	return useSyncExternalStore(states.subscribe, getSnapshot, getServerSnapshot)
}

const EMPTY: unknown[] = []
