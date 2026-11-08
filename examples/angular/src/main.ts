import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"
import { QueryClient } from "@unicore/query"
import { provideUnicore } from "@unicore/angular"
import { AppComponent } from "./app.component"

bootstrapApplication(AppComponent, {
	providers: [provideZonelessChangeDetection(), provideUnicore(new QueryClient())],
}).catch((err) => console.error(err))
