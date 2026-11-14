import type { RadioGroup, RadioGroupState } from "@omnifront/ui"
import type { InjectionKey, Ref } from "vue"

export interface RadioGroupContext {
	group: RadioGroup
	state: Readonly<Ref<RadioGroupState>>
}
export const RADIO_GROUP: InjectionKey<RadioGroupContext> = Symbol("omnifront-radio-group")
