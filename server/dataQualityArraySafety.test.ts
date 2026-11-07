import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Data Quality array safety", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
  const start = source.indexOf("function DataQualityView");
  const end = source.indexOf("function ", start + 10);
  const view = source.slice(start, end > start ? end : start + 12000);

  it("normalizes all five module inputs before scanning", () => {
    for (const name of ["crmRows", "invoiceRows", "expenseRows", "inventoryRows", "employeeRows"]) {
      expect(view).toContain(`const ${name} = Array.isArray`);
    }
    expect(view).not.toContain("crm.rows.filter");
    expect(view).not.toContain("invoices.rows.filter");
    expect(view).not.toContain("employees.rows.filter");
    expect(view).not.toContain("inventory.rows.filter");
    expect(view).not.toContain("expenses.filter");
  });

  it("does not trim or dereference an absent lead company", () => {
    expect(view).toContain('String(l.company || l.name || "").trim()');
  });
});
