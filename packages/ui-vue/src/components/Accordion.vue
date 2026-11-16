<script setup lang="ts">
import { createAccordion } from "@omnifront/ui"
import { computed, provide } from "vue"
import { toVueProps, useMachine, useUid } from "../internal"
import { useDefaultProps } from "../theme"
import { ACCORDION } from "./accordion-context"

/**
 * One collapsible section: an AccordionSummary (the button) and AccordionDetails (the content).
 * Stack several in a div; to open one at a time, control `expanded` yourself.
 */
defineOptions({ name: "OmniAccordion" })
// `expanded` must stay `undefined` to mean "not controlled" (Vue would turn a missing boolean into false).
const raw = withDefaults(
	defineProps<{
		/** Open or closed (`v-model:expanded`). Leave it out to let it keep its own state. */
		expanded?: boolean | undefined
		defaultExpanded?: boolean | undefined
		disabled?: boolean | undefined
	}>(),
	{ expanded: undefined, defaultExpanded: undefined, disabled: undefined },
)
const emit = defineEmits<{ change: [event: Event | undefined, expanded: boolean]; "update:expanded": [expanded: boolean] }>()
const props = useDefaultProps("OmniAccordion", () => ({ ...raw }))
const id = useUid()
const { machine, state } = useMachine(
	() => createAccordion({ id, defaultExpanded: raw.defaultExpanded }),
	() => ({
		id,
		expanded: props.value.expanded,
		disabled: props.value.disabled || undefined,
		onExpandedChange: (expanded: boolean, event?: Event) => {
			emit("change", event, expanded)
			emit("update:expanded", expanded)
		},
	}),
)
const parts = computed(() => {
	void state.value
	return machine.connect()
})
provide(ACCORDION, parts)
const root = computed(() => toVueProps(parts.value.root))
</script>

<template>
	<div v-bind="root" class="omni-accordion"><slot /></div>
</template>
