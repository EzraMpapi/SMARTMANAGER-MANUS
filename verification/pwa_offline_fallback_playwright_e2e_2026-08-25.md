# PWA Offline Fallback Playwright E2E Verification

## Implementation

The project now includes `playwright.config.ts` with dedicated `chromium-desktop` and `chromium-mobile` projects, `browser-tests/offlineFallback.e2e.spec.ts` with four deterministic scenarios, the `test:browser:offline` package command, and `.github/workflows/pwa-offline-e2e.yml` for continuous execution on relevant source changes.

The suite does not require production credentials or mutate production data. It builds with invalid e2e-only Supabase values, uses a local Vite preview server, and toggles the browser context network state through Playwright.

## Scenarios

| Scenario | Desktop Chromium | Mobile Chromium |
|---|---:|---:|
| Production-like service-worker registration and shell cache | Passed | Passed |
| Failed navigation serves the branded offline page and retry remains available | Passed | Passed |
| API GET and POST requests are not satisfied by the offline page/cache | Passed | Passed |
| Connectivity restoration dispatches the online recovery reload | Passed | Passed |

## Additional gates

The offline boundary unit contract passed **3/3** tests, and `pnpm check` passed. The production-like e2e build emitted the service-worker registration and `/sw.js` asset. The initial E2E attempt exposed two harness issues: the e2e build was tree-shaking the production-only registration guard, and Playwright navigation was being attempted without first caching the offline document. The implementation now uses `import.meta.env.MODE !== "development"` so the production-like e2e build registers safely, and the tests prime the service worker before taking the context offline. The corrected desktop and mobile suites each pass **4/4**.

## Continuous execution

Run locally with `pnpm run test:browser:offline`. The workflow installs Chromium, builds with deterministic e2e-only configuration, starts Vite preview through the Playwright web server, and runs the focused suite on pushes and pull requests that affect the PWA boundary. Firefox and WebKit are not included because the available project environment and current CI workflow are Chromium-only; they can be added later with the corresponding browser installations.

No authentication state, Supabase data, billing settings, repository privacy, or production deployment settings were changed during this work.
