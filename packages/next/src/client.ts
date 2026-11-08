"use client"

import { QueryClient } from "@omnifront/query"
import { QueryProvider } from "@omnifront/react"
import { createElement, useState, type ReactNode } from "react"

// One import for everything a Client Component needs.
export {
	HydrationBoundary,
	QueryProvider,
	useMutation,
	useQuery,
	useQueryClient,
	useStore,
} from "@omnifront/react"
export type { HydrationBoundaryProps, UseMutationResult, UseQueryResult } from "@omnifront/react"
export type { MutationOptions, MutationState, QueryKey, QueryObserverOptions, QueryResult } from "@omnifront/query"

export interface OmnifrontProviderProps {
	children?: ReactNode
	/** Default gcTime (ms) for the browser's cache entries. */
	gcTime?: number
}

/**
 * Put it in the root layout / `_app`. It creates the browser's query client once (per component
 * instance), so while rendering on the server every request gets its own and in the browser one
 * lives for the whole session. For custom client configuration write your own provider with
 * `useState(() => new QueryClient(...))` (a client can't be passed down from a Server Component).
 */
export function OmnifrontProvider({ children, gcTime }: OmnifrontProviderProps) {
	const [client] = useState(() => {
		if (typeof window === "undefined") return new QueryClient({ gcTime: Infinity })
		return new QueryClient(gcTime === undefined ? {} : { gcTime })
	})
	return createElement(QueryProvider, { client }, children)
}
