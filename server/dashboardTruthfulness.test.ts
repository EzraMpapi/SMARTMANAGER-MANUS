import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const dashboard = source.slice(source.indexOf("function ExecutiveDashboard("), source.indexOf("function FinancialDashboard("));

describe("Executive Dashboard truthfulness", () => {
  it("builds the six-month trend only from dated confirmed invoice and expense rows", () => {
    expect(dashboard).toContain("const trendMonths = useMemo");
    expect(dashboard).toContain("String(inv.date || \"\").startsWith(key)");
    expect(dashboard).toContain("String(expense.date || \"\").startsWith(key)");
    expect(dashboard).toContain("const hasTrendData = trendData.some");
    expect(dashboard).not.toContain("Simulated 6-month trend");
    expect(dashboard).not.toContain("const factor = 0.7 + i * 0.06");
  });

  it("shows an explicit no-data state instead of a fabricated chart", () => {
    expect(dashboard).toContain("No confirmed dated activity yet");
    expect(dashboard).toContain("The six-month trend will appear after dated invoice or expense records are confirmed by the server.");
    expect(dashboard).toContain("{hasTrendData ? (");
  });
});

export {};
