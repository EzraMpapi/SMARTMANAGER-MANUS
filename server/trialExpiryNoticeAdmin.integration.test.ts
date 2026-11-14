import express from "express";
import http from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { resolveVerifiedProfile } = vi.hoisted(() => ({ resolveVerifiedProfile: vi.fn() }));
vi.mock("./aiApprovals", () => ({ resolveVerifiedProfile }));
vi.mock("./_core/env", () => ({ ENV: { supabaseUrl: "https://trial-notice.local", supabaseAnonKey: "anon-test-key" } }));

import {
  trialExpiryNoticeAdminResetHandler,
  trialExpiryNoticeAdminSnapshotHandler,
} from "./subscriptionBilling";

type AuditRecord = { eventType: string; subject: string; reason: string };

function startTestServer() {
  const app = express();
  app.use(express.json());
  app.get("/api/billing/admin/trial-expiry-notices", trialExpiryNoticeAdminSnapshotHandler);
  app.post("/api/billing/admin/trial-expiry-notices/reset", trialExpiryNoticeAdminResetHandler);
  return new Promise<{ server: http.Server; baseUrl: string }>((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("The local test server did not expose a TCP address.");
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

describe("Global Admin trial-notice local HTTP integration", () => {
  let server: http.Server | undefined;
  let baseUrl = "";
  let auditRecords: AuditRecord[] = [];
  let noticeRow = { company_id: "company-a", user_id: "user-a", subscription_id: "subscription-a", notice_shown: true, reset_count: 0 };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    auditRecords = [];
    noticeRow = { company_id: "company-a", user_id: "user-a", subscription_id: "subscription-a", notice_shown: true, reset_count: 0 };
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "admin-a", company_id: "company-a", role: "Platform Administrator", full_name: "Global Admin" }, token: "session-admin-a" });
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (!url.startsWith("https://trial-notice.local/")) return originalFetch(input, init);
      const functionName = url.split("/rpc/")[1];
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (functionName === "billing_admin_trial_expiry_notice_reset") {
        auditRecords.push({ eventType: "SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_RESET", subject: body.p_subscription_id, reason: body.p_reason });
        noticeRow = { ...noticeRow, notice_shown: false, reset_count: noticeRow.reset_count + 1 };
        return new Response(JSON.stringify({ reset: true, notice: noticeRow, auditEvent: "SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_RESET" }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (functionName === "billing_admin_trial_expiry_notice_snapshot") {
        return new Response(JSON.stringify({ rows: [noticeRow], auditEvents: auditRecords }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ message: `Unexpected RPC ${functionName}` }), { status: 404, headers: { "content-type": "application/json" } });
    }) as typeof globalThis.fetch;
    ({ server, baseUrl } = await startTestServer());
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    resolveVerifiedProfile.mockReset();
    if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
    server = undefined;
  });

  it("resets one notice over HTTP, persists the reset state, and verifies the audit event", async () => {
    const resetResponse = await fetch(`${baseUrl}/api/billing/admin/trial-expiry-notices/reset`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-supabase-authorization": "Bearer session-admin-a" },
      body: JSON.stringify({ companyId: "company-a", userId: "user-a", subscriptionId: "subscription-a", reason: "Disposable fixture reset" }),
    });
    expect(resetResponse.status).toBe(200);
    await expect(resetResponse.json()).resolves.toMatchObject({ reset: true, auditEvent: "SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_RESET" });

    const snapshotResponse = await fetch(`${baseUrl}/api/billing/admin/trial-expiry-notices?companyId=company-a&userId=user-a&subscriptionId=subscription-a`, {
      headers: { "x-supabase-authorization": "Bearer session-admin-a" },
    });
    expect(snapshotResponse.status).toBe(200);
    const snapshot = await snapshotResponse.json();
    expect(snapshot.rows[0]).toMatchObject({ notice_shown: false, reset_count: 1 });
    expect(snapshot.auditEvents).toEqual([{ eventType: "SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_RESET", subject: "subscription-a", reason: "Disposable fixture reset" }]);

    const rpcCalls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(([input]) => String(input).includes("/rest/v1/rpc/"));
    expect(rpcCalls).toHaveLength(2);
    expect(rpcCalls[0][1]).toMatchObject({ headers: expect.objectContaining({ authorization: "Bearer session-admin-a" }) });
  });

  it("denies the same reset route to a non-Global-Admin role", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "employee-a", company_id: "company-a", role: "Employee", full_name: "Employee" }, token: "session-employee-a" });
    const response = await fetch(`${baseUrl}/api/billing/admin/trial-expiry-notices/reset`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-supabase-authorization": "Bearer session-employee-a" },
      body: JSON.stringify({ companyId: "company-a", userId: "user-a", subscriptionId: "subscription-a", reason: "Invalid role test" }),
    });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "Only a Global Admin can manage trial-expiry notice support controls." });
    expect(auditRecords).toEqual([]);
  });
});
