import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260824_067_subscription_user_management_compatibility.sql"),
  "utf8",
);

describe("Subscription and user-management compatibility migration", () => {
  it("is source-versioned, transactional, additive, and non-destructive", () => {
    expect(migration).toMatch(/^-- SMART MANAGER additive subscription \+ user-management compatibility migration/);
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS");
    expect(migration).not.toMatch(/\bDROP TABLE\b|\bTRUNCATE\b|\bDELETE FROM\b/i);
  });

  it("reuses Supabase Auth, profiles, companies, and memberships instead of creating a second identity model", () => {
    [
      "public.companies",
      "public.profiles",
      "auth.users",
      "public.company_memberships",
      "public.current_company_id()",
      "company_memberships_company_user_unique",
      "company_memberships_company_status_idx",
      "company_memberships_user_status_idx",
    ].forEach((marker) => expect(migration).toContain(marker));

    expect(migration).not.toMatch(/CREATE TABLE IF NOT EXISTS public\.(users|user_accounts|profile_identity_center)\b/i);
    expect(migration).not.toMatch(/CREATE TABLE IF NOT EXISTS public\.(subscription_items|subscription_entitlements|entitlements)\b/i);
    expect(migration).not.toMatch(/CREATE POLICY sm_[a-z_]+/i);
    expect(migration).not.toMatch(/CREATE OR REPLACE FUNCTION public\.subscription_user_/i);
  });

  it("covers the canonical subscription persistence surfaces without introducing a parallel entitlement table", () => {
    [
      "public.billing_plans",
      "public.billing_profiles",
      "public.tenant_subscriptions",
      "public.subscription_payments",
      "public.subscription_invoices",
      "public.subscription_usage",
      "public.subscription_events",
      "public.subscription_notifications",
      "public.billing_plan_audit_log",
      "module_entitlements",
      "billing_access_snapshot()",
    ].forEach((marker) => expect(migration).toContain(marker));

    expect(migration).not.toMatch(/CREATE TABLE IF NOT EXISTS public\.(subscription_items|subscription_entitlements|billing_entitlements)\b/i);
    expect(migration).not.toContain("INSERT INTO public.billing_plans");
  });

  it("preserves the final Free-15 and monthly paid-package contract", () => {
    [
      "billing_cycle = 'Monthly'",
      "billing_cycle text NOT NULL DEFAULT 'Monthly'",
      "billing_cycle IS DISTINCT FROM 'Monthly'",
      "FREE_15",
      "paid_months",
      "bonus_months",
      "total_months",
      "duration_days",
      "subscription_payments_idempotency_unique",
      "subscription_payments_one_pending_per_company_idx",
      "Existing subscription rows do not satisfy the final Monthly-only status contract",
    ].forEach((marker) => expect(migration).toContain(marker));
  });

  it("keeps direct writes narrow and provider settlement outside authenticated table policies", () => {
    [
      "public.billing_is_manager()",
      "public.billing_touch_updated_at()",
      "company_memberships_admin_write",
      "billing_profiles_read",
      "tenant_subscriptions_read",
      "subscription_payments_read",
      "subscription_invoices_read",
      "subscription_events_read",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_memberships TO authenticated",
    ].forEach((marker) => expect(migration).toContain(marker));

    expect(migration).not.toContain("CREATE POLICY sm_tenant_subscriptions_write");
    expect(migration).not.toContain("CREATE POLICY sm_subscription_payments_write");
    expect(migration).not.toContain("CREATE POLICY sm_subscription_invoices_write");
    expect(migration).not.toMatch(/CREATE OR REPLACE FUNCTION public\.(billing_start_free_plan|billing_apply_provider_status|billing_create_payment_intent)\b/);
  });

  it("enables tenant-scoped RLS and pins the new security-definer helpers", () => {
    [
      "ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.billing_plan_audit_log ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;",
      "public.current_company_id()",
      "public.billing_is_manager()",
      "CREATE POLICY profiles_read",
      "DO $$",
      "IF NOT EXISTS (SELECT 1 FROM pg_policy",
      "company_id = public.current_company_id()",
    ].forEach((marker) => expect(migration).toContain(marker));
  });
});
