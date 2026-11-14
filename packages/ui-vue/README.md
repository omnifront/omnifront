# @omnifront/ui-vue

Vue components for the omnifront UI kit: Material-style Button, TextField, Dialog, Menu and Tabs, with a theme, dark mode and the same behaviour as the React and Angular packages.

> Pre-release: not published to npm yet, and the API can still change.

```vue
<script setup lang="ts">
import "@omnifront/ui/styles.css"
import { Button, ThemeProvider, createTheme } from "@omnifront/ui-vue"
const theme = createTheme()
</script>

<template>
	<ThemeProvider :theme="theme"><Button variant="contained">Save</Button></ThemeProvider>
</template>
```

Documentation: [UI guide](https://github.com/omnifront/omnifront/blob/main/apps/docs/guide/ui.md).
