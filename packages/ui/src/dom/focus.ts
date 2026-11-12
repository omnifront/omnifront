const TABBABLE =
	'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]'

/** Elements inside `root` that Tab can reach, in DOM order. */
export function getTabbables(root: ParentNode): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => {
		if (el.tabIndex < 0) return false
		if ("disabled" in el && (el as HTMLButtonElement).disabled) return false
		if (el.closest("[hidden], [inert]")) return false
		return el.getAttribute("aria-hidden") !== "true"
	})
}

/** Move focus into `root`: `[autofocus]` first, else the first tabbable, else `root` itself. */
export function focusInside(root: HTMLElement): void {
	const target = root.querySelector<HTMLElement>("[autofocus], [data-autofocus]") ?? getTabbables(root)[0] ?? root
	target.focus({ preventScroll: true })
}

/**
 * Keep keyboard focus inside `root` while `isActive()` is true: Tab wraps, and focus that lands
 * outside (a click on the page, a script) is pulled back. Returns the cleanup.
 */
export function trapFocus(root: HTMLElement, isActive: () => boolean = () => true): () => void {
	const doc = root.ownerDocument
	const onKeydown = (event: KeyboardEvent): void => {
		if (event.key !== "Tab" || !isActive()) return
		const items = getTabbables(root)
		if (items.length === 0) {
			event.preventDefault()
			root.focus({ preventScroll: true })
			return
		}
		const first = items[0] as HTMLElement
		const last = items[items.length - 1] as HTMLElement
		const current = doc.activeElement
		if (event.shiftKey && (current === first || current === root)) {
			event.preventDefault()
			last.focus()
		} else if (!event.shiftKey && current === last) {
			event.preventDefault()
			first.focus()
		}
	}
	const onFocusin = (event: FocusEvent): void => {
		if (!isActive()) return
		const target = event.target as Node | null
		if (target && !root.contains(target) && !(target as Element).closest?.("[data-omni-portal]")) focusInside(root)
	}
	root.addEventListener("keydown", onKeydown)
	doc.addEventListener("focusin", onFocusin)
	return () => {
		root.removeEventListener("keydown", onKeydown)
		doc.removeEventListener("focusin", onFocusin)
	}
}
