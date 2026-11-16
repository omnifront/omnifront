import type { InjectionKey } from "vue"

export type TableSection = "head" | "body" | "footer"
/** Which part of the table a cell is in, so it can be a `th` in the head without saying so. */
export const TABLE_SECTION: InjectionKey<TableSection> = Symbol("omni-table-section")
