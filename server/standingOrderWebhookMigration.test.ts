import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../docs/standing-order-webhook-event-migration.sql", import.meta.url),
  "utf8",
);

function sectionBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) {
    throw new Error(`Unable to locate SQL section: ${start}`);
  }
  return source.slice(startIndex, endIndex);
}

function compactSql(source: string): string {
  return source.replace(/--.*$/gm, "").replace(/\s+/g, " ").trim();
}

const compactMigration = compactSql(migration);
const claimFunction = sectionBetween(
  migration,
  "CREATE OR REPLACE FUNCTION bank_private.claim_provider_webhook_event(",
  "CREATE OR REPLACE FUNCTION public.bank_provider_webhook_claim(",
);
const bridgeFunction = sectionBetween(
  migration,
  "CREATE OR REPLACE FUNCTION public.bank_provider_webhook_claim(",
  "REVOKE ALL ON FUNCTION bank_private.claim_provider_webhook_event(",
);

describe("Standing Order webhook-event migration contract", () => {
  it("fails closed when any proposed relation already exists", () => {
    expect(migration).toContain("Fail closed on pre-existing relations");
    expect(migration).toContain("to_regclass('public.bank_provider_transactions') IS NOT NULL");
    expect(migration).toContain("to_regclass('public.bank_provider_webhook_events') IS NOT NULL");
    expect(migration).toContain("to_regclass('public.bank_provider_webhook_processing') IS NOT NULL");
    expect(migration).toContain("reconcile drift before applying migration");
    expect(compactMigration).not.toContain("CREATE TABLE IF NOT EXISTS public.bank_provider_");
  });

  it("creates the three durable relations with the required evidence and processing fields", () => {
    for (const table of [
      "public.bank_provider_transactions",
      "public.bank_provider_webhook_events",
      "public.bank_provider_webhook_processing",
    ]) {
      expect(migration).toContain(`CREATE TABLE ${table}`);
    }
    for (const column of [
      "raw_payload_hash text NOT NULL",
      "semantic_fingerprint text NOT NULL",
      "signature_verified boolean NOT NULL",
      "signature_key_version text",
      "payload_redacted jsonb NOT NULL DEFAULT '{}'::jsonb",
      "processing_status text NOT NULL DEFAULT 'RECEIVED'",
      "attempt_count integer NOT NULL DEFAULT 0",
      "lease_until timestamptz",
      "provider_account_key text NOT NULL",
      "client_reference text NOT NULL",
      "standing_order_run_id uuid NOT NULL",
    ]) {
      expect(migration).toContain(column);
    }
    expect(migration).not.toContain("raw_payload text");
    expect(migration).not.toContain("callback_secret text");
  });

  it("makes replay identity provider-account scoped and keeps provider identities indexed for conflict checks", () => {
    expect(migration).toContain(
      "ON public.bank_provider_webhook_events(provider, provider_account_key, semantic_fingerprint);",
    );
    expect(migration).toContain(
      "ON public.bank_provider_transactions(provider, provider_account_key, client_reference);",
    );
    expect(migration).toContain(
      "ON public.bank_provider_transactions(provider, provider_account_key, provider_uuid)",
    );
    expect(migration).toContain(
      "ON public.bank_provider_transactions(provider, provider_account_key, provider_reference)",
    );
    expect(migration).toContain("semantic_fingerprint <> p_semantic_fingerprint");
    expect(migration).toContain("ingest_outcome = 'CONFLICT'");
    expect(migration).toContain("processing_status = 'NEEDS_ATTENTION'");
  });

  it("uses a transaction-scoped advisory lock before replay and conflict reads", () => {
    const lockIndex = claimFunction.indexOf("PERFORM pg_advisory_xact_lock(");
    const existingReadIndex = claimFunction.indexOf("SELECT e.*");
    const conflictReadIndex = claimFunction.indexOf("SELECT EXISTS (");
    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(claimFunction).toContain("hashtextextended(");
    expect(claimFunction).toContain("p_provider || ':' || p_provider_account_key");
    expect(lockIndex).toBeLessThan(existingReadIndex);
    expect(lockIndex).toBeLessThan(conflictReadIndex);
    expect(claimFunction).toContain("EXCEPTION WHEN unique_violation THEN");
  });

  it("derives tenant and Standing Order relationships from the trusted provider transaction", () => {
    expect(claimFunction).toContain("FROM public.bank_provider_transactions pt");
    expect(claimFunction).toContain("pt.client_reference = p_client_reference");
    expect(claimFunction).toContain("v_company_id := v_provider_transaction.company_id");
    expect(claimFunction).toContain("v_standing_order_run_id := v_provider_transaction.standing_order_run_id");
    expect(claimFunction).toContain("v_payment_instruction_id := v_provider_transaction.payment_instruction_id");
    expect(claimFunction).not.toContain("p_company_id");
    expect(claimFunction).not.toContain("p_standing_order_run_id");
    expect(claimFunction).not.toContain("p_payment_instruction_id");
  });

  it("rejects service calls without verified signature state and requires an execution UUID", () => {
    expect(claimFunction).toContain("auth.role() <> 'service_role'");
    expect(claimFunction).toContain("IF NOT coalesce(p_signature_verified, false) THEN");
    expect(claimFunction).toContain("p_execution_id IS NULL");
    expect(claimFunction).toContain("p_raw_payload_hash !~ '^[0-9a-f]{64}$'");
    expect(claimFunction).toContain("p_semantic_fingerprint !~ '^[0-9a-f]{64}$'");
  });

  it("returns a durable replay result rather than inserting a second event", () => {
    expect(claimFunction).toContain("'replayed', true");
    expect(claimFunction).toContain("WHERE e.provider = p_provider");
    expect(claimFunction).toContain("AND e.semantic_fingerprint = p_semantic_fingerprint");
    expect(claimFunction).toContain("RETURN jsonb_build_object(");
    expect(claimFunction).toContain("A concurrent callback won the semantic-fingerprint race");
  });

  it("keeps conflicting provider identities as evidence and blocks automatic processing", () => {
    expect(claimFunction).toContain("p_provider_event_id IS NOT NULL AND e.provider_event_id = p_provider_event_id");
    expect(claimFunction).toContain("p_provider_uuid IS NOT NULL AND e.provider_uuid = p_provider_uuid");
    expect(claimFunction).toContain("p_provider_reference IS NOT NULL AND e.provider_reference = p_provider_reference");
    expect(claimFunction).toContain("CASE WHEN v_conflict THEN 'CONFLICT' ELSE coalesce(p_ingest_outcome, 'ACCEPTED') END");
    expect(claimFunction).toContain("CASE WHEN v_conflict THEN 'NEEDS_ATTENTION' ELSE 'RECEIVED' END");
    expect(bridgeFunction).not.toContain("confirm_provider_payment");
  });

  it("enforces append-only evidence and separates mutable processing state", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION bank_private.provider_webhook_event_immutable()");
    expect(migration).toContain("BEFORE UPDATE OR DELETE ON public.bank_provider_webhook_events");
    expect(migration).toContain("Provider webhook evidence is append-only.");
    expect(migration).toContain("bank_provider_webhook_processing");
    expect(migration).toContain("processed_at IS NULL OR processing_status IN ('PROCESSED', 'DUPLICATE')");
  });

  it("adds tenant-safe composite foreign keys and parent uniqueness", () => {
    expect(migration).toContain("bank_standing_order_runs_company_id_id_uq");
    expect(migration).toContain("bank_payment_instructions_company_id_id_uq");
    expect(migration).toContain("FOREIGN KEY (company_id, standing_order_run_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, payment_instruction_id)");
    expect(migration).toContain("REFERENCES public.bank_standing_order_runs(company_id, id)");
    expect(migration).toContain("REFERENCES public.bank_payment_instructions(company_id, id)");
  });

  it("enables tenant-scoped read policies but no browser write grants", () => {
    for (const table of [
      "public.bank_provider_transactions",
      "public.bank_provider_webhook_events",
      "public.bank_provider_webhook_processing",
    ]) {
      expect(migration).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      expect(migration).toContain(`REVOKE ALL ON TABLE ${table}`);
    }
    expect(migration).toContain("USING (company_id = public.current_company_id())");
    expect(migration).toContain("GRANT SELECT ON TABLE public.bank_provider_webhook_events\n  TO authenticated;");
    expect(migration).toContain("GRANT SELECT, INSERT\n  ON TABLE public.bank_provider_webhook_events\n  TO service_role;");
  });

  it("exposes the claim path only through a service-role bridge with an exact 13-argument contract", () => {
    const expectedGrantSignature =
      "  text, text, text, text, text, text, text, text,\n  boolean, text, text, jsonb, uuid";
    expect(compactMigration).toContain(
      `CREATE OR REPLACE FUNCTION public.bank_provider_webhook_claim( p_provider text, p_provider_account_key text, p_provider_event_id text, p_provider_uuid text, p_provider_reference text, p_client_reference text, p_raw_payload_hash text, p_semantic_fingerprint text, p_signature_verified boolean, p_signature_key_version text, p_ingest_outcome text, p_payload_redacted jsonb, p_execution_id uuid )`,
    );
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.bank_provider_webhook_claim(");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.bank_provider_webhook_claim(");
    expect(migration).toContain(expectedGrantSignature);
    expect(bridgeFunction).toContain("SECURITY INVOKER");
    expect(bridgeFunction).toContain("SET search_path = pg_catalog, public, bank_private");
  });
});
