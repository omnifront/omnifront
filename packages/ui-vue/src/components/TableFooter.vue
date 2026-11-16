<script setup lang="ts">
import { provide } from "vue"
import { TABLE_SECTION } from "./table-context"

defineOptions({ name: "OmniTableFooter" })
provide(TABLE_SECTION, "footer")
</script>

<template>
	<tfoot><slot /></tfoot>
</template>
