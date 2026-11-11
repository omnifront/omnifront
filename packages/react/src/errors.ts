import { useMemo, createElement, Fragment, type ReactNode } from "react"
import { useQueryClient } from "./provider"

export interface QueryErrorReset {
	/**
	 * Let every failed query load again: it is marked outdated, so the next time something mounts or
	 * renders it, it is fetched instead of rethrowing the old error. Call it from the error boundary's
	 * reset, before the boundary renders its children again.
	 */
	reset: () => void
}

/** `{ reset }` for the nearest client; see {@link QueryErrorReset}. */
export function useQueryErrorResetBoundary(): QueryErrorReset {
	const client = useQueryClient()
	return useMemo(
		() => ({
			reset: () => {
				for (const { query } of client.getQueries()) if (query.getSnapshot().status === "error") query.invalidate(true)
			},
		}),
		[client],
	)
}

/**
 * TanStack's component form: its children (a node, or a function of `{ reset }`) go inside your
 * error boundary, and the boundary's retry calls `reset`.
 *
 *   <QueryErrorResetBoundary>
 *     {({ reset }) => <ErrorBoundary onReset={reset} fallback={...}><Page /></ErrorBoundary>}
 *   </QueryErrorResetBoundary>
 */
export function QueryErrorResetBoundary({ children }: { children?: ReactNode | ((boundary: QueryErrorReset) => ReactNode) }) {
	const boundary = useQueryErrorResetBoundary()
	return createElement(Fragment, null, typeof children === "function" ? children(boundary) : children)
}
