import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "client/src");
const files = [
  "components/ExecutiveCommandCenter.jsx",
  "components/CommercialCommandCenters.jsx",
  "components/OperationsCommandCenters.jsx",
  "components/FinanceCommandCenters.jsx",
  "components/PeopleCommandCenters.jsx",
  "components/SectorCommandCenters.jsx",
  "components/VerticalCommandCenters.jsx",
].map((file) => ({ file, text: fs.readFileSync(path.join(root, file), "utf8") }));
const dashboard = fs.readFileSync(path.join(root, "BusinessSphereDashboard.jsx"), "utf8");

describe("dashboard quality and boundary contracts", () => {
  it("keeps every command center responsive and source-labeled", () => {
    for (const { text } of files) {
      expect(text).toContain("grid-cols-1");
      expect(text).toContain("sm:grid-cols-2");
      expect(text).toContain("asRows");
      expect(text).toContain("Source:");
      expect(text).toContain("Insufficient");
      expect(text).toContain("aria-label");
    }
  });

  it("preserves confirmed-data and tenant-boundary conventions", () => {
    expect(dashboard).toContain("useCompanyTable");
    expect(dashboard).toContain("company");
    expect(dashboard).toContain("canManage");
    expect(dashboard).toContain("onNavigate={go}");
    expect(dashboard).toContain("employee-portal");
  });

  it("keeps the shared operational form, filter, table, and empty-state visual primitives available to core modules", () => {
    expect(dashboard).toContain("const operationalFilterBarClass");
    expect(dashboard).toContain("const operationalSearchInputClass");
    expect(dashboard).toContain("const operationalTableShellClass");
    expect(dashboard).toContain("const operationalTableClass");
    expect(dashboard).toContain("function FormField");
    expect(dashboard).toContain("function EmptyState");
    expect(dashboard).toContain("<EmptyState");
    expect(dashboard).toContain("function Sales(");
    expect(dashboard).toContain("function Inventory(");
    expect(dashboard).toContain("function Finance(");
    expect(dashboard).toContain("function CRM(");
    expect(dashboard).toContain("function HR(");
  });

  it("standardizes workflow panels and confirmation dialogs without bypassing safeguards", () => {
    expect(dashboard).toContain("rounded-l-[26px]");
    expect(dashboard).toContain("sticky top-0 z-10");
    expect(dashboard).toContain("sticky bottom-0 z-10");
    expect(dashboard).toContain('role="alertdialog"');
    expect(dashboard).toContain('aria-modal="true"');
    expect(dashboard).toContain('aria-labelledby="global-confirm-title"');
    expect(dashboard).toContain('aria-describedby="global-confirm-message"');
    expect(dashboard).toContain("function ConfirmDeleteButton");
    expect(dashboard).toContain("confirmAction(message, onConfirm");
    expect(dashboard).toContain("disabled={disabled}");
    expect(dashboard).toContain("previouslyFocusedRef");
    expect(dashboard).toContain("requestAnimationFrame");
    expect(dashboard).toContain("data-confirm-cancel");
    expect(dashboard).toContain("e.key !== \"Tab\"");
    expect(dashboard).toContain("preventScroll: true");
    expect(dashboard).toContain("type=\"button\"");
  });

  it("keeps mobile navigation and floating actions touch-safe", () => {
    expect(dashboard).toContain('aria-label="Mobile workspace navigation"');
    expect(dashboard).toContain("min-h-[64px]");
    expect(dashboard).toContain('aria-current={on ? "page" : undefined}');
    expect(dashboard).toContain("env(safe-area-inset-bottom)");
    expect(dashboard).toContain("min-h-14 min-w-14");
    expect(dashboard).toContain("focus-visible:ring-inset");
    expect(dashboard).toContain("dashboard-mobile-content");
    expect(dashboard).toContain("sm-mobile-filter-row");
  });

  it("does not introduce client-side persistence into command-center components", () => {
    for (const { text } of files) {
      expect(text).not.toContain("localStorage");
      expect(text).not.toContain("sessionStorage");
      expect(text).not.toContain("Math.random");
    }
  });
});
