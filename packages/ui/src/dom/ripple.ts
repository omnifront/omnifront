/**
 * Material touch ripple. Call once per element after mount; it adds a `<span class="omni-ripple">`
 * under the pointer on press and removes it when the animation ends. Respects
 * `prefers-reduced-motion` through the CSS. Returns the cleanup.
 */
export function attachRipple(element: HTMLElement, options: { centered?: boolean } = {}): () => void {
	const onPointerdown = (event: PointerEvent): void => {
		if (event.button !== 0 || element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") return
		const rect = element.getBoundingClientRect()
		const size = Math.max(rect.width, rect.height) * 2
		const x = options.centered || (event.clientX === 0 && event.clientY === 0) ? rect.width / 2 : event.clientX - rect.left
		const y = options.centered || (event.clientX === 0 && event.clientY === 0) ? rect.height / 2 : event.clientY - rect.top
		const ripple = element.ownerDocument.createElement("span")
		ripple.className = "omni-ripple"
		ripple.setAttribute("aria-hidden", "true")
		ripple.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`
		element.appendChild(ripple)
		const done = (): void => ripple.remove()
		ripple.addEventListener("animationend", done, { once: true })
		// If animations are off (reduced motion, tests) `animationend` never fires: clean up anyway.
		setTimeout(done, 1000)
	}
	element.addEventListener("pointerdown", onPointerdown)
	return () => element.removeEventListener("pointerdown", onPointerdown)
}
