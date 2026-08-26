import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const orderingRepair = fs.readFileSync(
  path.join(root, "supabase/migrations/20260826_022_property_snapshot_ordering_repair.sql"),
  "utf8",
);
const scopeRepair = fs.readFileSync(
  path.join(root, "supabase/migrations/20260826_023_property_snapshot_limit_scope_repair.sql"),
  "utf8",
);
const workOrderTimestampRepair = fs.readFileSync(
  path.join(root, "supabase/migrations/20260826_024_property_snapshot_work_order_timestamp_repair.sql"),
  "utf8",
);

const repairedOrderings = [
  'ORDER BY x."legalName"',
  'ORDER BY x."plotCode"',
  'ORDER BY x."unitCode"',
  'ORDER BY x."fullName"',
  'ORDER BY x."utilityType"',
  'ORDER BY x."createdAt" DESC',
  'ORDER BY x."endDate"',
  'ORDER BY x."dueDate" DESC',
  'ORDER BY x."issuedAt" DESC',
  'ORDER BY x."requestedAt" DESC',
  'ORDER BY x."inspectionDate" DESC',
  'ORDER BY x."handoverDate" DESC',
  'ORDER BY x."expenseDate" DESC',
  'ORDER BY x."fiscalYear" DESC,x.category',
];

const invalidOrderings = [
  "ORDER BY x.legal_name",
  "ORDER BY x.plot_code",
  "ORDER BY x.unit_code",
  "ORDER BY x.full_name",
  "ORDER BY x.utility_type",
  "ORDER BY x.created_at",
  "ORDER BY x.end_date",
  "ORDER BY x.due_date",
  "ORDER BY x.issued_at",
  "ORDER BY x.requested_at",
  "ORDER BY x.inspection_date",
  "ORDER BY x.handover_date",
  "ORDER BY x.expense_date",
  "ORDER BY x.fiscal_year",
];

describe("Property Management snapshot ordering repair", () => {
  it("repairs every JSON aggregate alias ordering in the manager and tenant snapshots", () => {
    expect(orderingRepair).toContain("CREATE OR REPLACE FUNCTION public.property_snapshot");
    expect(orderingRepair).toContain("CREATE OR REPLACE FUNCTION public.property_tenant_snapshot");
    repairedOrderings.forEach((ordering) => expect(orderingRepair).toContain(ordering));
    invalidOrderings.forEach((ordering) => expect(orderingRepair).not.toContain(ordering));
  });

  it("removes the local limit-variable collision with lease table aliases", () => {
    expect(scopeRepair).toContain("v_limit integer:=greatest(1,least(coalesce(p_limit,100),200))");
    expect(scopeRepair).toContain("v_limit integer:=greatest(1,least(coalesce(p_limit,50),100))");
    expect(scopeRepair).toContain("LIMIT v_limit");
    expect(scopeRepair).not.toContain("l integer:=");
    expect(scopeRepair).not.toContain("LIMIT l)");
  });

  it("projects the work-order timestamp required by its createdAt aggregate ordering", () => {
    expect(workOrderTimestampRepair).toContain('ORDER BY x."createdAt" DESC');
    expect(workOrderTimestampRepair).toContain('completion_note AS "completionNote",created_at AS "createdAt" FROM public.property_work_orders');
    expect(workOrderTimestampRepair).not.toContain('completion_note AS "completionNote" FROM public.property_work_orders');
  });

  it("preserves authenticated-only RPC access and does not alter data tables", () => {
    [orderingRepair, scopeRepair, workOrderTimestampRepair].forEach((repair) => {
      expect(repair).toContain("REVOKE ALL ON FUNCTION public.property_snapshot(integer) FROM PUBLIC, anon");
      expect(repair).toContain("REVOKE ALL ON FUNCTION public.property_tenant_snapshot(integer) FROM PUBLIC, anon");
      expect(repair).toContain("GRANT EXECUTE ON FUNCTION public.property_snapshot(integer) TO authenticated");
      expect(repair).toContain("GRANT EXECUTE ON FUNCTION public.property_tenant_snapshot(integer) TO authenticated");
      expect(repair).not.toContain("CREATE TABLE");
      expect(repair).not.toContain("INSERT INTO public.property_");
      expect(repair).not.toContain("UPDATE public.property_");
      expect(repair).not.toContain("DELETE FROM public.property_");
    });
  });
});
