import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const maintenance = source.slice(source.indexOf("function Maintenance("), source.indexOf("function MaintenanceFormPanel("));
const form = source.slice(source.indexOf("function MaintenanceFormPanel("), source.indexOf("/* ---------------------------------- PROJECTS"));

describe("Maintenance persistence boundaries", () => {
  it("shows maintenance rows only after server confirmation", () => {
    const mutationAt = maintenance.indexOf('runCompanyTableMutation("manufacturing_maintenance", "insert"');
    const stateAt = maintenance.indexOf("setRows((prev) => [confirmed, ...prev]);");
    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(maintenance).toContain("if (savingMaintenance) return;");
    expect(maintenance).toContain("Maintenance was not logged.");
    expect(form).toContain("disabled={saving}");
    expect(form).toContain('{saving ? "Saving…" : "Log Maintenance"}');
  });

  it("confirms linked Finance expenses separately and exposes reconciliation when needed", () => {
    const expenseMutationAt = maintenance.indexOf('runCompanyTableMutation("finance_expenses", "insert"');
    const expenseStateAt = maintenance.indexOf("expensesHook.setRows((prev) => [mapExpenseRow(expenseData), ...prev]);");
    expect(expenseMutationAt).toBeGreaterThan(-1);
    expect(expenseStateAt).toBeGreaterThan(expenseMutationAt);
    expect(maintenance).toContain("Maintenance is confirmed, but its linked Finance expense needs reconciliation and retry.");
    expect(maintenance).not.toContain("Logged locally, but saving to the server failed.");
  });
});

export {};
