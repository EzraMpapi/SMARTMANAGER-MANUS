import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const migration = read("supabase/migrations/20260824_061_subscription_activation_flow_repair.sql");
const workspace = read("client/src/components/SubscriptionBillingWorkspace.jsx");
const access = read("client/src/lib/subscriptionAccess.js");
const service = read("server/subscriptionBilling.ts");
const routes = read("server/_core/apiApp.ts");

describe("subscription activation repair contracts", () => {
  it("fixes the deployed billing snapshot alias without changing the existing table model", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.billing_snapshot()");
    expect(migration).toContain("AS event_row");
    expect(migration).toContain("to_jsonb(event_row) ORDER BY event_row.created_at DESC");
    expect(migration).not.toContain("to_jsonb(e)");
    expect(migration).not.toMatch(/CREATE TABLE/i);
  });

  it("serializes and idempotently activates the one-time Free plan", () => {
    expect(migration).toContain("billing_start_free_plan(text)");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("smart_manager:billing_free_plan:");
    expect(migration).toContain("offer_code = 'FREE_15'");
    expect(migration).toContain("status = 'Active'");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.billing_start_free_plan(text) TO authenticated");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.billing_start_free_plan(text) FROM PUBLIC, anon, service_role");
  });

  it("keeps the Free CTA on the authenticated API and refreshes server-confirmed access", () => {
    expect(workspace).toContain('api("/api/billing/free/start"');
    expect(workspace).toContain('"smart-manager:subscription-updated"');
    expect(workspace).toContain('if (["Active", "Grace"].includes(String(freePlan.status || ""))) onBack?.();');
    expect(access).toContain('window.addEventListener("smart-manager:subscription-updated"');
    expect(access).toContain('fetch("/api/billing/access"');
    expect(access).toContain('cache: "no-store"');
    expect(access).not.toContain("localStorage");
  });

  it("keeps paid activation behind server payment verification and exposes the protected routes", () => {
    expect(service).toContain('userRpc<PaymentIntent>("billing_create_payment_intent"');
    expect(service).toContain('serviceRpc("billing_apply_provider_status"');
    expect(service).toContain("fetchHarakaStatus(orderId)");
    expect(workspace).toContain('if (result.status === "Completed") onBack?.();');
    expect(routes).toContain('app.post("/api/billing/free/start", subscriptionBillingStartFreePlanHandler)');
    expect(routes).toContain('app.get("/api/payments/harakapay/status/:orderId", harakaPayStatusHandler)');
    expect(routes).toContain('app.post("/api/payments/harakapay/webhook", harakaPayWebhookHandler)');
  });
});
