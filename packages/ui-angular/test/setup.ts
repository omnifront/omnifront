// TestBed needs the JIT compiler and a test platform. What that means depends on the Angular version:
//   17      zone.js is required (no zoneless), and the dynamic platform provides the JIT compiler
//   18, 19  zoneless is experimental; 18 still needs the dynamic platform for JIT
//   20+     `@angular/compiler` is enough and `provideZonelessChangeDetection` is stable
// Test files that run in the node environment (server rendering) must not touch the browser platform.
import "@angular/compiler"
import { getTestBed, TestBed } from "@angular/core/testing"
import { afterEach, beforeEach } from "vitest"
import { zonelessProviders } from "./compat"

// Optional modules (only present for some Angular versions): imported by variable name so neither
// TypeScript nor Vite insists they exist.
const optional = (name: string): Promise<Record<string, unknown>> => import(/* @vite-ignore */ name) as Promise<Record<string, unknown>>

if (typeof document !== "undefined") {
	if (zonelessProviders().length === 0) {
		await optional("zone.js")
		await optional("zone.js/testing")
	}
	let module: unknown
	let platform: unknown
	try {
		const dynamic = await optional("@angular/platform-browser-dynamic/testing")
		module = dynamic["BrowserDynamicTestingModule"]
		platform = dynamic["platformBrowserDynamicTesting"]
	} catch {
		const browser = await optional("@angular/platform-browser/testing")
		module = browser["BrowserTestingModule"]
		platform = browser["platformBrowserTesting"]
	}
	getTestBed().initTestEnvironment(module as never, (platform as () => never)())
	beforeEach(() => TestBed.configureTestingModule({ providers: [...zonelessProviders()] }))
	afterEach(() => TestBed.resetTestingModule())
}
