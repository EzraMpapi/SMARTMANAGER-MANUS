import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260824_055_pos_sales_returns.sql", import.meta.url),
  "utf8",
);

describe("normalized POS sales and returns migration", () => {
  it("creates the five normalized sales and return tables additively", () => {
    for (const table of [
      "pos_sale_headers",
      "pos_sale_lines",
      "pos_sale_tenders",
      "pos_return_headers",
      "pos_return_lines",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
    expect(migration).not.toMatch(/\bDROP TABLE\b/i);
    expect(migration).not.toContain("DISABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("public.current_company_id()");
  });

  it("preserves legacy references and links normalized records by tenant-safe composite keys", () => {
    expect(migration).toContain("legacy_pos_transaction_id uuid REFERENCES public.pos_transactions(id)");
    expect(migration).toContain("legacy_pos_transaction_item_id uuid REFERENCES public.pos_transaction_items(id)");
    expect(migration).toContain("legacy_pos_return_id uuid REFERENCES public.pos_returns(id)");
    expect(migration).toContain("FOREIGN KEY (company_id, register_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, terminal_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, shift_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, sale_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, sale_line_id)");
    expect(migration).toContain("POS customer does not belong to this workspace.");
    expect(migration).toContain("POS sale inventory item does not belong to this workspace.");
  });

  it("enforces sale totals, tender bounds, idempotency, and customer/provider states", () => {
    expect(migration).toContain("UNIQUE (company_id, sale_number)");
    expect(migration).toContain("UNIQUE (company_id, idempotency_key)");
    expect(migration).toContain("request_hash text NOT NULL");
    expect(migration).toContain("CONSTRAINT pos_sale_headers_refund_bound");
    expect(migration).toContain("CONSTRAINT pos_sale_tenders_applied_and_change_bound");
    expect(migration).toContain("applied_amount + change_amount <= tendered_amount");
    expect(migration).toContain("Customer Credit");
    expect(migration).toContain("provider_status IN ('Not Required', 'Pending', 'Confirmed', 'Failed', 'Unknown', 'Reversed')");
    expect(migration).toContain("provider_status NOT IN ('Confirmed', 'Reversed') OR nullif(btrim(provider_reference), '') IS NOT NULL");
    expect(migration).toContain("Cash POS tenders cannot carry a provider settlement state.");
  });

  it("requires approval and accounting evidence for posted returns", () => {
    expect(migration).toContain("status text NOT NULL DEFAULT 'Pending Approval'");
    expect(migration).toContain("status NOT IN ('Posted', 'Reversed')");
    expect(migration).toContain("journal_batch_id IS NOT NULL AND posted_at IS NOT NULL AND posted_by IS NOT NULL");
    expect(migration).toContain("status NOT IN ('Pending Approval', 'Approved', 'Posted') OR approval_request_id IS NOT NULL");
    expect(migration).toContain("FOREIGN KEY (company_id, approval_request_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, journal_batch_id)");
  });

  it("protects all normalized tables with tenant-scoped read policies", () => {
    expect(migration).toContain("FOREACH t IN ARRAY ARRAY['pos_sale_headers', 'pos_sale_lines', 'pos_sale_tenders', 'pos_return_headers', 'pos_return_lines']");
    expect(migration).toContain("company_id = public.current_company_id() AND public.fin_can_view()");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.pos_sales_assert_scope() FROM PUBLIC");
  });
});
