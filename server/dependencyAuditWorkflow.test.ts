import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const packageSource = readFileSync(new URL("../package.json", import.meta.url), "utf8");
const workflowSource = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

describe("dependency audit remediation contracts", () => {
  it("removes the vulnerable SheetJS runtime and preserves a safe export path", () => {
    expect(packageSource).not.toContain('"xlsx"');
    expect(dashboardSource).not.toContain('from "xlsx"');
    expect(dashboardSource).toContain('type: "text/csv;charset=utf-8;"');
    expect(dashboardSource).toContain("Full data export downloaded — 7 sections in one CSV file.");
  });

  it("keeps high and critical production dependency findings as a blocking CI signal", () => {
    expect(workflowSource).toContain("pnpm audit --prod --audit-level high");
    expect(workflowSource).not.toContain("pnpm audit --prod || true");
  });
});
