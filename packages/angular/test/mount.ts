import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext, type Provider } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { tick } from "./compat"

/** Run `setup` in its own injector (like a component would have); `unmount` destroys it. */
export function mountInjectable<T>(setup: () => T, providers: Array<Provider | ReturnType<typeof import("../src").provideUnicore>> = []) {
	const injector = createEnvironmentInjector(providers as Provider[], TestBed.inject(EnvironmentInjector))
	const result = runInInjectionContext(injector, setup)
	return { result, injector, unmount: () => injector.destroy() }
}

/** Let effects run (Angular normally does this during change detection). */
export function flushEffects(): void {
	tick()
}
