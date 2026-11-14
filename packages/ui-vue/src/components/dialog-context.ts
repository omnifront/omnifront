import type { DialogParts } from "@omnifront/ui"
import type { ComputedRef, InjectionKey } from "vue"

export const DIALOG: InjectionKey<ComputedRef<DialogParts>> = Symbol("omnifront-dialog")
