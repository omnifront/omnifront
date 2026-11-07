import type { QueryClient } from "@unicore/query"
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

export function useQueryClient(): QueryClient {
	const client = useContext(QueryClientContext)
	if (!client) throw new Error("useQueryClient: wrap your app in <QueryProvider client={...}>")
	return client
}
