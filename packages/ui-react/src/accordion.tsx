import { ICON_PATHS, createAccordion, type AccordionParts } from "@omnifront/ui"
import { createContext, forwardRef, useContext, useId, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react"
import { cx, mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

const AccordionContext = createContext<AccordionParts | null>(null)

export interface AccordionProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
	/** Controlled. Leave out to let it keep its own state. */
	expanded?: boolean | undefined
	defaultExpanded?: boolean | undefined
	disabled?: boolean | undefined
	/** `(event, expanded)`, when the user opens or closes it. */
	onChange?: ((event: Event | undefined, expanded: boolean) => void) | undefined
}

/**
 * One collapsible section: an AccordionSummary (the button) and AccordionDetails (the content).
 * Stack several in a div; to open one at a time, control `expanded` yourself.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(rawProps, ref) {
	const { expanded, defaultExpanded, disabled, onChange, className, children, ...rest } = useDefaultProps("OmniAccordion", rawProps)
	const id = useId()
	const [machine] = useMachine(() => createAccordion({ id, defaultExpanded }), {
		id,
		expanded,
		disabled,
		onExpandedChange: (next: boolean, event?: Event) => onChange?.(event, next),
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
