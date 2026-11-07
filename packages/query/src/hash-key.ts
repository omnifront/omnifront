export type QueryKey = readonly unknown[]

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
