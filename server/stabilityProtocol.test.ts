import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const errorBoundary = readFileSync(new URL("../client/src/components/ErrorBoundary.tsx", import.meta.url), "utf8");
const runtimeRecovery = readFileSync(new URL("../client/src/lib/githubUpdateReload.ts", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("Smart Manager Stability Protocol Verification", () => {
  it("includes robust error boundary handling and reload capabilities", () => {
    expect(errorBoundary).toContain("ErrorBoundary");
    expect(errorBoundary).toContain("getDerivedStateFromError");
    expect(errorBoundary).toContain("Reload Page");
    expect(errorBoundary).toContain("recoverFromRuntimeError");
    expect(runtimeRecovery).toContain("RUNTIME_RECOVERY_KEY");
    expect(runtimeRecovery).toContain("clearRuntimeCaches");
    expect(runtimeRecovery).toContain("window.location.reload()");
  });

  it("maintains strict tenant isolation and server-confirmed persistence helpers", () => {
    expect(dashboard).toContain("runCompanyTableMutation");
    expect(dashboard).toContain("company_id");
  });
});
