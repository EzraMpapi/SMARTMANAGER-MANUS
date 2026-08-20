import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("Client-Side Mutation Contract Guard", () => {
  it("includes active client-side schema contract rejection for finance_expenses in sb query builder", () => {
    expect(dashboardSource).toContain('if (table === "finance_expenses")');
    expect(dashboardSource).toContain('const forbidden = ["cost_center", "department", "data"]');
    expect(dashboardSource).toContain("Forbidden/unsupported drift column");
  });
});
