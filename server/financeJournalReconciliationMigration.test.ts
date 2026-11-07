import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8");

const journal = read("20260824_051_fin_journal_core.sql");
const reconciliation = read("20260824_052_fin_reconciliation_core.sql");

describe("finance journal and reconciliation migrations", () => {
  it("creates balanced, tenant-safe journal batches and lines", () => {
    expect(journal).toContain("CREATE TABLE IF NOT EXISTS public.fin_journal_batches");
    expect(journal).toContain("CREATE TABLE IF NOT EXISTS public.fin_journal_lines");
    expect(journal).toContain("CREATE TABLE IF NOT EXISTS public.fin_posting_links");
    expect(journal).toContain("fin_journal_lines_exactly_one_side");
    expect(journal).toContain("debit > 0 AND credit = 0");
    expect(journal).toContain("credit > 0 AND debit = 0");
    expect(journal).toContain("UNIQUE (company_id, journal_batch_id, line_no)");
    expect(journal).toContain("FOREIGN KEY (company_id, journal_batch_id)");
    expect(journal).toContain("FOREIGN KEY (company_id, account_id)");
    expect(journal).not.toMatch(/\bDROP TABLE\b/i);
  });

  it("protects posted history and prevents direct client mutation", () => {
    expect(journal).toContain("fin_block_direct_mutation");
    expect(journal).toContain("Financial history is immutable");
    expect(journal).toContain("WHEN (OLD.status IN ('Posted', 'Reversed'))");
    expect(journal).toContain("ENABLE ROW LEVEL SECURITY");
    expect(journal).toContain("public.fin_can_view()");
  });

  it("creates reconciliation import and exception controls without silent settlement", () => {
    expect(reconciliation).toContain("CREATE TABLE IF NOT EXISTS public.fin_reconciliation_batches");
    expect(reconciliation).toContain("CREATE TABLE IF NOT EXISTS public.fin_reconciliation_items");
    expect(reconciliation).toContain("UNIQUE (company_id, batch_id, external_reference)");
    expect(reconciliation).toContain("match_status IN ('Unmatched', 'Matched', 'Duplicate', 'Exception', 'Approved')");
    expect(reconciliation).toContain("CREATE UNIQUE INDEX IF NOT EXISTS fin_reconciliation_batches_company_import_hash_unique");
    expect(reconciliation).toContain("WHERE import_hash IS NOT NULL");
    expect(reconciliation).toContain("FOREIGN KEY (company_id, batch_id)");
    expect(reconciliation).toContain("ENABLE ROW LEVEL SECURITY");
    expect(reconciliation).toContain("public.fin_can_view()");
  });
});
