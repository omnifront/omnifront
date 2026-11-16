import { displayPart } from "./display"
import { part, type Part } from "./machines/machine"

/**
 * Wave 3 ("feedback and navigation"): pieces with no state of their own. Like `display.ts`, each one is
 * a class plus `data-*` attributes that the matching CSS reads, so all three frameworks draw the same DOM.
 */

export type Severity = "error" | "warning" | "info" | "success"

export interface AlertOptions {
	/** Default `success`, like MUI. */
	severity?: Severity | undefined
	variant?: "standard" | "filled" | "outlined" | undefined
}

/**
 * Attributes for an Alert. `error` and `warning` interrupt a screen reader (`role="alert"`); `info` and
 * `success` wait their turn (`role="status"`), so a passing note does not cut off what is being read.
 */
export function alertPart(options: AlertOptions = {}): Part {
	const { severity = "success", variant = "standard" } = options
	return displayPart("omni-alert", { severity, variant }, { role: severity === "error" || severity === "warning" ? "alert" : "status" })
}

export type ProgressColor = "primary" | "secondary" | "error" | "info" | "success" | "warning" | "inherit"

export interface CircularProgressOptions {
	/** 0 to 100. Leave out for an indeterminate spinner. */
	value?: number | undefined
	/** Diameter in px (a number) or any CSS length. Default 40. */
	size?: number | string | undefined
	/** Stroke width, on the 44-unit grid. Default 3.6. */
	thickness?: number | undefined
	color?: ProgressColor | undefined
}

export interface CircularProgressParts {
	root: Part
	svg: Part
	circle: Part
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))
const lengthOf = (v: number | string): string => (typeof v === "number" ? `${v}px` : v)

/** Attributes for a CircularProgress: `role="progressbar"` (a name must come from `aria-label` or `aria-labelledby`). */
export function circularProgressParts(options: CircularProgressOptions = {}): CircularProgressParts {
	const { value, size = 40, thickness = 3.6, color = "primary" } = options
	const determinate = value !== undefined
	const r = (44 - thickness) / 2
	const circumference = 2 * Math.PI * r
	const v = determinate ? clamp(value, 0, 100) : 0
	return {
		root: displayPart(
			"omni-circular-progress",
			{ variant: determinate ? "determinate" : "indeterminate", color },
			{
				role: "progressbar",
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-valuenow": determinate ? Math.round(v) : undefined,
				style: `--_size: ${lengthOf(size)}`,
			},
		),
		svg: part({ viewBox: "22 22 44 44", focusable: "false", "aria-hidden": "true", class: "omni-circular-progress__svg" }),
		circle: part({
			class: "omni-circular-progress__circle",
			cx: 44,
			cy: 44,
			r,
			fill: "none",
			"stroke-width": thickness,
			style: determinate ? `stroke-dasharray: ${circumference.toFixed(3)}px; stroke-dashoffset: ${(((100 - v) / 100) * circumference).toFixed(3)}px` : undefined,
		}),
	}
}

export interface LinearProgressOptions {
	variant?: "determinate" | "indeterminate" | "buffer" | undefined
	/** 0 to 100 (determinate and buffer). */
	value?: number | undefined
	/** 0 to 100 (buffer): how far the loaded part reaches. */
	valueBuffer?: number | undefined
	color?: ProgressColor | undefined
}

export interface LinearProgressParts {
	root: Part
	bar1: Part
	bar2: Part
}

/** Attributes for a LinearProgress. Percentages go in `--_p`; the CSS turns them into a (direction-aware) offset. */
export function linearProgressParts(options: LinearProgressOptions = {}): LinearProgressParts {
	const { variant = "indeterminate", color = "primary" } = options
	const valued = variant === "determinate" || variant === "buffer"
	const v = clamp(options.value ?? 0, 0, 100)
	return {
		root: displayPart(
			"omni-linear-progress",
			{ variant, color },
			{ role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": valued ? Math.round(v) : undefined },
		),
		bar1: part({ class: "omni-linear-progress__bar omni-linear-progress__bar1", style: valued ? `--_p: ${v}` : undefined }),
		bar2: part({
			class: "omni-linear-progress__bar omni-linear-progress__bar2",
			style: variant === "buffer" ? `--_p: ${clamp(options.valueBuffer ?? 0, 0, 100)}` : undefined,
		}),
	}
}

export interface SkeletonOptions {
	variant?: "text" | "circular" | "rectangular" | "rounded" | undefined
	animation?: "pulse" | "wave" | false | undefined
	width?: number | string | undefined
	height?: number | string | undefined
}

/** Attributes for a Skeleton: a grey placeholder. Decorative (`aria-hidden`); mark the busy region with `aria-busy` on its parent. */
export function skeletonPart(options: SkeletonOptions = {}): Part {
	const { variant = "text", animation = "pulse", width, height } = options
	const style = [width !== undefined ? `--_w: ${lengthOf(width)}` : "", height !== undefined ? `--_h: ${lengthOf(height)}` : ""].filter(Boolean).join("; ")
	return displayPart("omni-skeleton", { variant, animation: animation === false ? "none" : animation }, { "aria-hidden": "true", style: style || undefined })
}

export interface LinkOptions {
	underline?: "always" | "hover" | "none" | undefined
	color?: "primary" | "secondary" | "error" | "info" | "success" | "warning" | "inherit" | "text.primary" | "text.secondary" | undefined
}

/** Attributes for a Link: a native `<a>` coloured like a link. */
export function linkPart(options: LinkOptions = {}): Part {
	const { underline = "always", color = "primary" } = options
	return displayPart("omni-link", { underline, color: color.replace(".", "-") })
}

export interface BreadcrumbsOptions {
	/** How many items fit before the middle collapses. Default 8. */
	maxItems?: number | undefined
	itemsBeforeCollapse?: number | undefined
	itemsAfterCollapse?: number | undefined
	/** Show every item (the collapse button was pressed). */
	expanded?: boolean | undefined
}

/**
 * Which of `count` crumbs to draw: an index, or `"ellipsis"` once where the middle is folded away.
 * Nothing folds when it would hide a single item (the ellipsis would be as big as what it hides).
 */
export function breadcrumbItems(count: number, options: BreadcrumbsOptions = {}): Array<number | "ellipsis"> {
	const { maxItems = 8, itemsBeforeCollapse = 1, itemsAfterCollapse = 1, expanded } = options
	const all = Array.from({ length: count }, (_, i) => i)
	if (expanded || count <= maxItems || itemsBeforeCollapse + itemsAfterCollapse >= count - 1) return all
	return [...all.slice(0, itemsBeforeCollapse), "ellipsis", ...all.slice(count - itemsAfterCollapse)]
}

/** Attributes for the `<nav>` of Breadcrumbs. */
export function breadcrumbsPart(label = "breadcrumb"): Part {
	return displayPart("omni-breadcrumbs", {}, { "aria-label": label })
}

export interface StepOptions {
	/** This step's position (0-based) and the stepper's current one. */
	index: number
	activeStep: number
	/** Total steps, to know the last one (it has no connector). */
	count?: number | undefined
	/** Force a state. By default a step is completed when it is before the active one. */
	completed?: boolean | undefined
	active?: boolean | undefined
	disabled?: boolean | undefined
	error?: boolean | undefined
}

export interface StepState {
	active: boolean
	completed: boolean
	disabled: boolean
	error: boolean
}

export function stepState(o: StepOptions): StepState {
	const active = o.active ?? o.index === o.activeStep
	const completed = o.completed ?? o.index < o.activeStep
	return { active, completed: completed && !active, disabled: o.disabled === true, error: o.error === true }
}

/** Attributes for one `<li>` of a Stepper; the connector is drawn by CSS between neighbours. */
export function stepPart(o: StepOptions): Part {
	const s = stepState(o)
	const state = s.error ? "error" : s.active ? "active" : s.completed ? "completed" : "pending"
	return displayPart("omni-step", { state, disabled: s.disabled, last: o.count !== undefined && o.index === o.count - 1 })
}

export interface StepperOptions {
	orientation?: "horizontal" | "vertical" | undefined
	/** Put the label under the icon, with the connector between icons. */
	alternativeLabel?: boolean | undefined
	/** Steps can be visited in any order: each step with a click handler is a button. */
	nonLinear?: boolean | undefined
}

/** Attributes for the `<ol>` of a Stepper. */
export function stepperPart(o: StepperOptions = {}): Part {
	return displayPart("omni-stepper", { orientation: o.orientation ?? "horizontal", alternativeLabel: o.alternativeLabel, nonLinear: o.nonLinear })
}

export interface BottomNavigationActionOptions {
	selected?: boolean | undefined
	showLabel?: boolean | undefined
	disabled?: boolean | undefined
}

/** Attributes for one button of a BottomNavigation. The current one is `aria-current="page"`. */
export function bottomNavigationActionPart(o: BottomNavigationActionOptions = {}): Part {
	return displayPart(
		"omni-bottom-navigation__action",
		{ selected: o.selected, showLabel: o.showLabel },
		{ type: "button", "aria-current": o.selected ? "page" : undefined, disabled: o.disabled ? true : undefined },
	)
}

export interface TablePaginationOptions {
	count: number
	/** 0-based. */
	page: number
	rowsPerPage: number
}

export interface TablePaginationState {
	/** 1-based range shown, `0` and `0` when there are no rows. */
	from: number
	to: number
	canPrevious: boolean
	canNext: boolean
	lastPage: number
	/** "1–10 of 100". */
	label: string
}

/** The numbers behind "1–10 of 100" and the previous and next buttons. `count` of -1 means unknown (no total, next is always allowed). */
export function tablePaginationState({ count, page, rowsPerPage }: TablePaginationOptions): TablePaginationState {
	const unknown = count < 0
	const from = !unknown && count === 0 ? 0 : page * rowsPerPage + 1
	const to = unknown ? (page + 1) * rowsPerPage : Math.min(count, (page + 1) * rowsPerPage)
	const lastPage = unknown ? page + 1 : Math.max(0, Math.ceil(count / rowsPerPage) - 1)
	const label = unknown ? `${from}–${to}` : `${from}–${to} of ${count}`
	return { from, to, canPrevious: page > 0, canNext: unknown || page < lastPage, lastPage, label }
}

export interface SortLabelOptions {
	active?: boolean | undefined
	direction?: "asc" | "desc" | undefined
}

/** Attributes for the button of a TableSortLabel; the header cell carries `aria-sort` itself (`sortDirection` on TableCell). */
export function sortLabelPart(o: SortLabelOptions = {}): Part {
	return displayPart("omni-table__sort", { active: o.active, direction: o.direction ?? "asc" }, { type: "button" })
}

export interface AvatarGroupState {
	/** How many avatars to draw. */
	shown: number
	/** Hidden ones, shown as "+N"; 0 means no surplus avatar. */
	surplus: number
}

/** How an AvatarGroup folds `count` avatars (or `total` when more exist than are passed) into at most `max`, the last slot being "+N". */
export function avatarGroupState(count: number, max = 5, total?: number): AvatarGroupState {
	const all = Math.max(total ?? count, count)
	const limit = Math.max(2, max)
	if (all <= limit) return { shown: count, surplus: 0 }
	const shown = Math.min(count, limit - 1)
	return { shown, surplus: all - shown }
}
