<script setup lang="ts">
import { ICON_PATHS } from "@omnifront/ui"
import { computed, inject, mergeProps, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { ACCORDION } from "./accordion-context"

/** The always-visible row: a `<button>` inside a heading. The `expandIcon` slot replaces the chevron. */
defineOptions({ name: "OmniAccordionSummary", inheritAttrs: false })
const props = withDefaults(defineProps<{ /** The heading level around the button, 2 to 6. Default 3. */ headingLevel?: 2 | 3 | 4 | 5 | 6 }>(), { headingLevel: 3 })
const attrs = useAttrs()
const parts = inject(ACCORDION, null)
const bound = computed(() => mergeProps(parts ? toVueProps(parts.value.trigger) : {}, attrs))
</script>

<template>
	<component :is="`h${props.headingLevel}`" class="omni-accordion__heading">
		<button v-bind="bound" class="omni-accordion__summary">
			<span class="omni-accordion__summary-content"><slot /></span>
			<span class="omni-accordion__icon" aria-hidden="true">
				<slot name="expandIcon"><svg viewBox="0 0 24 24" focusable="false"><path :d="ICON_PATHS.expandMore" /></svg></slot>
			</span>
		</button>
	</component>
</template>
