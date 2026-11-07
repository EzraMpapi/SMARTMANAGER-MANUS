# Dashboard Layout Preferences: Validation Evidence

## Cover
Dashboard Layout Preferences

Tenant-safe customization, validated browser journeys, and build-readiness evidence

## Slide 1
### Personalize the command center without changing the facts

The feature persists a user’s performance window, KPI card selection, panel visibility, and panel order. The command center continues to compute only confirmed business signals; hiding a panel changes presentation, never data ownership or calculation truthfulness.

## Slide 2
### One scoped preference record governs the experience

The existing `user_table_preferences` JSON record remains the single persistence boundary. A saved record is scoped to the authenticated user and company, validated server-side, normalized for backward compatibility, and read by the dashboard before it renders the selected range, cards, and panels.

## Slide 3
### The drawer converts choices into clear, accessible controls

The preference drawer saves 30D, 3M, 6M, or 1Y as the default reporting window. It keeps at least one KPI card selected, presents visible/hidden panel state with `aria-pressed`, and provides labelled up/down controls for keyboard-accessible ordering.

## Slide 4
### Browser evidence confirms the executive path and responsive controls

The isolated test first exposed that the executive dashboard’s visible Customize dashboard control did not mount the shared drawer. The correction mounts the same lazy drawer in the executive branch. The final isolated suite passed six desktop and mobile checks, including opening the drawer, changing range/KPI/visibility/order, observing mocked save requests, and reaching controls at a Pixel 5 viewport.

## Slide 5
### Production bundling passes in a clean worker

Vite transforms 2,702 modules; the dominant shell chunk is 7.26 MB uncompressed and 1.08 MB gzip. Rendering requires roughly 1.62 GiB Vite RSS. Extra vendor partitioning and disabled minification increased memory, so both experiments were rejected. With a 2.3 GiB V8 ceiling and no unrelated type watcher, the production client build completed in 11.03 seconds.

## Slide 6
### Validation is layered, not assumed

Focused contracts passed for the preference schema, reference dashboard, executive drawer, isolated signup gate, and browser-build script. TypeScript passed. The browser suite used a disposable user/company, a local static server, a dummy Supabase configuration, and intercepted REST/auth/tRPC calls; it did not connect to a production tenant.

## Slide 7
### Operational conclusion: feature ready, build runbook clarified

The dashboard preference feature is fully implemented and verified through isolated browser behavior. The remaining operational rule is to run production bundling in a clean worker or CI executor without concurrent development watchers. The schema remains unchanged because the existing tenant-scoped preference JSON record and RLS boundary satisfy the feature.
