import type { ButtonColor, ButtonSize, ButtonVariant } from "@omnifront/ui"
import type { ComputedRef, InjectionKey } from "vue"

/** What a ButtonGroup hands down to the Buttons inside it. An own prop on a Button still wins. */
export interface ButtonGroupDefaults {
	variant?: ButtonVariant | undefined
	color?: ButtonColor | undefined
	size?: ButtonSize | undefined
	disabled?: boolean | undefined
	disableElevation?: boolean | undefined
}
export const BUTTON_GROUP: InjectionKey<ComputedRef<ButtonGroupDefaults>> = Symbol("omnifront-button-group")
