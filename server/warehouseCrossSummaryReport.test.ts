import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20261118_002_warehouse_cross_summary_report.sql"),
  "utf8",
);
const dashboard = readFileSync(
  path.join(process.cwd(), "client/src/BusinessSphereDashboard.jsx"),
  "utf8",
);

describe("cross-warehouse summary report contract", () => {
  it("exposes an authenticated RPC that still enforces owner authorization", () => {
    expect(migration).toContain("create or replace function public.warehouse_cross_warehouse_summary()");
    expect(migration).toContain("if not public.warehouse_is_owner() then");
    expect(migration).toContain("Only the organization owner can view the cross-warehouse stock summary.");
    expect(migration).toContain("revoke all on function public.warehouse_cross_warehouse_summary() from public, anon, authenticated");
    expect(migration).toContain("grant execute on function public.warehouse_cross_warehouse_summary() to authenticated");
  });

  it("aggregates by warehouse and returns totals without individual rows", () => {
    expect(migration).toContain("warehouse_stock");
    expect(migration).toContain("sku_count");
    expect(migration).toContain("stock_value");
    expect(migration).toContain("low_stock_count");
    expect(migration).toContain("'warehouses'");
    expect(migration).toContain("'totals'");
    expect(migration).toContain("i.data->>'warehouse_id' = w.id::text");
    expect(migration).toContain("i.company_id = v_company_id");
  });

  it("renders the report only for owners and calls the server RPC", () => {
    expect(dashboard).toContain("OwnerCrossWarehouseSummary");
    expect(dashboard).toContain("warehouse_cross_warehouse_summary");
    expect(dashboard).toContain("All warehouses summary");
    expect(dashboard).toContain("Owner-only aggregate report");
    expect(dashboard).toContain("currentUser={currentUser}");
  });
});
