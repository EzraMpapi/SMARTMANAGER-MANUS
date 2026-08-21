import { beforeEach, describe, expect, it, vi } from "vitest";

const sdkAuthenticate = vi.hoisted(() => vi.fn());
const getDbMock = vi.hoisted(() => vi.fn());
const settingsByTaskMock = vi.hoisted(() => vi.fn());
const summaryMock = vi.hoisted(() => vi.fn());
const recipientsMock = vi.hoisted(() => vi.fn());
const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: sdkAuthenticate } }));
vi.mock("./db", () => ({ getDb: getDbMock }));
vi.mock("./microfinanceOperations", () => ({ getMicrofinanceEscalationSettingsByTaskUid: settingsByTaskMock, getMicrofinanceParCollectionsSummaryForCompany: summaryMock, resolveMicrofinanceEscalationRecipients: recipientsMock }));
vi.mock("./transactionalEmail", () => ({ sendTransactionalEmail: sendEmailMock, workspaceEmailHtml: ({ body }: { body: string }) => `<article>${body}</article>` }));

import { scheduledMicrofinanceParCollectionsEscalationHandler } from "./scheduledMicrofinanceParCollectionsEscalation";

const companyId = "11111111-1111-4111-8111-111111111111";
const settings = { id: "settings-1", companyId, recipientMode: "roles" as const, managedRecipients: [], roleRecipients: ["Organization Owner"], timezone: "Africa/Dar_es_Salaam", scheduleLocalTime: "08:00", par30AlertThreshold: 10, overdueAmountAlertThreshold: 100_000, deliveryEnabled: true, scheduleCronTaskUid: "mfi-task-1" };
const summary = { generatedAt: "2026-08-21T05:00:00.000Z", totals: { activeLoans: 4, portfolioOutstanding: 1_000_000, overdueAmount: 160_000, par30Amount: 120_000, par30Ratio: 12, overdueInstallments: 2, openCollectionActions: 1 } };

function responseHarness() { const state = { statusCode: 200, body: null as unknown }; const res = { status: vi.fn((code: number) => { state.statusCode = code; return res; }), json: vi.fn((body: unknown) => { state.body = body; return res; }) }; return { res, state }; }
function dbWithDeliveries(deliveries: Array<{ status: "success" | "failed" | "retrying"; attempts: number }> = []) { return { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(deliveries) })) })) })), insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })), update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })) }; }

describe("scheduled microfinance PAR and collections escalation", () => {
  beforeEach(() => { vi.clearAllMocks(); settingsByTaskMock.mockResolvedValue(settings); summaryMock.mockResolvedValue(summary); recipientsMock.mockResolvedValue(["portfolio@tenant.example"]); sendEmailMock.mockResolvedValue({ deliveryId: "resend-1", acceptedAt: "2026-08-21T05:00:01.000Z" }); getDbMock.mockResolvedValue(dbWithDeliveries()); });

  it("rejects a non-cron caller before tenant settings or portfolio data are read", async () => {
    sdkAuthenticate.mockResolvedValue({ isCron: false }); const { res, state } = responseHarness();
    await scheduledMicrofinanceParCollectionsEscalationHandler({} as never, res as never);
    expect(state.statusCode).toBe(403); expect(settingsByTaskMock).not.toHaveBeenCalled(); expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("skips idempotently after an already successful tenant/day evaluation", async () => {
    sdkAuthenticate.mockResolvedValue({ isCron: true, taskUid: "mfi-task-1" }); getDbMock.mockResolvedValue(dbWithDeliveries([{ status: "success", attempts: 1 }])); const { res, state } = responseHarness();
    await scheduledMicrofinanceParCollectionsEscalationHandler({} as never, res as never);
    expect(state.body).toMatchObject({ ok: true, skipped: "already evaluated" }); expect(summaryMock).not.toHaveBeenCalled(); expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("delivers only privacy-safe aggregate portfolio risk counts to approved tenant recipients", async () => {
    sdkAuthenticate.mockResolvedValue({ isCron: true, taskUid: "mfi-task-1" }); const { res, state } = responseHarness();
    await scheduledMicrofinanceParCollectionsEscalationHandler({} as never, res as never);
    expect(state.body).toMatchObject({ ok: true, escalated: true, attempted: 1, succeeded: 1 }); expect(summaryMock).toHaveBeenCalledWith(companyId); expect(recipientsMock).toHaveBeenCalledWith(companyId, settings);
    const sent = sendEmailMock.mock.calls[0][0]; expect(sent.to).toEqual(["portfolio@tenant.example"]); expect(sent.text).toContain("PAR 30: 12.00%"); expect(sent.text).toContain("excludes borrower names, account numbers, phone numbers"); expect(sent.text).not.toContain("Neema Mushi"); expect(sent.idempotencyKey).toMatch(/^mfi-par-collections-escalation-/);
  });
});
