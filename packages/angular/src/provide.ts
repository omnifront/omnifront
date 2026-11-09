import type { QueryClient } from "@omnifront/query"
import { InjectionToken, inject, makeEnvironmentProviders, type EnvironmentProviders } from "@angular/core"

const QUERY_CLIENT = new InjectionToken<QueryClient>("omnifront:query-client")

/**
 * Register the client for an app or a route subtree:
 *   bootstrapApplication(App, { providers: [provideOmnifront(new QueryClient())] })
 * (Providers are Angular's dependency injection config; `makeEnvironmentProviders` marks these as
 * environment-level, so they can go in `bootstrapApplication` or a route's `providers`.)
 */
export function provideOmnifront(client: QueryClient): EnvironmentProviders {
	return makeEnvironmentProviders([{ provide: QUERY_CLIENT, useValue: client }])
}

/** Like `injectQueryClient`, but `null` instead of throwing (hooks that work without a provider). */
export function injectOptionalQueryClient(): QueryClient | null {
	return inject(QUERY_CLIENT, { optional: true })
}

/** Like Angular's `inject()`: call it in a constructor, field initializer or other injection context. */
export function injectQueryClient(): QueryClient {
	return injectOptionalQueryClient() ?? fail()
}

function fail(): never {
	throw new Error("injectQueryClient: add provideOmnifront(client) to your providers")
}
