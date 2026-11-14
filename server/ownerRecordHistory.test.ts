import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20261109140000_immutable_owner_record_history.sql", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("owner record history", () => {
  it("stores immutable before and after snapshots for all CRUD operations", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.record_history");
    expect(migration).toContain("operation IN ('INSERT', 'UPDATE', 'DELETE')");
    expect(migration).toContain("old_data jsonb");
    expect(migration).toContain("new_data jsonb");
    expect(migration).toContain("AFTER INSERT OR UPDATE OR DELETE");
    expect(migration).toContain("old_payload := CASE WHEN TG_OP IN ('UPDATE', 'DELETE')");
    expect(migration).toContain("IF TG_OP = 'DELETE' THEN RETURN OLD");
  });

  it("protects history from authenticated mutation and scopes reads to owner roles", () => {
    expect(migration).toContain("REVOKE ALL ON public.record_history FROM anon, authenticated");
    expect(migration).toContain("CREATE POLICY record_history_owner_read");
    expect(migration).toContain("public.can_read_record_history(company_id)");
    expect(migration).toContain("'organization owner'");
    expect(migration).toContain("'auditor'");
    expect(migration).toContain("record_history is append-only");
    expect(migration).toContain("NOT IN ('record_history', 'audit_log', 'audit_logs')");
  });

  it("renders an owner-only history screen with search, operation filters, and retained snapshots", () => {
    expect(dashboard).toContain('useCompanyTable("record_history", [], {');
    expect(dashboard).toContain("Owner Record History");
    expect(dashboard).toContain("Search table, record, or actor");
    expect(dashboard).toContain("Filter record history by operation");
    expect(dashboard).toContain("Deleted records remain available here");
    expect(dashboard).toContain("View retained snapshot");
  });
});
