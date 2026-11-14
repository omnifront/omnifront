export interface AutosizeOptions {
	/** Fewest rows to show. Default 1. */
	minRows?: number | undefined
	/** Most rows before it scrolls. Default: no limit. */
	maxRows?: number | undefined
}

/**
 * Make a `<textarea>` grow and shrink with its text, between `minRows` and `maxRows`. Call `update()`
 * after the value changes (typing, or a value set from code); it also follows the element's width
 * (wrapping changes with it) where `ResizeObserver` exists. Returns the cleanup. Browser only.
 */
export function attachAutosize(
	textarea: HTMLTextAreaElement,
	options: () => AutosizeOptions = () => ({}),
): { update(): void; destroy(): void } {
	const view = textarea.ownerDocument.defaultView
	const update = (): void => {
		const { minRows = 1, maxRows } = options()
		const style = view?.getComputedStyle(textarea)
		if (!style) return
		const line = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5 || 0
		const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
		const border = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0)
		// Measure the text at its natural height.
		textarea.style.height = "auto"
		const content = textarea.scrollHeight - padding
		const min = line * minRows
		const max = maxRows === undefined ? Infinity : line * maxRows
		const height = Math.min(max, Math.max(min, content))
		const box = style.boxSizing === "border-box" ? padding + border : 0
		textarea.style.height = `${height + box}px`
		textarea.style.overflowY = content > max ? "auto" : "hidden"
	}
	update()
	const RO = view?.ResizeObserver
	const observer = RO ? new RO(update) : undefined
	observer?.observe(textarea)
	return {
		update,
		destroy() {
			observer?.disconnect()
			textarea.style.height = ""
			textarea.style.overflowY = ""
		},
	}
}
