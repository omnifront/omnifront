<script setup lang="ts">
import { inject } from "vue"
import { toVueProps } from "../internal"
import { DIALOG } from "./dialog-context"

defineOptions({ name: "OmniDialogTitle" })
const parts = inject(DIALOG, null)
</script>

<template>
	<h2 v-bind="parts ? toVueProps(parts.title) : {}" class="omni-dialog__title"><slot /></h2>
</template>
