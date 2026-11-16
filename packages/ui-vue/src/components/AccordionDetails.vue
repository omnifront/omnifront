<script setup lang="ts">
import { computed, inject } from "vue"
import { toVueProps } from "../internal"
import { ACCORDION } from "./accordion-context"

/** The content that opens and closes. */
defineOptions({ name: "OmniAccordionDetails" })
const parts = inject(ACCORDION, null)
const region = computed(() => (parts ? toVueProps(parts.value.region) : {}))
</script>

<template>
	<div v-bind="region" class="omni-accordion__region">
		<div class="omni-accordion__region-inner">
			<div class="omni-accordion__details"><slot /></div>
		</div>
	</div>
</template>
