// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { TrialExpiryNoticeGate } from "../client/src/components/TrialExpiryNoticeGate.jsx";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");
const migration = read("supabase/migrations/20260824_064_trial_expiry_notice_once.sql");
const service = read("server/subscriptionBilling.ts");
const api = read("server/_core/apiApp.ts");
const dashboard = read("client/src/BusinessSphereDashboard.jsx");
const billingWorkspace = read("client/src/components/SubscriptionBillingWorkspace.jsx");

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, json: async () => body });
}

const session = (userId: string, accessToken = `token-${userId}`) => ({ userId, accessToken, demo: false });

describe("Persistent trial-expiry notice contract", () => {
  it("stores notice state per subscription and authenticated user with a unique pair", () => {
    [
      "subscription_trial_expiry_notices",
      "subscription_id uuid NOT NULL REFERENCES public.tenant_subscriptions(id)",
      "user_id uuid NOT NULL REFERENCES auth.users(id)",
      "CONSTRAINT subscription_trial_expiry_notices_pair_unique UNIQUE (subscription_id, user_id)",
      "notice_shown boolean NOT NULL DEFAULT false",
      "shown_at timestamptz",
      "acknowledged_at timestamptz",
      "claim_token uuid",
      "claim_expires_at timestamptz",
    ].forEach((marker) => expect(migration).toContain(marker));
  });

  it("checks server trial timestamps and suppresses paid, cancelled, active, and already-shown states", () => {
    [
      "v_subscription.trial_started_at IS NULL OR v_subscription.trial_ends_at IS NULL",
      "v_subscription.trial_ends_at > v_now",
      "v_subscription.status IN ('Active', 'Grace', 'Pending', 'Superseded', 'Cancelled')",
      "IF v_notice.notice_shown THEN",
      "'reason', 'already_shown'",
      "'reason', 'trial_active'",
    ].forEach((marker) => expect(migration).toContain(marker));
  });

  it("uses a row lock and short claim lease to prevent duplicate displays across tabs/devices", () => {
    [
      "FOR UPDATE",
      "claim_expires_at > v_now",
      "'reason', 'claim_in_progress'",
      "claim_count = claim_count + 1",
      "v_now + interval '5 minutes'",
    ].forEach((marker) => expect(migration).toContain(marker));
  });

  it("records acknowledgement and Global Admin resets in the existing billing audit log", () => {
    [
      "billing_trial_expiry_notice_acknowledge(uuid)",
      "notice_shown = true",
      "acknowledged_at = now()",
      "SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_ACKNOWLEDGED",
      "billing_admin_trial_expiry_notice_snapshot",
      "billing_admin_trial_expiry_notice_reset",
      "Only a Global Admin can reset a trial-expiry notice.",
      "SUBSCRIPTION_TRIAL_EXPIRY_NOTICE_RESET",
      "reset_count = reset_count + 1",
      "PERFORM public.billing_audit",
    ].forEach((marker) => expect(migration).toContain(marker));
  });

  it("registers authenticated claim/ack routes and a protected admin support surface", () => {
    [
      "trialExpiryNoticeClaimHandler",
      "trialExpiryNoticeAcknowledgeHandler",
      "trialExpiryNoticeAdminSnapshotHandler",
      "trialExpiryNoticeAdminResetHandler",
      'app.get("/api/billing/trial-expiry-notice/claim", trialExpiryNoticeClaimHandler)',
      'app.post("/api/billing/trial-expiry-notice/ack", trialExpiryNoticeAcknowledgeHandler)',
      'app.get("/api/billing/admin/trial-expiry-notices", trialExpiryNoticeAdminSnapshotHandler)',
      'app.post("/api/billing/admin/trial-expiry-notices/reset", trialExpiryNoticeAdminResetHandler)',
      "ensurePlatformAdmin(profile.role)",
    ].forEach((marker) => expect(service + api).toContain(marker));
    expect(billingWorkspace).toContain("Trial notice support");
    expect(billingWorkspace).toContain("The notice was reset and the action was recorded in the audit log.");
  });

  it("mounts the gate in the shared authenticated root around internal and external portal returns", () => {
    expect(dashboard).toContain("const sharedTrialNoticeGate = <TrialExpiryNoticeGate session={session}");
    expect(dashboard).toContain("return <>{sharedTrialNoticeGate}<CustomerPortal");
    expect(dashboard).toContain("return <>{sharedTrialNoticeGate}<ExternalSupplierPortal");
    expect(dashboard).toContain("{sharedTrialNoticeGate}");
    expect(dashboard).toContain('import { TrialExpiryNoticeGate } from "./components/TrialExpiryNoticeGate";');
  });

  it("exposes a dedicated Global Admin dashboard panel using the audited support component", () => {
    expect(dashboard).toContain('aria-label="Global Admin trial-expiry notice panel"');
    expect(dashboard).toContain("<TrialNoticeAdmin api={dashboardTrialNoticeApi}");
    expect(dashboard).toContain("const isGlobalAdmin = [\"Super Administrator\", \"Platform Administrator\"]");
    expect(billingWorkspace).toContain("export function TrialNoticeAdmin");
  });
});

describe("TrialExpiryNoticeGate runtime", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    cleanup();
  });

  it("claims, acknowledges, and enables plan navigation for one expired user", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(await jsonResponse({ show: true, claimToken: "claim-a", trialStartedAt: "2026-01-01T00:00:00Z", trialEndsAt: "2026-01-31T00:00:00Z" }))
      .mockResolvedValueOnce(await jsonResponse({ acknowledged: true }));
    vi.stubGlobal("fetch", fetchMock);
    const onChoosePlan = vi.fn();

    render(React.createElement(TrialExpiryNoticeGate, { session: session("user-a"), onChoosePlan }));
    expect(await screen.findByRole("heading", { name: "Your free trial has ended" })).toBeTruthy();
    await waitFor(() => expect((screen.getByRole("button", { name: "Choose a plan" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Choose a plan" }));

    expect(onChoosePlan).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/billing/trial-expiry-notice/claim");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/billing/trial-expiry-notice/ack");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ claimToken: "claim-a" });
  });

  it("does not claim or display for active, paid, cancelled, or already-shown responses", async () => {
    for (const reason of ["trial_active", "active", "cancelled", "already_shown"]) {
      const fetchMock = vi.fn().mockResolvedValue(await jsonResponse({ show: false, reason }));
      vi.stubGlobal("fetch", fetchMock);
      const view = render(React.createElement(TrialExpiryNoticeGate, { session: session(`user-${reason}`), onChoosePlan: vi.fn() }));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(view.container.querySelector("#trial-expiry-title")).toBeNull();
      view.unmount();
      cleanup();
    }
  });

  it("keeps user A and user B independent and does not re-claim user A on the same render lifecycle", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(await jsonResponse({ show: false, reason: "already_shown" }))
      .mockResolvedValueOnce(await jsonResponse({ show: true, claimToken: "claim-b", trialStartedAt: "2026-01-01T00:00:00Z", trialEndsAt: "2026-01-31T00:00:00Z" }))
      .mockResolvedValueOnce(await jsonResponse({ acknowledged: true }));
    vi.stubGlobal("fetch", fetchMock);
    const onChoosePlan = vi.fn();
    const userA = render(React.createElement(TrialExpiryNoticeGate, { session: session("user-a"), onChoosePlan }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    userA.rerender(React.createElement(TrialExpiryNoticeGate, { session: session("user-a"), onChoosePlan }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    userA.unmount();
    const userB = render(React.createElement(TrialExpiryNoticeGate, { session: session("user-b"), onChoosePlan }));
    expect(await screen.findByRole("heading", { name: "Your free trial has ended" })).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/billing/trial-expiry-notice/claim");
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ claimToken: "claim-b" });
    userB.unmount();
  });
});
