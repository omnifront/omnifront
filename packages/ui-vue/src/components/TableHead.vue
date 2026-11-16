<script setup lang="ts">
import { provide } from "vue"
import { TABLE_SECTION } from "./table-context"

defineOptions({ name: "OmniTableHead" })
provide(TABLE_SECTION, "head")
</script>

<template>
	<thead><slot /></thead>
</template>
