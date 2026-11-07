import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const operations = readFileSync(new URL("./bankMfiOperations.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20250825_007_standing_order_server_implementation.sql", import.meta.url), "utf8");
const searchPathHardening = readFileSync(new URL("../supabase/migrations/20260825_008_standing_order_security_hardening.sql", import.meta.url), "utf8");
const invokerHardening = readFileSync(new URL("../supabase/migrations/20260825_009_standing_order_invoker_helpers.sql", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../client/src/components/BankMfiWorkspace.jsx", import.meta.url), "utf8");
const legacyBanking = readFileSync(new URL("../client/src/dashboardExtractedModules.jsx", import.meta.url), "utf8");

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

  it("connects the reachable workspace to confirmed lifecycle actions", () => {
    expect(workspace).toContain("const [standingOrderRequestKey, setStandingOrderRequestKey] = useState(() => idempotencyKey())");
    expect(workspace).toContain("idempotencyKey: standingOrderRequestKey");
    expect(workspace).toContain("trpc.bankMfi.submitStandingOrder.useMutation");
    expect(workspace).toContain("trpc.bankMfi.approveStandingOrder.useMutation");
    expect(workspace).toContain("trpc.bankMfi.activateStandingOrder.useMutation");
    expect(workspace).toContain("trpc.bankMfi.pauseStandingOrder.useMutation");
    expect(workspace).toContain("trpc.bankMfi.resumeStandingOrder.useMutation");
    expect(workspace).toContain("trpc.bankMfi.cancelStandingOrder.useMutation");
    expect(workspace).toContain("expectedVersion: Number(order.version ?? 0)");
    expect(workspace).toContain("status === \"PENDING_APPROVAL\"");
    expect(workspace).toContain("Provider confirmation required; not settled.");
  });

  it("replaces the legacy notification-only Standing Order button with a workflow handoff", () => {
    expect(legacyBanking).not.toContain('notify("Set up standing order — form")');
    expect(legacyBanking).toContain("onOpenStandingOrderWorkflow");
    expect(legacyBanking).toContain("Open Standing Order workflow");
  });

  it("keeps direct database exposure bounded", () => {
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.bank_create_standing_order(jsonb) FROM PUBLIC, anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.bank_run_standing_orders(date,uuid,integer) FROM PUBLIC, anon");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.bank_standing_order_request_fingerprint(jsonb) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("SET search_path = public, auth");
    expect(migration).toContain("company_id = public.current_company_id()");
  });

  it("hardens Standing Order helper search paths and SECURITY DEFINER exposure", () => {
    expect(searchPathHardening).toContain("SET search_path = pg_catalog, public, auth");
    expect(searchPathHardening).toContain("ALTER FUNCTION public.bank_list_standing_orders(text, text, integer, integer)");
    expect(searchPathHardening).toContain("SECURITY INVOKER");
    expect(searchPathHardening).toContain("REVOKE ALL ON FUNCTION public.bank_standing_order_normalize_msisdn(text)");
    expect(searchPathHardening).toContain("GRANT EXECUTE ON FUNCTION public.bank_create_standing_order(jsonb) TO authenticated");
    expect(invokerHardening).toContain("ALTER FUNCTION public.bank_standing_order_raise(text, text)");
    expect(invokerHardening).toContain("ALTER FUNCTION public.bank_standing_order_response(uuid, boolean, uuid, uuid, uuid)");
    expect(invokerHardening).toContain("ALTER FUNCTION public.bank_get_standing_order(uuid)");
    expect(invokerHardening).toContain("REVOKE ALL ON FUNCTION public.bank_standing_order_response(uuid, boolean, uuid, uuid, uuid)");
    expect(invokerHardening).toContain("GRANT EXECUTE ON FUNCTION public.bank_get_standing_order(uuid) TO authenticated");
  });
});
