import { provideZonelessChangeDetection, type ApplicationConfig } from "@angular/core"
import { provideClientHydration } from "@angular/platform-browser"
import { provideRouter } from "@angular/router"
import { provideUnicore } from "@unicore/angular"
import { provideUnicoreSsr } from "@unicore/angular/ssr"
import { QueryClient } from "@unicore/query"
import { routes } from "./app.routes"

/**
 * A FUNCTION, not a constant: Angular builds the server's providers for every request, and every
 * request needs its own QueryClient (a shared one would leak one user's data to the next).
 */
export const createAppConfig = (): ApplicationConfig => ({
	providers: [
		provideZonelessChangeDetection(),
		provideRouter(routes),
		provideClientHydration(),
		provideUnicore(new QueryClient(typeof window === "undefined" ? { gcTime: Infinity } : {})),
		provideUnicoreSsr(), // wait for queries on the server, move the cache through TransferState
	],
})
