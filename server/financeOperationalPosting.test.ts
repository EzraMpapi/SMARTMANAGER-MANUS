import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../supabase/migrations/20261006_001_fin_operational_posting.sql", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const journal = dashboard.slice(dashboard.indexOf("function ManualJournalView"), dashboard.indexOf("function PeriodClosesView"));

describe("operational accounting posting integration", () => {
  it("creates a protected tenant-scoped idempotent posting RPC", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.fin_post_operational_entry(p_payload jsonb)");
    expect(migration).toContain("PERFORM public.fin_require('manage')");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("fin_post_operational_entry");
    expect(migration).toContain("fin_idempotency_keys");
    expect(migration).toContain("request_hash");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.fin_post_operational_entry(jsonb) FROM PUBLIC, anon");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.fin_post_operational_entry(jsonb) TO authenticated");
  });

  it("requires an open period and rejects unbalanced or inactive-account postings", () => {
    expect(migration).toContain("No accounting period covers the posting date.");
    expect(migration).toContain("The accounting period is not open for posting.");
    expect(migration).toContain("The account code is not active or postable");
    expect(migration).toContain("Accounting posting must be balanced: debits must equal credits.");
    expect(migration).toContain("status = 'Active'");
    expect(migration).toContain("is_postable = true");
  });

  it("does not claim a configured manual journal succeeded before the server confirms it", () => {
    expect(journal).toContain('callWorkspaceRpcWithSessionRefresh("fin_post_operational_entry"');
    expect(journal).toContain("The accounting server did not confirm this journal posting.");
    expect(journal).toContain("if (!posted?.ok || !posted?.batchId)");
    expect(journal).toContain("if (posting) return;");
    expect(journal).toContain("Each journal line must contain a debit or a credit, not both.");
    expect(journal).not.toContain('sb("journal_entries").insert');
  });
});
