import { ICON_PATHS, stepPart, stepState, stepperPart, type StepperOptions } from "@omnifront/ui"
import { Children, createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react"
import { mergeProps, toReactProps } from "./internal"
import { useDefaultProps } from "./theme"

const StepContext = createContext<{ index: number; activeStep: number; count: number; orientation: "horizontal" | "vertical" }>({ index: 0, activeStep: 0, count: 1, orientation: "horizontal" })

export interface StepperProps extends ComponentPropsWithoutRef<"ol">, StepperOptions {
	/** The current step, 0-based. Steps before it are completed. */
	activeStep?: number | undefined
}

/** A list of steps toward a goal. Put Step elements inside; their order gives each its number. */
export const Stepper = forwardRef<HTMLOListElement, StepperProps>(function Stepper(rawProps, ref) {
	const { activeStep = 0, orientation = "horizontal", alternativeLabel, nonLinear, className, children, ...rest } = useDefaultProps("OmniStepper", rawProps)
	const steps = Children.toArray(children)
	return (
		<ol {...mergeProps(toReactProps(stepperPart({ orientation, alternativeLabel, nonLinear })), { ...rest, className })} ref={ref}>
			{steps.map((step, index) => (
				<StepContext.Provider key={index} value={{ index, activeStep, count: steps.length, orientation }}>
					{step}
				</StepContext.Provider>
			))}
		</ol>
	)
})

export interface StepProps extends Omit<ComponentPropsWithoutRef<"li">, "onClick"> {
	label?: ReactNode | undefined
	/** A second line under the label ("Optional"). */
	optional?: ReactNode | undefined
	/** Override the state the stepper's `activeStep` gives. */
	completed?: boolean | undefined
	active?: boolean | undefined
	disabled?: boolean | undefined
	error?: boolean | undefined
	/** Replaces the number or tick. */
	icon?: ReactNode | undefined
	/** Makes the step's header a button (for a non-linear stepper). */
	onClick?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined
	/** In a vertical stepper: content shown under the label while this step is active. */
	children?: ReactNode | undefined
}

/** One step: a number (or tick, or error mark) and a label. */
export const Step = forwardRef<HTMLLIElement, StepProps>(function Step(rawProps, ref) {
	const { label, optional, completed, active, disabled, error, icon, onClick, className, children, ...rest } = useDefaultProps("OmniStep", rawProps)
	const ctx = useContext(StepContext)
	const options = { index: ctx.index, activeStep: ctx.activeStep, count: ctx.count, completed, active, disabled, error }
	const s = stepState(options)
	const glyph = icon ?? (s.error ? <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={ICON_PATHS.warning} /></svg> : s.completed ? <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={ICON_PATHS.check} /></svg> : ctx.index + 1)
	const header = (
		<>
			<span className="omni-step__icon">{glyph}</span>
			<span>
				<span className="omni-step__label">{label}</span>
				{optional && <span className="omni-step__optional">{optional}</span>}
			</span>
		</>
	)
	return (
		<li {...mergeProps(toReactProps(stepPart(options)), { ...rest, "aria-current": s.active ? "step" : undefined, className })} ref={ref}>
			{onClick ? (
				<button type="button" className="omni-step__header" disabled={disabled} onClick={onClick}>
					{header}
				</button>
			) : (
				<span className="omni-step__header">{header}</span>
			)}
			{ctx.orientation === "vertical" && <div className="omni-step__content">{s.active ? children : null}</div>}
		</li>
	)
})
