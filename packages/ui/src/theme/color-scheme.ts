import { createStore, type Store } from "@omnifront/store"
import { COLOR_SCHEME_ATTRIBUTE } from "./css"
import type { ColorSchemeMode } from "./types"

export interface ColorSchemeState {
	/** What the user chose. `system` follows the operating system. */
	mode: ColorSchemeMode
	setMode(mode: ColorSchemeMode): void
}

export interface ColorSchemeStoreOptions {
	defaultMode?: ColorSchemeMode
	/** localStorage key to remember the choice. Omit to not persist. */
	storageKey?: string
	/** Element that gets `data-omni-color-scheme` when the mode changes (default: nothing is touched). */
	target?: () => HTMLElement | null | undefined
}

const isMode = (v: unknown): v is ColorSchemeMode => v === "light" || v === "dark" || v === "system"

function read(key: string | undefined): ColorSchemeMode | undefined {
	if (!key) return undefined
	try {
		const v = globalThis.localStorage?.getItem(key)
		return isMode(v) ? v : undefined
	} catch {
		return undefined // storage can throw (private mode, blocked cookies)
	}
}

/**
 * The colour-scheme choice as a normal store, so `useStore` / `injectStore` read it in every framework.
 * On the server (and during hydration) the snapshot is the default mode; a saved choice is applied
 * by `restore()` after mount, which is the hydration-safe order.
 */
export function createColorSchemeStore(options: ColorSchemeStoreOptions = {}): Store<ColorSchemeState> & { restore(): void } {
	const sync = (mode: ColorSchemeMode): void => {
		options.target?.()?.setAttribute(COLOR_SCHEME_ATTRIBUTE, mode)
		if (options.storageKey) {
			try {
				globalThis.localStorage?.setItem(options.storageKey, mode)
			} catch {
				// not persisted: the in-memory choice still works
			}
		}
	}
	const store = createStore<ColorSchemeState>((set) => ({
		mode: options.defaultMode ?? "system",
		setMode: (mode) => {
			set({ mode })
			sync(mode)
		},
	}))
	return Object.assign(store, {
		restore(): void {
			const saved = read(options.storageKey)
			if (saved) store.getState().setMode(saved)
			else options.target?.()?.setAttribute(COLOR_SCHEME_ATTRIBUTE, store.getState().mode)
		},
	})
}

/**
 * A small inline script for `<head>`: it sets `data-omni-color-scheme` on `<html>` from the saved
 * choice before the first paint, so there is no flash of the wrong scheme.
 */
export function colorSchemeScript(options: { storageKey: string; defaultMode?: ColorSchemeMode }): string {
	const key = JSON.stringify(options.storageKey)
	const fallback = JSON.stringify(options.defaultMode ?? "system")
	return `(function(){try{var m=localStorage.getItem(${key});if(m!=="light"&&m!=="dark"&&m!=="system")m=${fallback};document.documentElement.setAttribute("${COLOR_SCHEME_ATTRIBUTE}",m)}catch(e){document.documentElement.setAttribute("${COLOR_SCHEME_ATTRIBUTE}",${fallback})}})()`
}
