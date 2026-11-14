import fs from "node:fs";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync("supabase/migrations/20260920_001_offline_sync_receipts.sql", "utf8");
const dashboard = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");

describe("offline sync receipt migration", () => {
  it("creates a tenant-scoped receipt table with idempotency protection", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.offline_sync_operations");
    expect(migration).toContain("company_id uuid NOT NULL REFERENCES public.companies");
    expect(migration).toContain("UNIQUE (company_id, operation_id)");
    expect(migration).toContain("ALTER TABLE public.offline_sync_operations ENABLE ROW LEVEL SECURITY");
  });

  it("accepts authenticated sync receipts through a security-definer RPC", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.record_offline_sync_operation");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("public.current_company_id()");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.record_offline_sync_operation");
  });

  it("returns duplicate receipts safely and rejects hash mismatches", () => {
    expect(migration).toContain("'duplicate', true");
    expect(migration).toContain("different payload");
    expect(migration).toContain("'accepted', true");
  });

  it("records a server receipt after a replayed mutation succeeds", () => {
    expect(dashboard).toContain("record_offline_sync_operation");
    expect(dashboard).toContain("p_operation_id: operationId");
    expect(dashboard).toContain("operationId: entry.id");
    expect(dashboard).toContain("offlineSyncRequestHash");
  });
});
