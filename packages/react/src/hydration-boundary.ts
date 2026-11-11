import type { DehydratedState, HydrateOptions } from "@omnifront/query/hydration"
import { hydrate } from "@omnifront/query/hydration"
import { createElement, Fragment, useMemo, type ReactNode } from "react"
import { useQueryClient } from "./provider"

export interface HydrationBoundaryProps {
	/** What the server's `dehydrate(client)` returned. */
	state?: DehydratedState | null | undefined
	/** `deserializeData`, when the server used `serializeData`. Keep it stable (define it outside the component). */
	options?: HydrateOptions | undefined
	children?: ReactNode
}

/**
 * Loads server-fetched data into the client's cache before its children render, so they start
 * with data instead of a loading state. Doing it during render (not in an effect) is deliberate:
 * the first client render has to match the server markup. It is idempotent and never overwrites
 * newer data, so repeating it (StrictMode, concurrent re-renders, navigation) is harmless.
 */
export function HydrationBoundary({ state, options, children }: HydrationBoundaryProps) {
	const client = useQueryClient()
	useMemo(() => hydrate(client, state, options), [client, state, options])
	return createElement(Fragment, null, children)
}
