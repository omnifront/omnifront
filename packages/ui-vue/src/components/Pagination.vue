<script setup lang="ts">
import { ICON_PATHS, createPagination, type PaginationItem } from "@omnifront/ui"
import { computed, mergeProps, useAttrs } from "vue"
import { toVueProps, useMachine } from "../internal"
import { useDefaultProps } from "../theme"

/** A row of page buttons: first, previous, numbers with "…" where pages fold, next, last. The page is 1-based; the current one is `aria-current="page"`. */
defineOptions({ name: "OmniPagination", inheritAttrs: false })
const raw = withDefaults(
	defineProps<{
		/** Number of pages. */
		count: number
		/** The current page (`v-model:page`). Leave out to let it keep its own. */
		page?: number | undefined
		defaultPage?: number | undefined
		disabled?: boolean | undefined
		siblingCount?: number | undefined
		boundaryCount?: number | undefined
		showFirstButton?: boolean | undefined
		showLastButton?: boolean | undefined
		hidePrevButton?: boolean | undefined
		hideNextButton?: boolean | undefined
		variant?: "text" | "outlined" | undefined
		shape?: "circular" | "rounded" | undefined
		size?: "small" | "medium" | "large" | undefined
		color?: "standard" | "primary" | "secondary" | undefined
	}>(),
	{ disabled: undefined, showFirstButton: undefined, showLastButton: undefined, hidePrevButton: undefined, hideNextButton: undefined },
)
const emit = defineEmits<{ change: [event: Event | undefined, page: number]; "update:page": [page: number] }>()
const attrs = useAttrs()
const props = useDefaultProps("OmniPagination", () => ({ ...raw }))
const { machine, state } = useMachine(
	() => createPagination({ count: raw.count, defaultPage: raw.defaultPage }),
	() => ({
		...props.value,
		label: attrs["aria-label"] as string | undefined,
		onPageChange: (page: number, event?: Event) => {
			emit("change", event, page)
			emit("update:page", page)
		},
	}),
)
const ICONS: Partial<Record<PaginationItem["type"], string>> = { first: ICON_PATHS.firstPage, previous: ICON_PATHS.chevronLeft, next: ICON_PATHS.chevronRight, last: ICON_PATHS.lastPage }
const view = computed(() => {
	void state.value
	const parts = machine.connect()
	return {
		root: mergeProps(toVueProps(parts.root), attrs),
		list: toVueProps(parts.list),
		items: state.value.items.map((item) => ({ item, icon: ICONS[item.type], bound: toVueProps(parts.item(item)) })),
	}
})
</script>

<template>
	<nav v-bind="view.root">
		<ul v-bind="view.list">
			<li v-for="(entry, at) in view.items" :key="`${entry.item.type}-${at}`">
				<span v-if="entry.item.page === null" v-bind="entry.bound">…</span>
				<button v-else v-bind="entry.bound">
					<svg v-if="entry.icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path :d="entry.icon" /></svg>
					<template v-else>{{ entry.item.page }}</template>
				</button>
			</li>
		</ul>
	</nav>
</template>
