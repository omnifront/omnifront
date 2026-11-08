const isPlain = (value: unknown): value is Record<string, unknown> => {
	if (typeof value !== "object" || value === null) return false
	const proto = Object.getPrototypeOf(value) as unknown
	return proto === Object.prototype || proto === null
}

/**
 * Keep as much of the previous data as possible: parts of `next` that are deeply equal to the same
 * part of `previous` are replaced by the previous reference. A refetch that returns the same list
 * with one item changed then keeps the identity of every other item (and of the list if nothing
 * changed), so memoized components and selectors do not re-run.
 *
 * Works on JSON-like data (plain objects and arrays); anything else is compared by reference.
 * Opt in with `new QueryClient({ structuralSharing: replaceEqualDeep })`.
 */
export function replaceEqualDeep<T>(previous: unknown, next: T): T {
	if (previous === next) return previous as T
	const bothArrays = Array.isArray(previous) && Array.isArray(next)
	if (!bothArrays && !(isPlain(previous) && isPlain(next))) return next

	const prev = previous as Record<string, unknown>
	const incoming = next as Record<string, unknown>
	const keys = bothArrays ? Array.from({ length: (next as unknown[]).length }, (_, i) => String(i)) : Object.keys(incoming)
	const copy: Record<string, unknown> = bothArrays ? ([] as unknown as Record<string, unknown>) : {}
	let equalItems = 0
	for (const key of keys) {
		copy[key] = replaceEqualDeep(prev[key], incoming[key])
		if (copy[key] === prev[key] && (prev[key] !== undefined || key in prev)) equalItems++
	}
	const sameSize = keys.length === (bothArrays ? (previous as unknown[]).length : Object.keys(prev).length)
	return (sameSize && equalItems === keys.length ? previous : copy) as T
}
