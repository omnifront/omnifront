export interface Layer {
	/** True while this is the top-most open layer: only that one reacts to Escape and Tab. */
	isTop(): boolean
	remove(): void
}

const stack: object[] = []

/** Register an open overlay (dialog, menu). Overlays opened later are above earlier ones. */
export function pushLayer(): Layer {
	const token = {}
	stack.push(token)
	return {
		isTop: () => stack[stack.length - 1] === token,
		remove() {
			const i = stack.indexOf(token)
			if (i >= 0) stack.splice(i, 1)
		},
	}
}
