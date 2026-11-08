// TestBed needs the JIT compiler and a test platform; zoneless means no zone.js is required.
// Test files that run in the node environment (server rendering) must not touch the browser platform.
import "@angular/compiler"
import { provideZonelessChangeDetection } from "@angular/core"
import { getTestBed, TestBed } from "@angular/core/testing"
import { BrowserTestingModule, platformBrowserTesting } from "@angular/platform-browser/testing"
import { afterEach, beforeEach } from "vitest"

if (typeof document !== "undefined") {
	getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting())
	beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }))
	afterEach(() => TestBed.resetTestingModule())
}
