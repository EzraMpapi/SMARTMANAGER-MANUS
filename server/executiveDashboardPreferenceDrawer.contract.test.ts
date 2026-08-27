import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("executive dashboard preference drawer contract", () => {
  it("mounts the shared lazy preference drawer when the executive customization control is available", () => {
    const executiveBranch = source.slice(source.indexOf('if (roleView === "executive")'), source.indexOf('if (roleView === "financial")'));
    expect(executiveBranch).toContain('onCustomizeDashboard={() => setPreferencesDrawerOpen(true)}');
    expect(executiveBranch).toContain('<LazyDashboardPreferencesDrawer isOpen={preferencesDrawerOpen} onClose={() => setPreferencesDrawerOpen(false)} />');
  });
});
