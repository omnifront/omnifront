<script setup lang="ts">
import { inject } from "vue"
import { toVueProps } from "../internal"
import { DIALOG } from "./dialog-context"

defineOptions({ name: "OmniDialogContentText" })
const parts = inject(DIALOG, null)
</script>

<template>
	<p v-bind="parts ? toVueProps(parts.description) : {}" class="omni-dialog__content-text"><slot /></p>
</template>
