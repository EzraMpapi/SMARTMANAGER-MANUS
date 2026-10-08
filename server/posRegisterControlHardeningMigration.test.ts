import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260824_054_pos_register_control_hardening.sql", import.meta.url),
  "utf8",
);

describe("POS register-control hardening migration", () => {
  it("fails closed for posted cash movements without accounting evidence", () => {
    expect(migration).toContain("ALTER COLUMN status SET DEFAULT 'Pending Approval'");
    expect(migration).toContain("pos_shift_cash_movements_posted_evidence_check");
    expect(migration).toContain("status <> 'Posted'");
    expect(migration).toContain("journal_batch_id IS NOT NULL AND posted_at IS NOT NULL AND posted_by IS NOT NULL");
    expect(migration).toContain("VALIDATE CONSTRAINT pos_shift_cash_movements_posted_evidence_check");
    expect(migration).toContain("pos_shift_cash_movements_pending_approval_check");
  });

  it("requires request hashes and open-period validation for retry-safe shift operations", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS open_request_hash text");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS close_request_hash text");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS request_hash text");
    expect(migration).toContain("v_request_hash IS NULL");
    expect(migration).toContain("v_hash IS NULL");
    expect(migration).toContain("fp.period_start <= p_business_date");
    expect(migration).toContain("fp.period_end >= p_business_date");
    expect(migration).toContain("fp.status = 'Open'");
  });

  it("exposes protected operating routines and prevents client-supplied Posted cash", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.pos_open_shift");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.pos_record_cash_movement");
    expect(migration).toContain("v_status := 'Pending Approval'");
    expect(migration).toContain("A separate protected posting routine must create the balanced journal");
    expect(migration).not.toContain("p_journal_batch_id uuid DEFAULT NULL");
    expect(migration).toContain("p_approval_request_id IS NULL");
    expect(migration).toContain("set_config('pos.internal_write', 'on', true)");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.pos_open_shift");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.pos_record_cash_movement");
  });

  it("protects sync sequences and preserves additive/no-downtime behavior", () => {
    expect(migration).toContain("last_accepted_hash");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.pos_accept_sync_device_sequence");
    expect(migration).toContain("POS sync device sequence cannot move backwards.");
    expect(migration).toContain("POS sync sequence was reused with a different payload.");
    expect(migration).toContain("next_expected_sequence");
    expect(migration).toContain("sequence can only advance through the protected sync workflow");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.pos_accept_sync_device_sequence");
    expect(migration).not.toMatch(/\bDROP TABLE\b/i);
    expect(migration).not.toContain("DISABLE ROW LEVEL SECURITY");
  });
});
