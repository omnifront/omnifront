import { provideZonelessChangeDetection, type ApplicationConfig } from "@angular/core"
import { provideClientHydration } from "@angular/platform-browser"
import { provideRouter } from "@angular/router"
import { provideOmnifront } from "@omnifront/angular"
import { provideOmnifrontSsr } from "@omnifront/angular/ssr"
import { QueryClient } from "@omnifront/query"
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
		provideOmnifront(new QueryClient(typeof window === "undefined" ? { gcTime: Infinity } : {})),
		provideOmnifrontSsr(), // wait for queries on the server, move the cache through TransferState
	],
})
