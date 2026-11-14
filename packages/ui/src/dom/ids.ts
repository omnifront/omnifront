/**
 * A counter-based id source for places where the framework has none (Angular, Vue before 3.5).
 * Ids are stable per generator, so create one per app (or per server request) and keep it.
 */
export function createIdGenerator(prefix = "omni"): () => string {
	let next = 0
	return () => `${prefix}-${++next}`
}
