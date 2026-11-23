import type { ComputedRef, InjectionKey } from "vue"

export interface BottomNavigationContext {
	value: ComputedRef<string | number | undefined>
	showLabels: ComputedRef<boolean>
	select: (event: MouseEvent, value: string | number) => void
}

export const BOTTOM_NAVIGATION: InjectionKey<BottomNavigationContext> = Symbol("omni-bottom-navigation")
