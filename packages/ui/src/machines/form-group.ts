import { part, type Part } from "./machine"

export interface FormGroupOptions {
	/** Base for the ids of the label (legend) and the helper text. */
	id: string
	/** `group` (default) or `radiogroup`. */
	role?: "group" | "radiogroup" | undefined
	hasLabel?: boolean | undefined
	hasHelper?: boolean | undefined
	error?: boolean | undefined
	disabled?: boolean | undefined
	/** Lay the items out in a row. */
	row?: boolean | undefined
}

/**
 * Attributes for a group of related controls: a `<fieldset>` with a `<legend>` label and helper
 * text. No state of its own, so it is a function (like `buttonPart`), not a machine.
 */
export function formGroupParts(options: FormGroupOptions): { group: Part; label: Part; items: Part; helper: Part } {
	const { id } = options
	return {
		group: part({
			role: options.role === "radiogroup" ? "radiogroup" : undefined,
			"aria-labelledby": options.hasLabel ? `${id}-label` : undefined,
			"aria-describedby": options.hasHelper ? `${id}-helper` : undefined,
			"aria-invalid": options.error ? "true" : undefined,
			disabled: options.disabled || undefined,
			"data-error": options.error ? "" : undefined,
			"data-disabled": options.disabled ? "" : undefined,
		}),
		label: part({ id: `${id}-label` }),
		items: part({ "data-row": options.row ? "" : undefined }),
		helper: part({ id: `${id}-helper`, "data-error": options.error ? "" : undefined }),
	}
}
