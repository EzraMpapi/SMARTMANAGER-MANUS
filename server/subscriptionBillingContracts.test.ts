import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");
const migration = read("supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql");
const model = read("supabase/migrations/20260823_062_subscription_free_plan_model.sql");
const service = read("server/subscriptionBilling.ts");
const server = read("server/_core/apiApp.ts");
const workspace = read("client/src/components/SubscriptionBillingWorkspace.jsx");
const environment = read("server/_core/env.ts");
const dashboard = read("client/src/BusinessSphereDashboard.jsx");

const activeRuntimeSource = [service, server, workspace, dashboard];

describe("Subscription billing and HarakaPay contracts", () => {
  it("reuses tenant-scoped subscription persistence with RLS", () => {
    [
      "public.billing_plans", "public.billing_profiles", "public.tenant_subscriptions",
      "public.subscription_payments", "public.subscription_invoices", "public.subscription_usage",
      "public.subscription_events", "ENABLE ROW LEVEL SECURITY", "current_company_id()",
    ].forEach((marker) => expect(migration).toContain(marker));
    expect(model).not.toMatch(/CREATE TABLE/i);
    expect(model).toContain("ADD COLUMN IF NOT EXISTS paid_months");
    expect(model).toContain("ADD COLUMN IF NOT EXISTS bonus_months");
    expect(model).toContain("ADD COLUMN IF NOT EXISTS total_months");
    expect(model).toContain("ADD COLUMN IF NOT EXISTS duration_days");
  });

  it("enforces the final catalog and the exact paid-plus-bonus contract", () => {
    [
      "'FREE_15'", "'FREE'", "5000", "10000", "15000", "4500", "9000", "7000",
      "paid_months", "bonus_months", "total_months", "duration_days",
      "FREE PLAN — 15 DAYS", "1 month paid + 1 month bonus", "2 months total access",
      "+ 1 MONTH BONUS · 2 MONTHS ACCESS",
    ].forEach((marker) => expect(model + workspace).toContain(marker));
    expect(model).toContain("monthly_price = 0");
    expect(model).toContain("duration_days = 15");
    expect(model).toContain("paid_months = 1");
    expect(model).toContain("bonus_months = 1");
    expect(model).toContain("total_months = 2");
    expect(model).toContain("make_interval(months => v_plan.total_months)");
  });

  it("starts FREE_15 without payment and transitions to RequiresPlan after 15 days", () => {
    [
      "FUNCTION public.billing_start_free_plan", "Only the FREE_15 package can be activated without payment.",
      "interval '15 days'", "status = 'RequiresPlan'", "FREE_EXPIRED",
      "Free access has ended", "No automatic charge was made", "FREE kwa Siku 15",
    ].forEach((marker) => expect(model).toContain(marker));
    expect(model).toContain("GRANT EXECUTE ON FUNCTION public.billing_start_free_plan(text) TO authenticated");
    expect(model).toContain("GRANT EXECUTE ON FUNCTION public.billing_reconcile_free_plan_expiry(uuid) TO service_role");
  });

  it("forces paid checkout to monthly payment and verifies package amount and duration server-side", () => {
    [
      "CHECK (billing_cycle = 'Monthly')", "All packages are billed monthly.",
      "code <> 'FREE_15'", "v_plan.monthly_price <> v_payment.amount",
      "v_plan.paid_months <> 1", "v_plan.bonus_months <> 1", "v_plan.total_months <> 2",
      "make_interval(months => v_plan.total_months)", "Provider amount did not match the expected subscription amount.",
    ].forEach((marker) => expect(model).toContain(marker));
    expect(service).toContain('const billingCycle = "Monthly"');
    expect(workspace).toContain("Amount to pay");
    expect(workspace).toContain("Total access: 2 months");
    expect(workspace).not.toContain("Annual");
  });

  it("keeps payment idempotency and provider credentials server-side", () => {
    expect(migration).toContain("CONSTRAINT subscription_payments_idempotency_unique UNIQUE (company_id, idempotency_key)");
    expect(migration).toContain("subscription_payments_one_pending_per_company_idx");
    expect(model).toContain("Provider order verification failed.");
    expect(environment).toContain("harakaPayApiKey: process.env.HARAKAPAY_API_KEY");
    expect(service).toContain('headers: { "X-API-Key": apiKey');
    expect(workspace).not.toContain("HARAKAPAY_API_KEY");
    expect(workspace).not.toContain("VITE_HARAKAPAY");
  });

  it("uses verified session tenancy and protected routes", () => {
    expect(service).toContain("resolveVerifiedProfile");
    expect(service).toContain("ensureBillingManager(profile.role)");
    expect(model).toContain("public.billing_require_manager()");
    expect(server).toContain('app.post("/api/billing/free/start", subscriptionBillingStartFreePlanHandler)');
    expect(server).toContain('app.post("/api/payments/harakapay/collect", harakaPayCollectHandler)');
    expect(server).toContain('app.post("/api/scheduled/subscriptionFreePlanLifecycle", scheduledSubscriptionFreePlanLifecycleHandler)');
    expect(server).not.toContain("billing/trial");
    expect(server).not.toContain("subscriptionTrial");
  });

  it("renders the final responsive package experience with bilingual-ready labels", () => {
    [
      "FREE PLAN — 15 DAYS", "FREE FOR 15 DAYS", "Start Free", "Your Free access has ended.",
      "Choose Package", "SMART MANAGER BUSINESS PACKAGES", "FOOTBALL FANS SPECIAL",
      "Chagua timu yako na upate ofa maalum ya SMART MANAGER.", "+ 1 MONTH BONUS · 2 MONTHS ACCESS",
      "Pay with USSD Push", "Phone", "Amount to pay", "2 months access",
    ].forEach((marker) => expect(workspace).toContain(marker));
    expect(workspace).not.toMatch(/30.?day (?:free )?trial|Start Free Trial|Trial Activated|Trial Expiry/i);
    expect(dashboard).toContain('callWorkspaceRpcWithSessionRefresh("billing_start_free_plan"');
    expect(dashboard).toContain("FREE kwa siku 15");
    expect(dashboard).not.toMatch(/30.?day (?:free )?trial|billing_start_trial|Trial Activated|Trial Expiry/i);
  });

  it("keeps the public catalog curated through the server endpoint", () => {
    expect(server).toContain('app.get("/api/billing/catalog", subscriptionBillingCatalogHandler)');
    expect(service).toContain('serviceRpc("billing_public_plan_catalog", {})');
    expect(model).toContain("REVOKE ALL ON FUNCTION public.billing_public_plan_catalog() FROM PUBLIC, anon, authenticated");
    expect(model).toContain("GRANT EXECUTE ON FUNCTION public.billing_public_plan_catalog() TO service_role");
  });

  it("contains no retired trial implementation in active source files", () => {
    for (const source of activeRuntimeSource) {
      expect(source).not.toMatch(/trial_days|trial_started_at|trial_ends_at|billing_start_trial|billing_select_trial_plan|billing_reconcile_trial_expiry|30.?day free trial|Start Free Trial|Trial Activated|Trial Expiry/i);
    }
  });
});
