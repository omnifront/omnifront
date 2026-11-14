# @omnifront/ui-angular

Angular components for the omnifront UI kit: Material-style button, text field (works with `ngModel` and reactive forms), dialog, menu and tabs, with a theme, dark mode and the same behaviour as the React and Vue packages. Standalone components, Angular 17 or newer.

> Pre-release: not published to npm yet, and the API can still change.

```ts
import { Component } from "@angular/core"
import { OmniButton, OmniThemeProvider, createTheme } from "@omnifront/ui-angular"

@Component({
	selector: "app-root",
	standalone: true,
	imports: [OmniThemeProvider, OmniButton],
	template: `<omni-theme-provider [theme]="theme"><button omni-button variant="contained">Save</button></omni-theme-provider>`,
})
export class AppComponent {
	theme = createTheme()
}
```

Add `@omnifront/ui/styles.css` to your global styles. Documentation: [UI guide](https://github.com/omnifront/omnifront/blob/main/apps/docs/guide/ui.md).
