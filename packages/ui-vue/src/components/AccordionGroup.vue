<script setup lang="ts">
import { createAccordionGroup } from "@omnifront/ui"
import { computed, provide } from "vue"
import { useMachine } from "../internal"
import { ACCORDION_GROUP } from "./accordion-context"

/** A stack of Accordions of which one stays open (or several, with `multiple`). Give each Accordion a `value`. `value` is the open panel's value (a list with `multiple`); leave it out to let the group keep it. */
defineOptions({ name: "OmniAccordionGroup" })
const raw = withDefaults(
	defineProps<{
		value?: string | string[] | null | undefined
		defaultValue?: string | string[] | null | undefined
		/** Let several stay open. Default: opening one closes the others. */
		multiple?: boolean | undefined
	}>(),
	{ multiple: undefined },
)
const emit = defineEmits<{ change: [event: Event | undefined, value: string | string[] | null]; "update:value": [value: string | string[] | null] }>()
const { machine, state } = useMachine(
	() => createAccordionGroup({ defaultValue: raw.defaultValue, multiple: raw.multiple }),
	() => ({
		value: raw.value,
		multiple: raw.multiple,
		onValueChange: (value: string | string[] | null, event?: Event) => {
			emit("change", event, value)
			emit("update:value", value)
		},
	}),
)
provide(ACCORDION_GROUP, { machine, open: computed(() => state.value.open) })
</script>

<template>
	<div><slot /></div>
</template>
