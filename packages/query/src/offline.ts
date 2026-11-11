import { hashKey, type QueryKey } from "./hash-key"
import type { MutationOptions } from "./mutation"
import { trackMutation, type Tracked } from "./mutation-registry"
import { whenOnline } from "./online"
import type { QueryClient } from "./query-client"
import { noop } from "./resolve"

/** A mutation that waited (for the network or for its turn in a scope) in a form that survives JSON. */
export interface DehydratedMutation {
	mutationKey: QueryKey
	variables: unknown
	/** What `onMutate` returned (typically a snapshot to roll back to). */
	context: unknown
	scope?: { id: string } | undefined
	meta?: Record<string, unknown> | undefined
	/** Scheduler time of the call; restored mutations are started in this order. */
	submittedAt: number
}

// One call of a mutation, from the moment its `onMutate` is done: a Mutation (one per hook) can have
// several in flight, so the runs are kept here, not read from its state.
interface Run {
	mutationKey: QueryKey | undefined
	variables: unknown
	context: unknown
	scope: { id: string } | undefined
	meta: Record<string, unknown> | undefined
	submittedAt: number
	/** Not sent yet: waiting for its turn in a scope, or for the network. */
	waiting: boolean
	settled: Promise<void>
}
const runsOf = new WeakMap<QueryClient, Set<Run>>()

type Wrap = NonNullable<NonNullable<NonNullable<ReturnType<QueryClient["getDefaultOptions"]>["mutations"]>["wrap"]>>

/**
 * Switch on what needs the client's cooperation: mutations with the same `scope: { id }` run one
 * after another, in the order they were called (`onMutate` of a later one still runs at once, so
 * optimistic updates show immediately), and the calls that are still waiting for the network or for
 * their turn can be saved with `dehydrateMutations`. Call it once, when the client is created. It
 * installs `wrap` in the client's `defaultOptions.mutations`; a `wrap` set there already runs around it.
 */
export function enableOffline(client: QueryClient): void {
	const defaults = client.getDefaultOptions()
	const outer = defaults.mutations?.wrap
	if ((outer as { offline?: true } | undefined)?.offline) return // already on
	const tails = new Map<string, Promise<void>>() // per scope id: when the last one in line is done
	const runs = new Set<Run>()
	runsOf.set(client, runs)
	const wrap: Wrap & { offline?: true } = async (attempts, mutation, variables, context, pause) => {
		const { mutationKey, scope, meta, networkMode } = mutation.options
		const id = scope?.id
		let finish = noop
		const run: Run = {
			mutationKey,
			variables,
			context,
			scope,
			meta,
			submittedAt: client.scheduler.now(),
			waiting: true,
			settled: new Promise<void>((resolve) => (finish = resolve)),
		}
		runs.add(run)
		let leave = noop
		let behind: Promise<void> | undefined
		if (id !== undefined) {
			// Take a place in line synchronously, so the order of calls is the order of turns.
			behind = tails.get(id)
			const mine = new Promise<void>((resolve) => (leave = resolve))
			tails.set(id, mine)
			void mine.then(() => tails.get(id) === mine && tails.delete(id))
		}
		if (behind) pause(true) // waiting for its turn counts as paused, like waiting for the network
		await behind
		if (behind) pause(false)
		// Its turn: from here only the network can hold it back (and not at all in "always" mode).
		const stop = whenOnline(networkMode, true, () => (run.waiting = false), noop)
		try {
			return await (outer ? outer(attempts, mutation, variables, context, pause) : attempts())
		} finally {
			stop?.()
			runs.delete(run)
			finish()
			leave()
		}
	}
	wrap.offline = true
	client.setDefaultOptions({ ...defaults, mutations: { ...defaults.mutations, wrap } })
}

type Options = MutationOptions<unknown, unknown, unknown, unknown>

const defaultsOf = new WeakMap<QueryClient, Map<string, Options>>()

/**
 * What a restored mutation needs to run again: its `mutationFn` and callbacks, by `mutationKey`
 * (matched exactly). Register these before the cache is restored; a mutation cannot be sent
 * without its function. Share the object with the `useMutation` that starts it.
 */
export function setMutationDefaults(client: QueryClient, mutationKey: QueryKey, options: Options): void {
	let map = defaultsOf.get(client)
	if (!map) defaultsOf.set(client, (map = new Map()))
	map.set(hashKey(mutationKey), options)
}

export function getMutationDefaults(client: QueryClient, mutationKey: QueryKey): Options | undefined {
	return defaultsOf.get(client)?.get(hashKey(mutationKey))
}

/**
 * The calls that have not been sent yet, because the network is down or they wait for their turn in
 * a scope, and whose mutation has a `mutationKey` (restoring needs it). One that is already running
 * is left out: it may have reached the server, and sending it twice is worse than losing it. Every
 * call counts, also several from one `useMutation`. Oldest first. `variables` and `context` must be
 * JSON-safe. Needs `enableOffline(client)`; `persistQueryClient` calls it.
 */
export function dehydrateMutations(client: QueryClient): DehydratedMutation[] {
	const out: DehydratedMutation[] = []
	for (const { waiting, mutationKey, variables, context, scope, meta, submittedAt } of runsOf.get(client) ?? []) {
		if (waiting && mutationKey) out.push({ mutationKey, variables, context, scope, meta, submittedAt })
	}
	return out.sort((a, b) => a.submittedAt - b.submittedAt)
}

/** What `hydrateMutations` needs to build a mutation: the class lives in the main entry, not here. */
export type CreateMutation = (options: Options) => Tracked & { mutate(variables: unknown): void }

/**
 * Start the saved mutations again, oldest first, without running `onMutate`: its saved `context` is
 * given back instead, so a rollback still has what it needs. Each one waits for the network (and for
 * its scope) like a new call, and counts towards `useIsMutating` until it settles.
 *
 *   hydrateMutations(client, saved, (options) => new Mutation(options, client))
 *
 * Returns the ones that could not be restored because no defaults are registered for their key.
 */
export function hydrateMutations(client: QueryClient, saved: readonly DehydratedMutation[], create: CreateMutation): DehydratedMutation[] {
	const skipped: DehydratedMutation[] = []
	for (const { mutationKey, variables, context, scope, meta } of [...saved].sort((a, b) => a.submittedAt - b.submittedAt)) {
		const defaults = getMutationDefaults(client, mutationKey)
		if (!defaults) {
			skipped.push({ mutationKey, variables, context, scope, meta, submittedAt: 0 })
			continue
		}
		const mutation = create({ ...defaults, mutationKey, scope, meta, onMutate: () => context })
		const untrack = trackMutation(client, mutation)
		mutation.mutate(variables)
		untrack() // it is pending now, so it keeps counting until it settles
	}
	return skipped
}

/**
 * Resolves when every call that is waiting (for the network, or for its turn in a scope) has
 * settled. They continue by themselves when the network is back; this only lets you wait for that,
 * for example to show "synced".
 */
export function resumePausedMutations(client: QueryClient): Promise<void> {
	return Promise.all([...(runsOf.get(client) ?? [])].filter((run) => run.waiting).map((run) => run.settled)).then(noop)
}
