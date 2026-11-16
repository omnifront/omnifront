import type { AccordionParts } from "@omnifront/ui"
import type { ComputedRef, InjectionKey } from "vue"

export const ACCORDION: InjectionKey<ComputedRef<AccordionParts>> = Symbol("omni-accordion")
