import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = [
  "client/src/BusinessSphereDashboard.jsx",
  "client/src/dashboardExtractedModules.jsx",
  "client/src/components/HealthcareClinicWorkspace.jsx",
  "client/src/components/PredictiveAnalyticsWorkspace.jsx",
];

describe("rows.filter safety", () => {
  it("normalizes table rows before filtering", () => {
    for (const relativePath of files) {
      const source = readFileSync(resolve(process.cwd(), relativePath), "utf8");
      expect(source, relativePath).toContain("function rowsOf(source)");
      expect(source, relativePath).not.toMatch(/\b[A-Za-z_$][A-Za-z0-9_$]*\.rows\.filter\b/);
    }
  });
});
