import type { ToggleGroup, ToggleGroupState } from "@omnifront/ui"
import type { InjectionKey, Ref } from "vue"

export interface ToggleGroupContext {
	group: ToggleGroup
	state: Readonly<Ref<ToggleGroupState>>
	size: Readonly<Ref<"small" | "medium" | "large" | undefined>>
	color: Readonly<Ref<"primary" | "secondary" | "success" | "info" | "warning" | "error" | undefined>>
}
export const TOGGLE_GROUP: InjectionKey<ToggleGroupContext> = Symbol("omnifront-toggle-group")
