import type { ButtonColor, ButtonSize, ButtonVariant } from "@omnifront/ui"
import { createContext } from "react"

/** What a ButtonGroup hands down to the Buttons inside it. An own prop on a Button still wins. */
export interface ButtonGroupDefaults {
	variant?: ButtonVariant | undefined
	color?: ButtonColor | undefined
	size?: ButtonSize | undefined
	disabled?: boolean | undefined
	disableElevation?: boolean | undefined
}

export const ButtonGroupContext = createContext<ButtonGroupDefaults | null>(null)
