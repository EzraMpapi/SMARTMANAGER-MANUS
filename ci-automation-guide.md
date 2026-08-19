# Smart Manager ERP — CI Automation & Quality Guide

## Continuous Integration & Quality Gates (`.github/workflows/ci.yml`)
The GitHub Actions CI pipeline runs automatically on every push and pull request to `main` or `master`. It performs the following checks:
1. **Dependency Installation**: Uses cached `pnpm` workspace storage and strict frozen lockfile verification.
2. **Type Checking**: Runs TypeScript compiler checks (`pnpm check`) to catch type mismatches.
3. **Automated Testing & Coverage**: Executes the entire Vitest suite (`pnpm vitest run --coverage`) with code coverage reporting.
4. **Dependency Security Audits**: Runs automated vulnerability scans (`pnpm audit --prod`) to maintain supply-chain hygiene across ERP packages.
5. **Production Build**: Compiles the frontend and server bundle under optimized heap constraints (`NODE_OPTIONS="--max-old-space-size=2048" pnpm build`).
6. **Slack Notifications**: Dispatches success or failure alerts to configured team Slack webhooks.

## End-to-End User Journey Coverage (`server/e2eUserJourney.test.ts`)
Automated assertions cover:
- Session routing and public authentication gateway fallback.
- Enterprise onboarding split-screen workflows, email confirmation, and password recovery views.
- Core ERP module navigation tabs (Dashboard, Collaboration, TRA Portal, HR, Finance, Inventory).
