import { ICON_PATHS, createAccordion, createAccordionGroup, type AccordionGroup as GroupMachine, type AccordionParts } from "@omnifront/ui"
import { createContext, forwardRef, useContext, useId, useMemo, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

const AccordionContext = createContext<AccordionParts | null>(null)
/** The group an Accordion sits in, with the list of open panels (so a change re-renders the members). */
const GroupContext = createContext<{ machine: GroupMachine; open: readonly string[] } | null>(null)

export interface AccordionProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
	/** Controlled. Leave out to let it keep its own state. */
	expanded?: boolean | undefined
	defaultExpanded?: boolean | undefined
	/** Inside an AccordionGroup: the key that tells the group which panel this is. The group then decides `expanded`. */
	value?: string | undefined
	disabled?: boolean | undefined
	/** `(event, expanded)`, when the user opens or closes it. */
	onChange?: ((event: Event | undefined, expanded: boolean) => void) | undefined
}

/**
 * One collapsible section: an AccordionSummary (the button) and AccordionDetails (the content).
 * Stack several in a div; to open one at a time, control `expanded` yourself.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(rawProps, ref) {
	const { expanded: expandedProp, defaultExpanded, value, disabled, onChange, className, children, ...rest } = useDefaultProps("OmniAccordion", rawProps)
	const group = useContext(GroupContext)
	const grouped = group !== null && value !== undefined
	const expanded = grouped ? group.open.includes(value) : expandedProp
	const id = useId()
	const [machine] = useMachine(() => createAccordion({ id, defaultExpanded }), {
		id,
		expanded,
		disabled,
		onExpandedChange: (next: boolean, event?: Event) => {
			if (grouped) group.machine.set(value, next, event)
			onChange?.(event, next)
		},
	})
	const parts = machine.connect()
	return (
		<AccordionContext.Provider value={parts}>
			<div {...mergeProps(toReactProps(parts.root), { ...rest, className: cx("omni-accordion", className) })} ref={ref}>
				{children}
			</div>
		</AccordionContext.Provider>
	)
})

export interface AccordionSummaryProps extends ComponentPropsWithoutRef<"button"> {
	/** Replaces the chevron. */
	expandIcon?: ReactNode | undefined
	/** The heading level around the button, 2 to 6. Default 3. */
	headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
}

/** The always-visible row: a `<button>` inside a heading. Clicking it opens or closes the section. */
export const AccordionSummary = forwardRef<HTMLButtonElement, AccordionSummaryProps>(function AccordionSummary({ expandIcon, headingLevel = 3, className, children, ...rest }, ref) {
	const parts = useContext(AccordionContext)
	const Heading = `h${headingLevel}` as ElementType
	return (
		<Heading className="omni-accordion__heading">
			<button {...mergeProps(parts ? toReactProps(parts.trigger) : {}, { ...rest, className: cx("omni-accordion__summary", className) })} ref={ref}>
				<span className="omni-accordion__summary-content">{children}</span>
				<span className="omni-accordion__icon" aria-hidden="true">
					{expandIcon ?? (
						<svg viewBox="0 0 24 24" focusable="false">
							<path d={ICON_PATHS.expandMore} />
						</svg>
					)}
				</span>
			</button>
		</Heading>
	)
})

/** The content that opens and closes. */
export const AccordionDetails = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function AccordionDetails({ className, children, ...rest }, ref) {
	const parts = useContext(AccordionContext)
	return (
		<div {...mergeProps(parts ? toReactProps(parts.region) : {}, { className: "omni-accordion__region" })}>
			<div className="omni-accordion__region-inner">
				<div {...mergeProps({}, { ...rest, className: cx("omni-accordion__details", className) })} ref={ref}>
					{children}
				</div>
			</div>
		</div>
	)
})

export interface AccordionGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue"> {
	/** The open panel's `value` (a list with `multiple`). Controlled; leave out to let the group keep it. */
	value?: string | string[] | null | undefined
	defaultValue?: string | string[] | null | undefined
	/** Let several stay open. Default: opening one closes the others. */
	multiple?: boolean | undefined
	onChange?: ((event: Event | undefined, value: string | string[] | null) => void) | undefined
}

/** A stack of Accordions of which one stays open (or several, with `multiple`). Give each Accordion a `value`. */
export const AccordionGroup = forwardRef<HTMLDivElement, AccordionGroupProps>(function AccordionGroup({ value, defaultValue, multiple, onChange, ...rest }, ref) {
	const [machine, state] = useMachine(() => createAccordionGroup({ defaultValue, multiple }), {
		value,
		multiple,
		onValueChange: (next: string | string[] | null, event?: Event) => onChange?.(event, next),
	})
	const context = useMemo(() => ({ machine, open: state.open }), [machine, state.open])
	return (
		<GroupContext.Provider value={context}>
			<div {...rest} ref={ref} />
		</GroupContext.Provider>
	)
})
