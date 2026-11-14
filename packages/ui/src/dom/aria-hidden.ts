/**
 * Hide everything except `keep` from assistive technology while a modal is open: every other child
 * of `<body>` gets `aria-hidden="true"`. Returns the cleanup, which restores each element's old value.
 */
export function hideOthers(keep: HTMLElement): () => void {
	const body = keep.ownerDocument.body
	let top: HTMLElement = keep
	while (top.parentElement && top.parentElement !== body) top = top.parentElement
	const changed: Array<[HTMLElement, string | null]> = []
	for (const el of Array.from(body.children) as HTMLElement[]) {
		if (el === top || el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.hasAttribute("data-omni-keep")) continue
		changed.push([el, el.getAttribute("aria-hidden")])
		el.setAttribute("aria-hidden", "true")
	}
	return () => {
		for (const [el, old] of changed) {
			if (old === null) el.removeAttribute("aria-hidden")
			else el.setAttribute("aria-hidden", old)
		}
	}
}
