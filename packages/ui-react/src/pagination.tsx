import { ICON_PATHS, createPagination, type PaginationItem, type PaginationProps as MachineProps } from "@omnifront/ui"
import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { mergeProps, toReactProps, useMachine } from "./internal"
import { useDefaultProps } from "./theme"

export interface PaginationProps extends Omit<ComponentPropsWithoutRef<"nav">, "onChange" | "defaultValue" | "color">, Omit<MachineProps, "onPageChange" | "label"> {
	/** `(event, page)`, when the user picks a page. Without `page` the component keeps its own. */
	onChange?: ((event: Event | undefined, page: number) => void) | undefined
}

const ICONS: Partial<Record<PaginationItem["type"], string>> = { first: ICON_PATHS.firstPage, previous: ICON_PATHS.chevronLeft, next: ICON_PATHS.chevronRight, last: ICON_PATHS.lastPage }

/** A row of page buttons: first, previous, numbers with "…" where pages fold, next, last. The page is 1-based; the current one is `aria-current="page"`. */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(rawProps, ref) {
	const { count, page, defaultPage, disabled, siblingCount, boundaryCount, showFirstButton, showLastButton, hidePrevButton, hideNextButton, variant, shape, size, color, onChange, className, "aria-label": label, ...rest } = useDefaultProps("OmniPagination", rawProps)
	const [machine, state] = useMachine(() => createPagination({ count, defaultPage }), {
		count,
		page,
		disabled,
		siblingCount,
		boundaryCount,
		showFirstButton,
		showLastButton,
		hidePrevButton,
		hideNextButton,
		variant,
		shape,
		size,
		color,
		label,
		onPageChange: (next: number, event?: Event) => onChange?.(event, next),
	})
	const parts = machine.connect()
	return (
		<nav {...mergeProps(toReactProps(parts.root), { ...rest, className })} ref={ref}>
			<ul {...toReactProps(parts.list)}>
				{state.items.map((item, at) => {
					const icon = ICONS[item.type]
					return (
						<li key={`${item.type}-${at}`}>
							{item.page === null ? (
								<span {...toReactProps(parts.item(item))}>…</span>
							) : (
								<button {...toReactProps(parts.item(item))}>
									{icon ? (
										<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
											<path d={icon} />
										</svg>
									) : (
										item.page
									)}
								</button>
							)}
						</li>
					)
				})}
			</ul>
		</nav>
	)
})
