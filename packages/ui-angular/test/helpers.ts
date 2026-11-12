import { Type } from "@angular/core"
import { TestBed, type ComponentFixture } from "@angular/core/testing"
import { fireEvent } from "@testing-library/dom"
import { tick } from "./compat"

/** Create a host component, render it, and let effects and async work settle. */
export async function render<T>(component: Type<T>): Promise<ComponentFixture<T>> {
	const fixture = TestBed.createComponent(component)
	document.body.append(fixture.nativeElement as HTMLElement)
	await settle(fixture)
	return fixture
}

export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
	for (let i = 0; i < 3; i++) {
		fixture.detectChanges()
		tick()
		await fixture.whenStable()
	}
}

export const key = (el: Element, k: string, init: KeyboardEventInit = {}): void => void fireEvent.keyDown(el, { key: k, ...init })
