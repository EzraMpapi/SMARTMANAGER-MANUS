import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync(new URL("../client/src/components/EnterpriseLayout.tsx", import.meta.url), "utf8");
const customizer = readFileSync(new URL("../client/src/components/EnterpriseColumnCustomizer.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("enterprise keyboard and table customization controls", () => {
  it("provides Arrow, Home, and End navigation for reusable module tabs", () => {
    expect(layout).toContain('role="tablist"');
    expect(layout).toContain('event.key === "ArrowRight"');
    expect(layout).toContain('event.key === "ArrowLeft"');
    expect(layout).toContain('event.key === "Home"');
    expect(layout).toContain('event.key === "End"');
  });

  it("offers an accessible reusable column selector and wires it into CRM and Inventory", () => {
    expect(customizer).toContain('role="menuitemcheckbox"');
    expect(customizer).toContain("onVisibleColumnsChange");
    expect(dashboard).toContain('visibleLeadColumns');
    expect(dashboard).toContain('visibleStockColumns');
    expect(dashboard).toContain('<EnterpriseColumnCustomizer columns={leadColumns}');
    expect(dashboard).toContain('<EnterpriseColumnCustomizer columns={stockColumns}');
  });
});
