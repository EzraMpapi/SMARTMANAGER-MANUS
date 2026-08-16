import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync(new URL("../client/src/components/EnterpriseLayout.tsx", import.meta.url), "utf8");
const customizer = readFileSync(new URL("../client/src/components/EnterpriseColumnCustomizer.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("enterprise keyboard and table customization controls", () => {
  it("provides Arrow, Home, and End navigation for reusable module tabs", () => {
    expect(layout).toContain('role="tablist"');
    expect(layout).toContain('event.key === "ArrowRight"');
    expect(layout).toContain('event.key === "ArrowLeft"');
    expect(layout).toContain('event.key === "Home"');
    expect(layout).toContain('event.key === "End"');
  });

  it("uses the shared scrollable tab primitive for CRM and keeps repeated segmented strips readable on mobile", () => {
    expect(dashboard).toContain('<ScrollableModuleTabs tabs={CRM_TABS} activeTab={tab} onChangeTab={setTab} />');
    expect(globalStyles).toContain(".flex.items-center.gap-1.bg-slate-100.rounded-lg.p-1.overflow-x-auto > button");
    expect(globalStyles).toContain("flex: 0 0 auto");
    expect(globalStyles).toContain("min-width: max-content");
    expect(globalStyles).toContain("-webkit-overflow-scrolling: touch");
    expect(dashboard).toContain("sm-mobile-action-group flex gap-2 shrink-0");
  });

  it("keeps reusable headers, searches, and action controls within the narrow viewport", () => {
    expect(layout).toContain('className="min-w-0"');
    expect(layout).toContain('className="flex w-full items-center gap-3 shrink-0 flex-wrap md:w-auto"');
    expect(layout).toContain('className="relative min-w-0 w-full flex-1 sm:min-w-[260px] sm:w-auto sm:flex-initial"');
    expect(layout).toContain('className="flex w-full items-center gap-2 flex-wrap shrink-0 lg:w-auto"');
    expect(globalStyles).toContain("#root .overflow-x-auto > table");
  });

  it("offers an accessible reusable column selector and wires it into CRM and Inventory", () => {
    expect(customizer).toContain('role="menuitemcheckbox"');
    expect(customizer).toContain("onVisibleColumnsChange");
    expect(dashboard).toContain('visibleLeadColumns');
    expect(dashboard).toContain('visibleStockColumns');
    expect(dashboard).toContain('<EnterpriseColumnCustomizer columns={leadColumns}');
    expect(dashboard).toContain('<EnterpriseColumnCustomizer columns={stockColumns}');
  });

  it("persists visible columns through the authenticated table preference contract across major ledgers", () => {
    expect(dashboard).toContain('function usePersistentVisibleColumns');
    expect(dashboard).toContain('user_table_preferences');
    expect(dashboard).toContain('onConflict: "company_id,user_id,preference_key"');
    expect(dashboard).toContain('visibleSalesColumns');
    expect(dashboard).toContain('visibleExpenseColumns');
    expect(customizer).toContain('aria-expanded={open}');
    expect(layout).toContain('tabIndex={isActive ? 0 : -1}');
  });
});
