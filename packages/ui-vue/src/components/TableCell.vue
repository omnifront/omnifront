<script setup lang="ts">
import { displayPart } from "@omnifront/ui"
import { computed, inject, useAttrs } from "vue"
import { toVueProps } from "../internal"
import { useDefaultProps } from "../theme"
import { TABLE_SECTION, type TableSection } from "./table-context"

defineOptions({ name: "OmniTableCell", inheritAttrs: false })
// `sortDirection` can be `false`: Vue would cast an absent one to false, which is the same, so no default is needed.
const raw = defineProps<{
	align?: "left" | "center" | "right" | "justify" | undefined
	/** `checkbox` makes a narrow cell for a Checkbox; `none` takes the padding off. */
	padding?: "normal" | "checkbox" | "none" | undefined
	/** Defaults to where the cell is: `head` in a TableHead (a `th` with `scope="col"`), `footer` in a TableFooter, else `body`. */
	variant?: TableSection | undefined
	/** The column's sort order, for a header cell: written as `aria-sort`. Pair it with TableSortLabel. */
	sortDirection?: "asc" | "desc" | false | undefined
	/** Make a row header: `component="th" scope="row"`. */
	component?: string | undefined
}>()
const attrs = useAttrs()
const props = useDefaultProps("OmniTableCell", () => ({ ...raw }))
const section = inject(TABLE_SECTION, "body")
const kind = computed(() => props.value.variant ?? section)
const tag = computed(() => props.value.component ?? (kind.value === "head" ? "th" : "td"))
const bound = computed(() => {
	const p = props.value
	const part = displayPart("omni-table__cell", { variant: kind.value, align: p.align && p.align !== "left" ? p.align : undefined, padding: p.padding && p.padding !== "normal" ? p.padding : undefined })
	return { ...toVueProps(part), ...attrs, scope: attrs["scope"] ?? (tag.value === "th" && kind.value === "head" ? "col" : undefined), "aria-sort": p.sortDirection ? (p.sortDirection === "asc" ? "ascending" : "descending") : undefined }
})
</script>

<template>
	<component :is="tag" v-bind="bound"><slot /></component>
</template>
