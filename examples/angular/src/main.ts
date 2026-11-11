import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"
import { QueryClient } from "@omnifront/query"
import { provideOmnifront } from "@omnifront/angular"
import { setupOffline } from "@omnifront/example-shared"
import { AppComponent } from "./app.component"

const client = new QueryClient()
// Serial adds (scope) and the offline switch of the demo; no persistence in this example.
setupOffline(client)

bootstrapApplication(AppComponent, {
	providers: [provideZonelessChangeDetection(), provideOmnifront(client)],
}).catch((err) => console.error(err))
