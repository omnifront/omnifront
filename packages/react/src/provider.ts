import type { QueryClient } from "@omnifront/query"
import { createContext, createElement, useContext, type ReactNode } from "react"

const QueryClientContext = createContext<QueryClient | undefined>(undefined)

export interface QueryProviderProps {
	client: QueryClient
	children?: ReactNode
}

/** Makes `client` available to useQuery / useMutation below it. */
export function QueryProvider({ client, children }: QueryProviderProps) {
	return createElement(QueryClientContext.Provider, { value: client }, children)
}

/** Like `useQueryClient`, but `undefined` instead of throwing (hooks that work without a provider). */
export function useOptionalQueryClient(): QueryClient | undefined {
	return useContext(QueryClientContext)
}

export function useQueryClient(): QueryClient {
	const client = useOptionalQueryClient()
	if (!client) throw new Error("useQueryClient: wrap your app in <QueryProvider client={...}>")
	return client
}
