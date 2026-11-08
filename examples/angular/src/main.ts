import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"
import { QueryClient } from "@omnifront/query"
import { provideOmnifront } from "@omnifront/angular"
import { AppComponent } from "./app.component"

bootstrapApplication(AppComponent, {
	providers: [provideZonelessChangeDetection(), provideOmnifront(new QueryClient())],
}).catch((err) => console.error(err))
