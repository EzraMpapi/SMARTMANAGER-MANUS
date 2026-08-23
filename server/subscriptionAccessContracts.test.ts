import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.resolve(root, file), "utf8");
const migration = read("supabase/migrations/20260823_062_subscription_free_plan_model.sql");
const service = read("server/subscriptionBilling.ts");
const routes = read("server/_core/apiApp.ts");
const dashboard = read("client/src/BusinessSphereDashboard.jsx");
const profile = read("client/src/components/ProfileIdentityCenter.jsx");
const billing = read("client/src/components/SubscriptionBillingWorkspace.jsx");
const adapter = read("client/src/lib/subscriptionAccess.js");

describe("platform subscription access contracts", () => {
  it("reuses the existing subscription schema and exposes only a least-privilege authenticated access RPC", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.billing_access_snapshot()");
    expect(migration).toContain("public.tenant_subscriptions%ROWTYPE");
    expect(migration).toContain("public.billing_plans%ROWTYPE");
    expect(migration).toContain("SET search_path = pg_catalog, public, auth");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.billing_reconcile_free_plan_expiry(uuid) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.billing_start_free_plan(text) TO authenticated");
    expect(migration).not.toMatch(/CREATE TABLE/i);
    expect(migration).toContain("source_payment_id");
    expect(migration).toContain("v_subscription.status = 'Pending'");
    expect(migration).toContain("Workspace data is retained");
  });

  it("forwards the verified session through a dedicated access endpoint", () => {
    expect(service).toContain("export async function subscriptionBillingAccessHandler");
    expect(service).toContain('userRpc("billing_access_snapshot", token, {})');
    expect(routes).toContain('app.get("/api/billing/access", subscriptionBillingAccessHandler)');
    expect(routes).toContain("subscriptionBillingAccessHandler");
  });

  it("removes billing from the ERP module list but keeps protected shell entry points", () => {
    expect(dashboard).not.toContain('{ id: "billing", label: "Subscription Billing"');
    expect(dashboard).toContain('active === "billing"');
    expect(dashboard).toContain("canManageBilling");
    expect(dashboard).toContain("subscriptionAllowsModule(subscriptionAccess.access, id)");
    expect(dashboard).toContain("SubscriptionAccessBoundary");
    expect(dashboard).toContain("!IS_ISOLATED_SIGNUP_E2E");
    expect(profile).toContain('label="Subscription & Billing"');
    expect(profile).toContain("canManageBilling");
    expect(billing).toContain('data-testid="subscription-billing-center"');
    expect(billing).toContain("Platform subscription control center");
  });

  it("keeps onboarding on the database catalog and Free-15 activation RPC", () => {
    expect(dashboard).toContain('fetch("/api/billing/catalog")');
    expect(dashboard).toContain('callWorkspaceRpcWithSessionRefresh("billing_start_free_plan"');
    expect(dashboard).toContain("from the account menu");
    expect(dashboard).toContain("FREE_15");
    expect(dashboard).toContain("FREE kwa siku 15");
  });

  it("fails closed when access is unknown, pending, expired, required, or not server-allowed", () => {
    expect(adapter).toContain("source.allowed === true");
    expect(adapter).toContain("ACCESSIBLE_STATES");
    expect(adapter).toContain('cache: "no-store"');
    expect(adapter).not.toContain("localStorage");
    expect(adapter).not.toContain("sessionStorage");
    expect(dashboard).toContain("!subscriptionAccess.access.allowed");
    expect(dashboard).toContain("This module is not included in the company’s server-confirmed subscription plan.");
  });
});
