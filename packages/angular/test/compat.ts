// Test helpers that smooth over Angular API differences between the versions we support.
import * as ng from "@angular/core"
import { TestBed } from "@angular/core/testing"

/**
 * Zoneless change detection: `provideZonelessChangeDetection` (Angular 20+), or its experimental name
 * (18 and 19). Angular 17 has none: it runs with zone.js, which the test setup loads then.
 */
export function zonelessProviders(): ng.EnvironmentProviders[] {
	const api = ng as unknown as Record<string, (() => ng.EnvironmentProviders) | undefined>
	const provide = api["provideZonelessChangeDetection"] ?? api["provideExperimentalZonelessChangeDetection"]
	return provide ? [provide()] : []
}

/** Run pending effects: `TestBed.tick()` (Angular 20+) or `TestBed.flushEffects()`. */
export function tick(): void {
	const bed = TestBed as unknown as { tick?: () => void; flushEffects?: () => void }
	if (bed.tick) bed.tick()
	else bed.flushEffects?.()
}
