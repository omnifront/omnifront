<script setup lang="ts">
import { ICON_PATHS, displayPart, tablePaginationState } from "@omnifront/ui"
import { computed, useAttrs } from "vue"
import { toVueProps, useUid } from "../internal"
import { useDefaultProps } from "../theme"
import IconButton from "./IconButton.vue"

/** The bottom row of a table: "Rows per page", "1–10 of 95", and previous and next buttons. Put it in a `TableFooter` row; it is always controlled. */
defineOptions({ name: "OmniTablePagination", inheritAttrs: false })
const raw = withDefaults(
	defineProps<{
		/** Total rows; -1 when unknown. */
		count: number
		/** 0-based. */
		page: number
		rowsPerPage: number
		/** The choices of the rows-per-page select. Default 10, 25, 50, 100. Empty hides it. */
		rowsPerPageOptions?: number[] | undefined
		labelRowsPerPage?: string | undefined
		colSpan?: number | undefined
	}>(),
	{ rowsPerPageOptions: () => [10, 25, 50, 100], labelRowsPerPage: "Rows per page:", colSpan: 1000 },
)
const emit = defineEmits<{ pageChange: [event: Event | undefined, page: number]; rowsPerPageChange: [rowsPerPage: number] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniTablePagination", () => ({ ...raw }))
const id = useUid()
const s = computed(() => tablePaginationState({ count: props.value.count, page: props.value.page, rowsPerPage: props.value.rowsPerPage }))
const bound = computed(() => ({ ...toVueProps(displayPart("omni-table__cell", { variant: "footer", padding: "none" })), ...attrs, colspan: props.value.colSpan }))
</script>

<template>
	<td v-bind="bound">
		<div class="omni-table-pagination">
			<span class="omni-table-pagination__spacer" />
			<div v-if="props.rowsPerPageOptions.length > 0" class="omni-table-pagination__rows">
				<label :for="`${id}-rows`">{{ props.labelRowsPerPage }}</label>
				<select :id="`${id}-rows`" class="omni-table-pagination__select" :value="props.rowsPerPage" @change="emit('rowsPerPageChange', Number(($event.target as HTMLSelectElement).value))">
					<option v-for="n in props.rowsPerPageOptions" :key="n" :value="n" :selected="n === props.rowsPerPage">{{ n }}</option>
				</select>
			</div>
			<span aria-live="polite">{{ s.label }}</span>
			<div class="omni-table-pagination__actions">
				<IconButton aria-label="Go to previous page" :disabled="!s.canPrevious" @click="emit('pageChange', $event, props.page - 1)">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="ICON_PATHS.chevronLeft" /></svg>
				</IconButton>
				<IconButton aria-label="Go to next page" :disabled="!s.canNext" @click="emit('pageChange', $event, props.page + 1)">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="ICON_PATHS.chevronRight" /></svg>
				</IconButton>
			</div>
		</div>
	</td>
</template>
