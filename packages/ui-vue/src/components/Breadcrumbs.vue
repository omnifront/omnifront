<script lang="ts">
import { ICON_PATHS, breadcrumbItems, breadcrumbsPart } from "@omnifront/ui"
import { Fragment, computed, defineComponent, h, ref, useAttrs, type PropType } from "vue"
import { slotItems, toVueProps } from "../internal"
import { useDefaultProps } from "../theme"

const icon = (path: string) => h("svg", { viewBox: "0 0 24 24", focusable: "false", "aria-hidden": "true" }, [h("path", { d: path })])

/** The path to the current page: a `nav` with an ordered list. The last item is `aria-current="page"`. The `separator` slot replaces the chevron. */
export default defineComponent({
	name: "OmniBreadcrumbs",
	inheritAttrs: false,
	props: {
		/** More items than this fold their middle under a "…" button. Default 8. */
		maxItems: Number as PropType<number | undefined>,
		itemsBeforeCollapse: Number as PropType<number | undefined>,
		itemsAfterCollapse: Number as PropType<number | undefined>,
		/** The "…" button's accessible name. Default "Show path". */
		expandText: String as PropType<string | undefined>,
	},
	setup(raw, { slots }) {
		const attrs = useAttrs()
		const props = useDefaultProps("OmniBreadcrumbs", () => ({ ...raw }))
		const expanded = ref(false)
		const items = computed(() => slotItems(slots["default"]?.()))
		return () => {
			const crumbs = items.value
			const p = props.value
			const shown = breadcrumbItems(crumbs.length, { maxItems: p.maxItems, itemsBeforeCollapse: p.itemsBeforeCollapse, itemsAfterCollapse: p.itemsAfterCollapse, expanded: expanded.value })
			const { "aria-label": label, ...rest } = attrs
			return h("nav", { ...toVueProps(breadcrumbsPart(label as string | undefined)), ...rest }, [
				h(
					"ol",
					{ class: "omni-breadcrumbs__list" },
					shown.map((slot, at) =>
						h(Fragment, { key: slot === "ellipsis" ? "ellipsis" : slot }, [
							h(
								"li",
								{ class: "omni-breadcrumbs__item", "aria-current": slot !== "ellipsis" && slot === crumbs.length - 1 ? "page" : undefined },
								slot === "ellipsis"
									? [h("button", { type: "button", class: "omni-breadcrumbs__expand", "aria-label": p.expandText ?? "Show path", onClick: () => (expanded.value = true) }, [icon(ICON_PATHS.moreHoriz)])]
									: [crumbs[slot]],
							),
							at < shown.length - 1 ? h("li", { class: "omni-breadcrumbs__separator", "aria-hidden": "true", role: "presentation" }, slots["separator"]?.() ?? [icon(ICON_PATHS.chevronRight)]) : null,
						]),
					),
				),
			])
		}
	},
})
</script>
