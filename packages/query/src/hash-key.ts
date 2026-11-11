export type QueryKey = readonly unknown[]

declare const dataTag: unique symbol
/**
 * A query key that remembers the type of the data stored under it (types only; nothing exists at
 * runtime). `queryOptions` from `@omnifront/query/options` produces these.
 */
export type DataTag<TKey extends QueryKey, TData> = TKey & { readonly [dataTag]: TData }
/** A key without a data type attached; a tagged key must go through the typed overload. */
export type UntaggedKey<TKey extends QueryKey> = TKey extends { readonly [dataTag]: unknown } ? never : TKey

function sortKeys(_: string, value: unknown): unknown {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return value
	const src = value as Record<string, unknown>
	const sorted: Record<string, unknown> = {}
	for (const k of Object.keys(src).sort()) sorted[k] = src[k]
	return sorted
}

/** Stable string for a query key: object key order does not matter. */
export function hashKey(key: QueryKey): string {
	return JSON.stringify(key, sortKeys)
}

/** True if `key` starts with / contains everything in `filter` (arrays by position, objects as subsets). */
export function matchesKey(key: QueryKey, filter: QueryKey): boolean {
	return partialMatch(key, filter)
}

function partialMatch(a: unknown, b: unknown): boolean {
	if (a === b) return true
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false
	const left = a as Record<string, unknown>
	const right = b as Record<string, unknown>
	return Object.keys(right).every((k) => partialMatch(left[k], right[k]))
}
