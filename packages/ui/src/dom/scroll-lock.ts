const locks = new WeakMap<Document, { count: number; overflow: string; paddingInlineEnd: string }>()

/**
 * Stop the page behind a modal from scrolling. Counted per document, so two open dialogs lock once
 * and the last one to close unlocks. The scrollbar's width is kept as padding to avoid a layout jump.
 */
export function lockScroll(doc: Document = document): () => void {
	const body = doc.body
	let lock = locks.get(doc)
	if (!lock) {
		const scrollbar = (doc.defaultView?.innerWidth ?? 0) - doc.documentElement.clientWidth
		lock = { count: 0, overflow: body.style.overflow, paddingInlineEnd: body.style.paddingInlineEnd }
		locks.set(doc, lock)
		if (scrollbar > 0) {
			const current = parseFloat(doc.defaultView?.getComputedStyle(body).paddingInlineEnd ?? "0") || 0
			body.style.paddingInlineEnd = `${current + scrollbar}px`
		}
		body.style.overflow = "hidden"
	}
	lock.count++
	let released = false
	return () => {
		if (released) return
		released = true
		const l = locks.get(doc)
		if (!l || --l.count > 0) return
		body.style.overflow = l.overflow
		body.style.paddingInlineEnd = l.paddingInlineEnd
		locks.delete(doc)
	}
}
