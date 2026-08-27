import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const browserJourney = readFileSync(new URL("../browser-tests/signupWizard.spec.ts", import.meta.url), "utf8");

describe("isolated dashboard browser journey and CI quality gates", () => {
  it("keeps the disposable browser journey inside a compile-time isolated mode and mocked tenant boundary", () => {
    expect(dashboard).toContain('const IS_ISOLATED_SIGNUP_E2E = import.meta.env.MODE === "e2e"');
    expect(dashboard).toContain('endsWith("@e2e.invalid")');
    expect(dashboard).toContain("clearStoredAuthSession();");
    expect(dashboard).toContain("Isolated authenticated workspace session is active");
    expect(dashboard).toContain("No authentication request or tenant record was sent");
    expect(dashboard).toContain('aria-label="Loading dashboard preferences"');
    expect(dashboard).toContain("Preview dashboard preferences");
    expect(dashboard).toContain('const LazyComplianceAuditLogView = lazy(() => import("./components/ComplianceAuditLogView")');
    expect(dashboard).toContain('aria-label="Loading compliance audit workspace"');
    expect(browserJourney).toContain("installIsolatedDashboardSession");
    expect(browserJourney).toContain("updates and saves dashboard layout preferences");
    expect(browserJourney).toContain("preferenceSaveCount");
    expect(browserJourney).toContain("e2e.supabase.invalid");
  });

  it("runs tests, schema validation, type checks, production build, and browser coverage in GitHub Actions", () => {
    expect(workflow).toContain("Verify Supabase schema contract");
    expect(workflow).toContain("pnpm run verify:supabase-schema");
    expect(workflow).toContain("pnpm run check");
    expect(workflow).toContain("pnpm test -- --coverage --reporter=verbose");
    expect(workflow).toContain('name: Browser Dashboard Preference Journey');
    expect(workflow).toContain("pnpm exec playwright install --with-deps chromium");
    expect(workflow).toContain("pnpm run pretest:browser");
    expect(workflow).toContain("node scripts/serve-build-for-e2e.mjs");
    expect(workflow).toContain("PLAYWRIGHT_EXTERNAL_SERVER=1 pnpm exec playwright test browser-tests/signupWizard.spec.ts --config=playwright.isolated.config.ts");
  });
});
