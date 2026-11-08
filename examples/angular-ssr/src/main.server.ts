import { mergeApplicationConfig } from "@angular/core"
import { bootstrapApplication, type BootstrapContext } from "@angular/platform-browser"
import { provideServerRendering, withRoutes } from "@angular/ssr"
import { createAppConfig } from "./app/app.config"
import { AppComponent } from "./app/app.component"
import { serverRoutes } from "./app/app.routes.server"

// Called for every request, so every request gets a fresh config (and a fresh QueryClient).
const bootstrap = (context: BootstrapContext) =>
	bootstrapApplication(AppComponent, mergeApplicationConfig(createAppConfig(), { providers: [provideServerRendering(withRoutes(serverRoutes))] }), context)

export default bootstrap
