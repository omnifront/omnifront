import type { AccordionGroup, AccordionParts } from "@omnifront/ui"
import type { ComputedRef, InjectionKey } from "vue"

export const ACCORDION: InjectionKey<ComputedRef<AccordionParts>> = Symbol("omni-accordion")
/** The group an Accordion sits in, and the list of open panels (so members re-render when it changes). */
export const ACCORDION_GROUP: InjectionKey<{ machine: AccordionGroup; open: ComputedRef<readonly string[]> }> = Symbol("omni-accordion-group")
