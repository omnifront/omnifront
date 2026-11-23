---
"@omnifront/ui": minor
"@omnifront/ui-react": minor
"@omnifront/ui-vue": minor
"@omnifront/ui-angular": minor
---

Wave 3 of the UI kit (ADR-0014), "feedback and navigation", in React, Vue and Angular: Alert, Snackbar, Backdrop, CircularProgress, LinearProgress, Skeleton, Drawer, Popover, Breadcrumbs, Link, Pagination, Stepper, BottomNavigation and SpeedDial, plus what wave 2 had put off: CardActionArea, AvatarGroup, TableSortLabel, TablePagination, AccordionGroup, Tooltip `arrow` and touch support, a custom Chip `deleteIcon`, rich Tooltip content in Angular, ListItemAvatar and `alignItems`. `@omnifront/ui` adds the `createSnackbar`, `createPopover`, `createPagination`, `createAccordionGroup` and `createSpeedDial` machines, the stateless parts (`alertPart`, `circularProgressParts`, `linearProgressParts`, `skeletonPart`, `linkPart`, `breadcrumbsPart`, `stepperPart`, `stepPart`, `bottomNavigationActionPart`, `sortLabelPart` and helpers), an `arrow` option for `autoPosition`, and one CSS file per component.
