import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const operations = readFileSync(new URL("./bankMfiOperations.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20250825_007_standing_order_server_implementation.sql", import.meta.url), "utf8");

describe("Standing Order server implementation contract", () => {
  it("validates the backward-compatible create payload and channel destinations", () => {
    expect(operations).toContain("export const standingOrderCreateInput = z.object");
    expect(operations).toContain("sourceAccountId: z.string().uuid()");
    expect(operations).toContain("idempotencyKey: z.string().uuid()");
    expect(operations).toContain("INTERNAL_TRANSFER");
    expect(operations).toContain("MOBILE_MONEY");
    expect(operations).toContain("Internal transfers require exactly one account destination");
    expect(operations).toContain("Mobile-money orders require exactly one MSISDN destination");
  });

  it("exposes typed lifecycle adapters through the verified server path", () => {
    for (const method of [
      "listStandingOrders",
      "getStandingOrder",
      "createStandingOrder",
      "submitStandingOrder",
      "approveStandingOrder",
      "activateStandingOrder",
      "pauseStandingOrder",
      "resumeStandingOrder",
      "cancelStandingOrder",
      "confirmStandingOrderProviderPayment",
      "retryStandingOrderRun",
      "runStandingOrders",
    ]) {
      expect(operations).toContain(`export async function ${method}`);
      expect(router).toContain(`${method}: protectedProcedure`);
    }
    expect(operations).toContain("resolveVerifiedProfile(req)");
    expect(operations).toContain("p_expected_version");
    expect(operations).toContain("p_idempotency_key");
  });

  it("defines idempotent maker-checker lifecycle and run-ledger RPCs", () => {
    for (const functionName of [
      "bank_create_standing_order",
      "bank_submit_standing_order",
      "bank_approve_standing_order",
      "bank_activate_standing_order",
      "bank_pause_standing_order",
      "bank_resume_standing_order",
      "bank_cancel_standing_order",
      "bank_run_standing_orders",
      "bank_confirm_standing_order_provider_payment",
      "bank_retry_standing_order_run",
    ]) {
      expect(migration).toContain(`FUNCTION public.${functionName}`);
    }
    expect(migration).toContain("IDEMPOTENCY_KEY_REUSED");
    expect(migration).toContain("MAKER_CHECKER_REQUIRED");
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
    expect(migration).toContain("bank_standing_order_runs");
    expect(migration).toContain("RUN_PENDING_PROVIDER");
    expect(migration).toContain("bank_post_transaction");
    expect(migration).toContain("bank_create_payment_instruction");
  });

  it("keeps direct database exposure bounded", () => {
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.bank_create_standing_order(jsonb) FROM PUBLIC, anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.bank_run_standing_orders(date,uuid,integer) FROM PUBLIC, anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.bank_standing_order_request_fingerprint(jsonb) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("SET search_path = public, auth");
    expect(migration).toContain("company_id = public.current_company_id()");
  });
});
