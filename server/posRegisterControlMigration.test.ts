import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260824_053_pos_register_control.sql", import.meta.url),
  "utf8",
);

describe("POS register control migration", () => {
  it("creates the normalized register, terminal, shift, cash, and sync-device tables additively", () => {
    for (const table of [
      "pos_registers",
      "pos_terminals",
      "pos_shift_sessions",
      "pos_shift_cash_movements",
      "pos_sync_devices",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
    expect(migration).toContain("FOREACH t IN ARRAY ARRAY['pos_registers', 'pos_terminals', 'pos_shift_sessions', 'pos_shift_cash_movements', 'pos_sync_devices']");
    expect(migration).not.toMatch(/\bDROP TABLE\b/i);
    expect(migration).not.toContain("DISABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("public.current_company_id()");
  });

  it("preserves legacy POS compatibility and enforces tenant-safe operational relationships", () => {
    expect(migration).toContain("legacy_pos_shift_id uuid REFERENCES public.pos_shifts(id)");
    expect(migration).toContain("legacy_pos_cash_movement_id uuid REFERENCES public.pos_cash_movements(id)");
    expect(migration).toContain("FOREIGN KEY (company_id, register_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, terminal_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, shift_id)");
    expect(migration).toContain("POS register branch does not belong to this workspace.");
    expect(migration).toContain("POS register warehouse does not belong to this workspace.");
    expect(migration).toContain("POS terminal must belong to the selected workspace register.");
    expect(migration).toContain("POS cashier must belong to the selected workspace.");
  });

  it("enforces one open drawer, explicit close evidence, and replay-safe shift identity", () => {
    expect(migration).toContain("pos_shift_sessions_one_open_register_idx");
    expect(migration).toContain("WHERE status = 'Open'");
    expect(migration).toContain("UNIQUE (company_id, open_idempotency_key)");
    expect(migration).toContain("UNIQUE (company_id, close_idempotency_key)");
    expect(migration).toContain("status NOT IN ('Pending Close', 'Closed', 'Exception') OR counted_cash IS NOT NULL");
    expect(migration).toContain("opening_float numeric(20,2)");
    expect(migration).toContain("expected_cash numeric(20,2)");
    expect(migration).toContain("counted_cash numeric(20,2)");
    expect(migration).toContain("variance numeric(20,2)");
  });

  it("protects closed shifts and cash movement history from direct mutation", () => {
    expect(migration).toContain("pos_block_closed_shift_mutation");
    expect(migration).toContain("Closed POS shift history can only change through a protected workflow.");
    expect(migration).toContain("pos_block_cash_movement_mutation");
    expect(migration).toContain("POS cash movement history can only change through a protected workflow.");
    expect(migration).toContain("current_setting('pos.internal_write', true)");
    expect(migration).toContain("public.fin_can_view()");
  });
});
