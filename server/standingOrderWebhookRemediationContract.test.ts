import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260825_014_standing_order_webhook_remediation.sql", import.meta.url),
  "utf8",
);
const worker = readFileSync(
  new URL("../scripts/standing_order_webhook_remediation.py", import.meta.url),
  "utf8",
);

function section(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Missing section: ${start}`);
  return source.slice(startIndex, endIndex);
}

const leaseFunction = section(
  migration,
  "CREATE OR REPLACE FUNCTION bank_private.remediation_lease(",
  "CREATE OR REPLACE FUNCTION bank_private.remediation_classify(",
);
const approvalFunction = section(
  migration,
  "CREATE OR REPLACE FUNCTION bank_private.remediation_approve(",
  "CREATE OR REPLACE FUNCTION bank_private.remediation_open(",
);
const processFunction = section(
  migration,
  "CREATE OR REPLACE FUNCTION bank_private.remediation_process(",
  "CREATE OR REPLACE FUNCTION bank_private.remediation_close(",
);

describe("Standing Order webhook remediation contract", () => {
  it("uses separate request, approver, and final token hashes", () => {
    expect(migration).toContain("request_token_hash text NOT NULL");
    expect(migration).toContain("approval_token_hash text");
    expect(migration).toContain("approver_token_hash text");
    expect(migration).toContain("Two distinct approval tokens are required.");
    expect(approvalFunction).toContain("p_request_token_hash");
    expect(approvalFunction).toContain("p_approver_token_hash");
    expect(approvalFunction).toContain("p_final_token_hash");
    expect(approvalFunction).toContain("p_approved_by = v_approval.requested_by");
  });

  it("binds final approval to provider scope, requester identity, caps, expiry, and one-use consumption", () => {
    const open = section(
      migration,
      "CREATE OR REPLACE FUNCTION bank_private.remediation_open(",
      "CREATE OR REPLACE FUNCTION bank_private.remediation_lease(",
    );
    expect(open).toContain("p_requested_by IS NULL OR p_requested_by <> v_approval.requested_by");
    expect(open).toContain("v_approval.provider_account_key <> btrim(p_provider_account_key)");
    expect(open).toContain("p_max_items > v_approval.max_items");
    expect(open).toContain("p_max_settlements > v_approval.max_settlements");
    expect(open).toContain("lower(p_approval_token_hash) <> v_approval.approval_token_hash");
    expect(open).toContain("SET status = 'CONSUMED', consumed_at = now()");
  });

  it("serializes provider-account drains and leases bounded rows with SKIP LOCKED", () => {
    const open = section(
      migration,
      "CREATE OR REPLACE FUNCTION bank_private.remediation_open(",
      "CREATE OR REPLACE FUNCTION bank_private.remediation_lease(",
    );
    expect(open).toContain("bank_private.remediation_scope_lock");
    expect(migration).toContain("pg_advisory_xact_lock(");
    expect(migration).toContain("hashtextextended(");
    expect(leaseFunction).toContain("LIMIT v_limit");
    expect(leaseFunction).toContain("FOR UPDATE OF p, r SKIP LOCKED");
    expect(leaseFunction).toContain("lease_until = now() + make_interval");
    expect(leaseFunction).toContain("v_run.max_items - v_run.claimed_count");
    expect(leaseFunction).toContain("v_run.lease_seconds");
  });

  it("keeps unsafe classifications quarantined and only permits the two safe classes to requeue", () => {
    expect(migration).toContain("v_classification := 'CONFLICT'");
    expect(migration).toContain("v_classification := 'FIELD_MISMATCH'");
    expect(migration).toContain("v_classification := 'UNCORRELATED'");
    expect(migration).toContain("v_classification := 'PROVIDER_UNKNOWN'");
    expect(migration).toContain("p_classification NOT IN ('SAFE_RETRY', 'SAFE_RECONCILE')");
    expect(migration).toContain("remediation_attempt_count >= 5");
    expect(migration).toContain("THEN 'NEEDS_ATTENTION' ELSE processing_status END");
  });

  it("requires requeue state before processing and delegates settlement to the existing private provider path", () => {
    expect(processFunction).toContain("v_remediation.remediation_status <> 'REQUEUED'");
    expect(processFunction).toContain("v_event.standing_order_run_id IS NULL");
    expect(processFunction).toContain("v_event.provider_status IS NULL");
    expect(processFunction).toContain("bank_private.confirm_provider_payment(");
    expect(processFunction).toContain("v_idempotency_key := 'WHE:' || p_event_id::text");
    expect(worker).toContain('"bank_webhook_remediation_process"');
    expect(worker).toContain("self.config.mode == \"DRAIN_SAFE_SETTLEMENTS\"");
  });

  it("exposes only service-role bridges and enables RLS on operational records", () => {
    for (const table of [
      "bank_provider_webhook_drain_approvals",
      "bank_provider_webhook_drain_runs",
      "bank_provider_webhook_account_controls",
      "bank_provider_webhook_remediation",
    ]) {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
      expect(migration).toContain(`public.${table}`);
    }
    expect(migration).toContain("REVOKE ALL ON TABLE public.bank_provider_webhook_drain_approvals");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role;");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("SET search_path = pg_catalog, public, bank_private");
  });
});
