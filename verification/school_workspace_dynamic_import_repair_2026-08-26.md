# School Workspace dynamic-import repair — 2026-08-26

## Incident

The deployed application displayed its safe error boundary with `error loading dynamically imported module` for a hashed `SchoolWorkspace-*.js` asset. The error affected the screen/module load only; it did not indicate a database mutation or tenant-data change.

## Diagnosis

`client/src/BusinessSphereDashboard.jsx` loaded `SchoolWorkspace` with a bare `React.lazy` call, while neighboring high-risk workspace imports already used `lazyWorkspaceWithRecovery`. The recovery helper retried the page once, but did not clear the versioned Smart Manager shell cache before retrying. The service worker caches same-origin GET assets under `smart-manager-shell-v1`, so a stale shell/chunk combination could continue to reference a no-longer-served hashed asset after a deployment. Production static serving also previously fell through to `index.html` for every missing path, which could return HTML with a successful status for a missing JavaScript module.

## Repair

The School Workspace import now uses `lazyWorkspaceWithRecovery(..., "school")`. Before the one controlled reload, the helper deletes only caches whose names begin with `smart-manager-shell-`; it does not touch API responses, authentication state, application storage, tenant records, or server data. The existing session-scoped retry guard remains in place so a persistent failure is surfaced safely rather than looped indefinitely. Production static serving now returns `404` for missing file-extension paths and reserves the HTML fallback for client-side routes, preventing missing chunks from being misreported as successful HTML module responses.

## Validation

- `server/appBootstrap.test.ts`, `server/staticHtmlCacheControl.test.ts`, and `server/verticalCommandCenters.test.ts`: 10 tests passed.
- TypeScript check passed during the combined client verification command.
- Vite e2e production client build passed: 2,689 modules transformed.
- The build emitted `dist/public/assets/SchoolWorkspace-CxdXqgDZ.js` and the generated `BusinessSphereDashboard-DrNWWgT1.js` references a School Workspace asset.
- The full latest-main suite before the final static fallback hardening passed: 248 files, 1,016 tests; 7 files and 15 tests were skipped. The post-hardening focused suite passed: 3 files, 10 tests.
- No Supabase schema, table, row, RLS policy, role, financial, or audit data was changed by this client/server delivery repair.

## Publication note

This record is intended to be published together with the reviewed client, server, and test source changes after the current GitHub `main` head is rechecked. Render deployment verification must confirm that the newly generated HTML and dashboard bundle are served together; a cached browser shell should be recovered automatically by the new cache-purge path.
