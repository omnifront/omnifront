import * as ng from "@angular/core"
import {
	APP_BOOTSTRAP_LISTENER,
	ENVIRONMENT_INITIALIZER,
	TransferState,
	inject,
	makeEnvironmentProviders,
	makeStateKey,
	type EnvironmentProviders,
} from "@angular/core"
import { dehydrate, hydrate, type DehydratedState } from "@unicore/query/hydration"
import { injectQueryClient } from "./provide"

const STATE_KEY = makeStateKey<DehydratedState>("unicore:query-cache")

// PendingTasks (Angular 19+; ExperimentalPendingTasks in 18) lets us hold the server render open.
// A namespace import keeps older Angular versions loadable: the token is just missing there.
const PendingTasks = (ng as unknown as Record<string, { new (): { add(): () => void } } | undefined>)["PendingTasks"] ??
	(ng as unknown as Record<string, { new (): { add(): () => void } } | undefined>)["ExperimentalPendingTasks"]

/**
 * Server-side rendering support. Add it next to `provideUnicore(client)`:
 *
 *   providers: [provideUnicore(new QueryClient()), provideUnicoreSsr()]
 *
 * On the server it waits for every query that started during rendering, then puts the cache into
 * Angular's `TransferState`; in the browser it loads that cache before any component asks for data,
 * so pages start with their data and do not fetch it again while it is fresh.
 */
export function provideUnicoreSsr(): EnvironmentProviders {
	const isServer = typeof window === "undefined"
	return makeEnvironmentProviders([
		{
			provide: ENVIRONMENT_INITIALIZER,
			multi: true,
			useValue: () => {
				const client = injectQueryClient()
				const transfer = inject(TransferState)
				if (isServer) transfer.onSerialize(STATE_KEY, () => dehydrate(client))
				else hydrate(client, transfer.get(STATE_KEY, null))
			},
		},
		{
			provide: APP_BOOTSTRAP_LISTENER,
			multi: true,
			useFactory: () => {
				const client = injectQueryClient()
				const tasks = isServer && PendingTasks ? inject(PendingTasks as never as new () => { add(): () => void }) : undefined
				return () => {
					if (!tasks) return
					// The first render created its queries; keep the application "unstable" until they settle.
					const done = tasks.add()
					void settle(client).finally(done)
				}
			},
		},
	])
}

async function settle(client: ReturnType<typeof injectQueryClient>): Promise<void> {
	for (;;) {
		await Promise.all(client.getQueries().map(({ query }) => query.settled()))
		// New data may reveal components that start queries of their own (a waterfall). Give change
		// detection one macrotask to render them, then look again; stop when nothing is in flight.
		await new Promise<void>((resolve) => client.scheduler.setTimeout(resolve, 0))
		if (!client.getQueries().some(({ query }) => query.getSnapshot().isFetching)) return
	}
}
