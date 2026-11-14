import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const seedPath = new URL("../supabase/seed/20260826_full_demo_commissioning.sql", import.meta.url);
const seed = readFileSync(seedPath, "utf8");
const executableSql = seed
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n")
  .toUpperCase();

describe("full demo commissioning seed safety contract", () => {
  it("is a guarded non-migration seed with a reviewed tenant boundary", () => {
    expect(seed).toContain("app.demo_seed_environment");
    expect(seed).toContain("controlled_existing_tenant");
    expect(seed).toContain("app.allow_demo_seed");
    expect(seed).toContain("I_UNDERSTAND_THIS_ADDS_SYNTHETIC_DATA");
    expect(seed).toContain("app.demo_seed_commit");
    expect(seed).toContain("smartmanager_demo_full_20260826_v1");
    expect(seed).toContain("0d550b0b-8f57-45d2-8d1b-df1a0f7a5ec6");
    expect(seed).toContain("cfa31225-6481-4cc3-9af3-6f009a9259cb");
  });

  it("contains no destructive or external-side-effect SQL", () => {
    expect(executableSql).not.toMatch(/\bUPDATE\s+PUBLIC\./);
    expect(executableSql).not.toMatch(/\bDELETE\s+FROM\s+PUBLIC\./);
    expect(executableSql).not.toMatch(/\bTRUNCATE\b|\bDROP\s+(TABLE|SCHEMA|POLICY|FUNCTION)\b|\bALTER\s+TABLE\b/);
    expect(executableSql).not.toMatch(/\bFROM\s+AUTH\.USERS\b|\bINTO\s+AUTH\.USERS\b|\bFROM\s+STORAGE\.OBJECTS\b|\bINTO\s+STORAGE\.OBJECTS\b|\bHTTP_REQUEST\b|\bPG_NET\b/);
    expect(executableSql).toContain("ON CONFLICT DO NOTHING");
  });

  it("includes deterministic relational and accounting coverage", () => {
    expect(seed).toContain("sales_order_items");
    expect(seed).toContain("sales_invoice_items");
    expect(seed).toContain("sales_payments");
    expect(seed).toContain("fin_journal_batches");
    expect(seed).toContain("fin_journal_lines");
    expect(seed).toContain("hr_payroll_items");
    expect(seed).toContain("hr_payslips");
    expect(seed).toContain("mfi_repayment_schedules");
    expect(seed).toContain("vicoba_members");
  });
});
