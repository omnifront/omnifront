<script setup lang="ts">
import { provide } from "vue"
import { TABLE_SECTION } from "./table-context"

defineOptions({ name: "OmniTableBody" })
provide(TABLE_SECTION, "body")
</script>

<template>
	<tbody><slot /></tbody>
</template>
