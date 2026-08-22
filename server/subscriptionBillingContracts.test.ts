import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const migration = read("supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql");
const service = read("server/subscriptionBilling.ts");
const server = read("server/_core/index.ts");
const workspace = read("client/src/components/SubscriptionBillingWorkspace.jsx");
const environment = read("server/_core/env.ts");
const hardening = read("supabase/migrations/20260822_025_subscription_billing_function_execute_hardening.sql");
const helperHardening = read("supabase/migrations/20260822_026_subscription_billing_helper_execute_hardening.sql");

describe("Subscription billing and HarakaPay contracts", () => {
  it("creates tenant-scoped subscription, payment, invoice, usage, profile, and audit persistence with RLS", () => {
    [
      "public.billing_plans",
      "public.billing_profiles",
      "public.tenant_subscriptions",
      "public.subscription_payments",
      "public.subscription_invoices",
      "public.subscription_usage",
      "public.subscription_events",
      "ENABLE ROW LEVEL SECURITY",
      "current_company_id()",
    ].forEach((marker) => expect(migration).toContain(marker));
  });

  it("enforces payment idempotency and prevents duplicate pending payment attempts per tenant", () => {
    expect(migration).toContain("CONSTRAINT subscription_payments_idempotency_unique UNIQUE (company_id, idempotency_key)");
    expect(migration).toContain("subscription_payments_one_pending_per_company_idx");
    expect(migration).toContain("A payment request is already pending for this workspace");
  });

  it("activates subscriptions only through an idempotent provider-status verification path", () => {
    expect(migration).toContain("FUNCTION public.billing_apply_provider_status");
    expect(migration).toContain("IF v_payment.status = 'Completed' THEN");
    expect(migration).toContain("Provider order verification failed.");
    expect(migration).toContain("Provider amount did not match the expected subscription amount.");
    expect(migration).toContain("SUBSCRIPTION_PAYMENT_COMPLETED");
    expect(migration).toContain("UNIQUE(payment_id)");
  });

  it("removes anonymous execution from billing functions while retaining only approved authenticated entry points", () => {
    expect(hardening).toContain("REVOKE ALL ON FUNCTION public.billing_apply_provider_status(uuid, text, text, jsonb) FROM anon, authenticated");
    expect(hardening).toContain("GRANT EXECUTE ON FUNCTION public.billing_create_payment_intent(uuid, text, text, text, text) TO authenticated");
    expect(helperHardening).toContain("REVOKE ALL ON FUNCTION public.billing_audit(text, text, uuid, uuid, text, text, jsonb) FROM PUBLIC");
  });

  it("keeps HarakaPay credentials and provider calls on the server", () => {
    expect(environment).toContain("harakaPayApiKey: process.env.HARAKAPAY_API_KEY");
    expect(service).toContain('headers: { "X-API-Key": apiKey');
    expect(service).toContain("function harakaConfiguration()");
    expect(service).toContain("fetchHarakaStatus(orderId)");
    expect(workspace).not.toContain("HARAKAPAY_API_KEY");
    expect(workspace).not.toContain("VITE_HARAKAPAY");
  });

  it("derives workspace authorization from a verified Supabase session and never trusts a browser company id", () => {
    expect(service).toContain("resolveVerifiedProfile");
    expect(service).toContain("ensureBillingManager(profile.role)");
    expect(service).not.toContain("companyId:");
    expect(migration).toContain("public.billing_require_manager()");
  });

  it("registers the protected billing API and the webhook endpoint", () => {
    [
      'app.get("/api/billing/subscription", subscriptionBillingSnapshotHandler)',
      'app.post("/api/billing/profile", subscriptionBillingProfileHandler)',
      'app.post("/api/billing/plans", subscriptionBillingPlanHandler)',
      'app.post("/api/payments/harakapay/collect", harakaPayCollectHandler)',
      'app.get("/api/payments/harakapay/status/:orderId", harakaPayStatusHandler)',
      'app.post("/api/payments/harakapay/webhook", harakaPayWebhookHandler)',
    ].forEach((marker) => expect(server).toContain(marker));
  });

  it("provides real checkout, waiting, retry, invoice, plan-administration, and usage states", () => {
    [
      "Pay with USSD Push",
      "Waiting for payment approval",
      "Payment history",
      "Subscription invoices & receipts",
      "Plan usage",
      "Plan settings",
      "payment status",
    ].forEach((marker) => expect(workspace).toContain(marker));
  });
});
