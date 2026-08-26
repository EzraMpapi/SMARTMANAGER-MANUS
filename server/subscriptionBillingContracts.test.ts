import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const migration = read("supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql");
const service = read("server/subscriptionBilling.ts");
const server = read("server/_core/apiApp.ts");
const workspace = read("client/src/components/SubscriptionBillingWorkspace.jsx");
const environment = read("server/_core/env.ts");
const hardening = read("supabase/migrations/20260822_025_subscription_billing_function_execute_hardening.sql");
const helperHardening = read("supabase/migrations/20260822_026_subscription_billing_helper_execute_hardening.sql");
const trialCatalog = read("supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql");
const trialHardening = read("supabase/migrations/20260822_029_subscription_trial_function_execute_hardening.sql");
const planAdminControls = read("supabase/migrations/20260822_030_subscription_plan_admin_controls.sql");
const billingSnapshotAliasFix = read("supabase/migrations/20260823_062_fix_billing_snapshot_event_alias.sql");
const dashboard = read("client/src/BusinessSphereDashboardCore.jsx");

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

  it("seeds the exact official monthly TZS catalog and prevents repeat free-trial entitlement", () => {
    [
      "'TWIGA'", "5000", "'TEMBO'", "10000", "'SIMBA'", "15000",
      "'SIMBA_SC'", "4500", "'YANGA_SC'", "9000", "'AZAM_FC'", "7000",
      "'Business'", "'Football'", "trial_days", "UNIQUE INDEX IF NOT EXISTS tenant_subscriptions_one_trial_per_company_idx",
      "FUNCTION public.billing_start_trial", "trial_already_granted",
    ].forEach((marker) => expect(trialCatalog).toContain(marker));
  });

  it("keeps trial state server-authoritative and emits idempotent expiry notifications without automatic charging", () => {
    [
      "trial_started_at", "trial_ends_at", "FUNCTION public.billing_reconcile_trial_expiry",
      "TRIAL_WARNING_", "TRIAL_EXPIRED", "subscription_notifications", "ON CONFLICT (company_id, notification_key) DO NOTHING",
      "FUNCTION public.billing_select_trial_plan",
    ].forEach((marker) => expect(trialCatalog).toContain(marker));
    expect(trialCatalog).not.toContain("auto_charge");
    [
      "REVOKE ALL ON FUNCTION public.billing_public_plan_catalog() FROM PUBLIC, anon, authenticated",
      "REVOKE ALL ON FUNCTION public.billing_start_trial(text) FROM PUBLIC, anon, authenticated",
      "REVOKE ALL ON FUNCTION public.billing_select_trial_plan(text) FROM PUBLIC, anon, authenticated",
      "GRANT EXECUTE ON FUNCTION public.billing_public_plan_catalog() TO service_role",
      "GRANT EXECUTE ON FUNCTION public.billing_reconcile_trial_expiry(uuid) TO service_role",
    ].forEach((marker) => expect(trialHardening).toContain(marker));
  });

  it("keeps official-plan price, feature, limit, theme, and trial controls behind audited administrator procedures", () => {
    [
      "FUNCTION public.billing_upsert_plan", "public.billing_is_platform_admin()",
      "Only a platform administrator can manage the official package catalog.",
      "plan_category", "visual_theme", "trial_days", "PERFORM public.billing_audit",
      "REVOKE ALL ON FUNCTION public.billing_upsert_plan(jsonb) FROM PUBLIC, anon",
    ].forEach((marker) => expect(planAdminControls).toContain(marker));
    expect(trialCatalog).toContain("billing_plan_audit_log");
    ["Feature flags JSON", "Module entitlements JSON", "Official global package", "Save audited package"].forEach((marker) => expect(workspace).toContain(marker));
  });

  it("keeps owner billing access consistent across frontend role casing", () => {
    expect(dashboard).toContain('const billingManagerRoles = new Set(["super administrator", "organization owner", "owner", "ceo", "cfo", "finance manager", "admin"]);');
    expect(dashboard).toContain('String(currentUser.role || "").trim().toLowerCase()');
  });

  it("routes Free activation separately and keeps paid checkout server-confirmed", () => {
    expect(workspace).toContain('const isFreePlan = plan.code === "FREE_15"');
    expect(workspace).toContain('onStartFree(plan)');
    expect(workspace).toContain('if (!subscription || expired) return onChoosePaidPlan(plan)');
    expect(workspace).toContain("Pay with USSD Push");
  });

  it("replaces the fragile billing event alias with an explicit row alias and keeps the RPC authenticated-only", () => {
    expect(billingSnapshotAliasFix).toContain("CREATE OR REPLACE FUNCTION public.billing_snapshot()");
    expect(billingSnapshotAliasFix).toContain("AS event_row");
    expect(billingSnapshotAliasFix).toContain("event_row.created_at DESC");
    expect(billingSnapshotAliasFix).not.toContain("to_jsonb(e)");
    expect(billingSnapshotAliasFix).toContain("REVOKE ALL ON FUNCTION public.billing_snapshot() FROM PUBLIC");
    expect(billingSnapshotAliasFix).toContain("GRANT EXECUTE ON FUNCTION public.billing_snapshot() TO authenticated");
  });

  it("registers the protected billing API and the webhook endpoint", () => {
    [
      'app.get("/api/billing/catalog", subscriptionBillingCatalogHandler)',
      'app.get("/api/billing/subscription", subscriptionBillingSnapshotHandler)',
      'app.post("/api/billing/free/start", subscriptionBillingStartFreePlanHandler)',
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

  it("presents Free-15 access and separates the Football Fans Special catalog without unlicensed logos", () => {
    [
      "FREE PLAN — 15 DAYS", "Free access has ended", "Choose Package",
      "SMART MANAGER BUSINESS PACKAGES", "FOOTBALL FANS SPECIAL", "Chagua timu yako na upate ofa maalum ya SMART MANAGER.",
      "Start Free", "Change package", "/ month",
    ].forEach((marker) => expect(workspace).toContain(marker));
    [
      'fetch("/api/billing/catalog")', "billing_start_free_plan", "preferredPlanCode", "FREE PLAN — 15 DAYS",
    ].forEach((marker) => expect(dashboard).toContain(marker));
  });
});
