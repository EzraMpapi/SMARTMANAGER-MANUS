# GitHub CI Quality-Gate Diagnosis — 22 August 2026

## Verified CI Configuration

The GitHub **CI & Quality Gate** workflow now receives the schema verification inputs from the configured protected GitHub environment. Its schema verification, TypeScript validation, unit tests, dependency audit, and production build completed successfully. No credential values are recorded in this file.

## Browser-Journey Finding

The GitHub job was named **Browser Signup Journey**, but it invoked `pnpm run test:browser`, which caused Playwright to run the full browser suite rather than the two-test isolated signup specification. The expanded run introduced unrelated workspace scenarios and exceeded the documented job scope.

The correct isolated command was reproduced locally: it builds with `--mode e2e` and then runs only `browser-tests/signupWizard.spec.ts`. Both isolated signup scenarios passed. The e2e build mode activates the existing local-only signup short-circuit before any real authentication, tenant, billing, or trial-activation request.

## Applied Remediation

The GitHub browser job now invokes the e2e browser build followed by the explicit isolated signup specification. This preserves the job’s documented purpose, keeps external tenant data untouched, and avoids treating unrelated module-browser coverage as an onboarding CI failure. The pending GitHub CI rerun is the final confirmation step.
