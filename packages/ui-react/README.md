# @omnifront/ui-react

React components for the omnifront UI kit: Material-style Button, TextField, Dialog, Menu and Tabs, with a theme, dark mode and the same behaviour as the Vue and Angular packages.

> Pre-release: not published to npm yet, and the API can still change.

```tsx
import "@omnifront/ui/styles.css"
import { Button, ThemeProvider, createTheme } from "@omnifront/ui-react"

export const App = () => (
	<ThemeProvider theme={createTheme()}>
		<Button variant="contained" loading={false}>Save</Button>
	</ThemeProvider>
)
```

Documentation: [UI guide](https://github.com/omnifront/omnifront/blob/main/apps/docs/guide/ui.md).
