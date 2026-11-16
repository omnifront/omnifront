import type { SpeedDialParts } from "@omnifront/ui"
import type { ComputedRef, InjectionKey } from "vue"

export const SPEED_DIAL: InjectionKey<ComputedRef<SpeedDialParts>> = Symbol("omni-speed-dial")
