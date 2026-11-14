export interface PortalRoot {
	element: HTMLElement
	remove(): void
}

/**
 * A `<div data-omni-portal>` at the end of `<body>` for overlays to render into. Copy the theme
 * attributes onto it (`attributes`) so the variables of a nested ThemeProvider still reach the overlay.
 * Browser only: call it after mount, never while rendering on the server.
 */
export function createPortalRoot(attributes: Record<string, string | undefined> = {}, doc: Document = document): PortalRoot {
	const element = doc.createElement("div")
	element.setAttribute("data-omni-portal", "")
	for (const [k, v] of Object.entries(attributes)) if (v !== undefined) element.setAttribute(k, v)
	doc.body.appendChild(element)
	return { element, remove: () => element.remove() }
}
