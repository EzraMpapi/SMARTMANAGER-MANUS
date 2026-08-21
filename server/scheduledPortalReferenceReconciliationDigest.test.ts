import { beforeEach, describe, expect, it, vi } from "vitest";

const sdkAuthenticate = vi.hoisted(() => vi.fn());
const getDbMock = vi.hoisted(() => vi.fn());
const settingsByTaskMock = vi.hoisted(() => vi.fn());
const summaryMock = vi.hoisted(() => vi.fn());
const recipientsMock = vi.hoisted(() => vi.fn());
const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: sdkAuthenticate } }));
vi.mock("./db", () => ({ getDb: getDbMock }));
vi.mock("./healthcarePortalReconciliationWorkflow", () => ({
  getPortalReferenceDigestSettingsByTaskUid: settingsByTaskMock,
  getPortalReferenceDailySummaryForCompany: summaryMock,
  resolvePortalReferenceDigestRecipients: recipientsMock,
}));
vi.mock("./transactionalEmail", () => ({
  sendTransactionalEmail: sendEmailMock,
  workspaceEmailHtml: ({ body }: { body: string }) => `<article>${body}</article>`,
}));

import { scheduledPortalReferenceReconciliationDigestHandler } from "./scheduledPortalReferenceReconciliationDigest";

const companyId = "11111111-1111-4111-8111-111111111111";
const settings = { id: "settings-1", companyId, recipientMode: "both" as const, roleRecipients: ["Clinic Administrator"], managedRecipients: ["manager@clinic.example"], timezone: "Africa/Dar_es_Salaam", deliveryEnabled: true, scheduleCronTaskUid: "task-1" };

function responseHarness() {
  const state = { statusCode: 200, body: null as unknown };
  const res = {
    status: vi.fn((code: number) => { state.statusCode = code; return res; }),
    json: vi.fn((body: unknown) => { state.body = body; return res; }),
  };
  return { res, state };
}

function dbWithDeliveries(deliveries: Array<{ status: "success" | "failed" | "retrying"; attempts: number }> = []) {
  return {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(deliveries) })) })) })),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
  };
}

describe("scheduled portal-reference reconciliation digest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsByTaskMock.mockResolvedValue(settings);
    summaryMock.mockResolvedValue({ generatedAt: "2026-08-21T07:38:00.000Z", totals: { unlinkedPatients: 2, pendingApprovals: 1, readyToApply: 3, appliedToday: 1, rejectedToday: 0, invalidToday: 1 } });
    recipientsMock.mockResolvedValue(["manager@clinic.example"]);
    sendEmailMock.mockResolvedValue({ deliveryId: "resend-1", acceptedAt: "2026-08-21T07:38:01.000Z" });
    getDbMock.mockResolvedValue(dbWithDeliveries());
  });

  it("rejects non-cron callers before tenant settings or email delivery is read", async () => {
    sdkAuthenticate.mockResolvedValue({ isCron: false });
    const { res, state } = responseHarness();
    await scheduledPortalReferenceReconciliationDigestHandler({} as never, res as never);
    expect(state.statusCode).toBe(403);
    expect(settingsByTaskMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("returns a successful idempotent skip when the tenant/day digest already succeeded", async () => {
    sdkAuthenticate.mockResolvedValue({ isCron: true, taskUid: "task-1" });
    getDbMock.mockResolvedValue(dbWithDeliveries([{ status: "success", attempts: 1 }]));
    const { res, state } = responseHarness();
    await scheduledPortalReferenceReconciliationDigestHandler({} as never, res as never);
    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ ok: true, skipped: "already delivered" });
    expect(summaryMock).not.toHaveBeenCalled();
    expect(recipientsMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("delivers a privacy-safe summary only to tenant-approved recipients and records aggregate telemetry", async () => {
    sdkAuthenticate.mockResolvedValue({ isCron: true, taskUid: "task-1" });
    const db = dbWithDeliveries();
    getDbMock.mockResolvedValue(db);
    const { res, state } = responseHarness();
    await scheduledPortalReferenceReconciliationDigestHandler({} as never, res as never);
    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ ok: true, attempted: 1, succeeded: 1 });
    expect(settingsByTaskMock).toHaveBeenCalledWith("task-1");
    expect(summaryMock).toHaveBeenCalledWith(companyId);
    expect(recipientsMock).toHaveBeenCalledWith(companyId, settings);
    const sent = sendEmailMock.mock.calls[0][0];
    expect(sent.to).toEqual(["manager@clinic.example"]);
    expect(sent.text).toContain("Unlinked patient records: 2");
    expect(sent.text).toContain("excludes patient names, phone numbers, portal references, clinical information");
    expect(sent.text).not.toContain("Asha Mtemi");
    expect(sent.text).not.toContain("+255");
    expect(sent.idempotencyKey).toMatch(/^portal-reference-digest-/);
  });
});
