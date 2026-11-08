// TestBed needs the JIT compiler and a test platform; zoneless means no zone.js is required.
import "@angular/compiler"
import { provideZonelessChangeDetection } from "@angular/core"
import { getTestBed, TestBed } from "@angular/core/testing"
import { BrowserTestingModule, platformBrowserTesting } from "@angular/platform-browser/testing"
import { afterEach, beforeEach } from "vitest"

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting())

beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }))
afterEach(() => TestBed.resetTestingModule())
