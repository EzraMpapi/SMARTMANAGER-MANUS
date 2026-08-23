import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const browserJourney = readFileSync(new URL("../browser-tests/signupWizard.spec.ts", import.meta.url), "utf8");

describe("isolated signup and CI quality gates", () => {
  it("keeps final signup browser coverage inside a compile-time isolated mode", () => {
    expect(dashboard).toContain('const IS_ISOLATED_SIGNUP_E2E = import.meta.env.MODE === "e2e"');
    expect(dashboard).toContain('endsWith("@e2e.invalid")');
    expect(dashboard).toContain("clearStoredAuthSession();");
    expect(dashboard).toContain("Isolated authenticated workspace session is active");
    expect(dashboard).toContain("No authentication request or tenant record was sent");
    expect(dashboard).toContain('aria-label="Loading dashboard preferences"');
    expect(dashboard).toContain("Preview dashboard preferences");
    expect(dashboard).toContain('const LazyComplianceAuditLogView = lazy(() => import("./components/ComplianceAuditLogView")');
    expect(dashboard).toContain('aria-label="Loading compliance audit workspace"');
    expect(browserJourney).toContain("Preview compliance audit workspace");
    expect(browserJourney).toContain("asha@e2e.invalid");
    expect(browserJourney).toContain('name: "Launch Smart Manager →"');
  });

  it("runs tests, schema validation, type checks, production build, and browser coverage in GitHub Actions", () => {
    expect(workflow).toContain("Verify Supabase schema contract");
    expect(workflow).toContain("pnpm run verify:supabase-schema");
    expect(workflow).toContain("pnpm run check");
    expect(workflow).toContain("pnpm test -- --coverage --reporter=verbose");
    expect(workflow).toContain('name: Browser Signup Journey');
    expect(workflow).toContain("pnpm exec playwright install --with-deps chromium");
    expect(workflow).toContain("pnpm run pretest:browser");
    expect(workflow).toContain("pnpm exec playwright test browser-tests/signupWizard.spec.ts");
  });
});
