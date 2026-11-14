import type { Tabs } from "@omnifront/ui"
import type { InjectionKey, Ref } from "vue"

export interface TabsContext {
	tabs: Tabs
	selected: Ref<string | undefined>
	orientation: Ref<"horizontal" | "vertical">
	/** Re-read the machine's parts when this changes. */
	version: Ref<unknown>
}
export const TABS: InjectionKey<TabsContext> = Symbol("omnifront-tabs")
