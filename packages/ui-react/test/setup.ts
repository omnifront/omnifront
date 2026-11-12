import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// React's act() environment flag, so state updates in tests do not warn.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
afterEach(() => {
	cleanup()
	document.body.innerHTML = ""
})
