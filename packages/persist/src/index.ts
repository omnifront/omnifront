import { focusManager, hashKey, type QueryClient } from "@omnifront/query"
import { dehydrate, hydrate, type DehydratedState, type DehydrateOptions } from "@omnifront/query/hydration"

/** The part of `localStorage` / `sessionStorage` / async-storage / IndexedDB wrappers we need. */
export interface PersistStorage {
	getItem(key: string): string | null | undefined | Promise<string | null | undefined>
	setItem(key: string, value: string): void | Promise<void>
	removeItem(key: string): void | Promise<void>
}

/** What is written to storage. */
export interface PersistedCache {
	version: 1
	/** Scheduler time of the write. */
	timestamp: number
	buster: string
	state: DehydratedState
}

export interface PersistOptions {
	storage: PersistStorage
	/** Storage key. Default `"omnifront-cache"`. */
	key?: string
	/** Discard a stored cache older than this (ms). Default 24 hours. */
	maxAge?: number
	/** Change this (an app version, a schema version) to discard everything stored by older code. */
	buster?: string
	/** How often (ms) changes are looked for and written. Default 1000. */
	throttle?: number
	/** Which queries to persist. Default: the ones with successful data. */
	shouldDehydrate?: DehydrateOptions["shouldDehydrate"]
	serialize?: (cache: PersistedCache) => string
	deserialize?: (raw: string) => PersistedCache
	/** Called with storage / parsing errors. They never throw out of the persister. */
	onError?: (error: unknown) => void
}

export interface Persister {
	/** Resolves once the stored cache has been loaded (`true`) or found missing / expired / invalid (`false`). */
	restored: Promise<boolean>
	/** Write the cache now (the first write waits for `restored`). */
	persist(): Promise<void>
	/** Stop persisting and delete what is stored (call it on logout). */
	clear(): Promise<void>
	/** Stop persisting; leave what is stored. */
	stop(): void
}

const DAY = 24 * 60 * 60 * 1000

/**
 * Keep the query cache across page loads: restore it on start, write it back when it changes.
 *
 * Restored data keeps its original fetch time, so `staleTime` still applies: old data is shown
 * immediately and refetched in the background when a component mounts. It uses dehydrate/hydrate,
 * so the data must be JSON-safe (or give custom serialize/deserialize).
 */
export function persistQueryClient(client: QueryClient, options: PersistOptions): Persister {
	const {
		storage,
		key = "omnifront-cache",
		maxAge = DAY,
		buster = "",
		throttle = 1000,
		shouldDehydrate,
		serialize = JSON.stringify,
		deserialize = JSON.parse as (raw: string) => PersistedCache,
		onError,
	} = options
	const scheduler = client.scheduler
	const report = (error: unknown): void => onError?.(error)

	let stopped = false
	let timer: ReturnType<typeof scheduler.setTimeout> | undefined
	let stopFocus: (() => void) | undefined
	let written: string | undefined // fingerprint of the last cache we wrote or loaded

	const snapshot = (): DehydratedState => dehydrate(client, shouldDehydrate ? { shouldDehydrate } : {})
	// Cheap change detection: no serialising unless something moved. Includes the data reference
	// so two writes in the same millisecond are still told apart.
	const seen = new WeakMap<object, number>()
	let nextId = 1
	const fingerprint = (state: DehydratedState): string =>
		state.queries
			.map((q) => {
				const data = q.data
				const id = typeof data === "object" && data !== null ? (seen.get(data) ?? (seen.set(data, nextId), nextId++)) : String(data)
				return `${hashKey(q.queryKey)}@${q.dataUpdatedAt}#${id}`
			})
			.join("|")

	async function save(): Promise<void> {
		if (stopped) return
		try {
			const state = snapshot()
			const print = fingerprint(state)
			if (print === written) return
			await storage.setItem(key, serialize({ version: 1, timestamp: scheduler.now(), buster, state }))
			written = print
		} catch (error) {
			report(error) // quota exceeded, private mode, unserialisable data: try again next tick
		}
	}

	async function restore(): Promise<boolean> {
		try {
			const raw = await storage.getItem(key)
			if (raw == null) return false
			const cache = deserialize(raw)
			if (cache.version !== 1 || cache.buster !== buster || scheduler.now() - cache.timestamp > maxAge) {
				await storage.removeItem(key)
				return false
			}
			hydrate(client, cache.state)
			written = fingerprint(cache.state) // what is stored, not what else arrived meanwhile
			return true
		} catch (error) {
			report(error)
			await Promise.resolve(storage.removeItem(key)).catch(report) // unreadable: start clean
			return false
		}
	}

	const tick = (): void => {
		timer = undefined
		void save().finally(schedule)
	}
	const schedule = (): void => {
		if (!stopped) timer = scheduler.setTimeout(tick, throttle)
	}

	const restored = restore().then((found) => {
		if (!stopped) {
			schedule()
			// A hidden tab may never get another timer tick: write before it goes away.
			stopFocus = focusManager.subscribe(() => {
				if (!focusManager.getSnapshot()) void save()
			})
		}
		return found
	})

	const stop = (): void => {
		stopped = true
		if (timer !== undefined) scheduler.clearTimeout(timer)
		timer = undefined
		stopFocus?.()
		stopFocus = undefined
	}

	return {
		restored,
		persist: async () => {
			await restored
			await save()
		},
		clear: async () => {
			stop()
			await restored
			try {
				await storage.removeItem(key)
			} catch (error) {
				report(error)
			}
		},
		stop,
	}
}
