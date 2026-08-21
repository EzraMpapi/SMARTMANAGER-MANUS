import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

const companyId = "11111111-1111-4111-8111-111111111111";

function callerFor(role: string, requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }>) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ id: "mfi-user" }), { status: 200, headers: { "content-type": "application/json" } });
    if (url.includes("/rest/v1/profiles?")) return new Response(JSON.stringify([{ id: "mfi-user", company_id: companyId, role, full_name: "MFI Test User" }]), { status: 200, headers: { "content-type": "application/json" } });
    const method = init?.method || "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : null;
    requests.push({ url, method, body });
    if (method === "POST") return new Response(JSON.stringify([{ id: "22222222-2222-4222-8222-222222222222", ...(body || {}) }]), { status: 201, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
  }));
  return appRouter.createCaller({
    req: { headers: { authorization: "Bearer mfi-test-token" } } as any,
    res: {} as any,
    user: { id: 1, openId: "sup_mfi-user", name: "MFI Test User", email: "mfi@example.invalid", loginMethod: "supabase", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any,
  });
}

const product = {
  name: "Business working capital", code: "BWC-01", minimumPrincipal: 100_000, maximumPrincipal: 5_000_000,
  annualInterestRate: 24, setupFeeRate: 2, insuranceFeeRate: 1, penaltyRateMonthly: 3,
  collectorCommissionRate: 1, termMinMonths: 1, termMaxMonths: 12, repaymentFrequency: "monthly" as const,
  requiresGuarantor: false, requiresCollateral: false,
};
const scoringRules = { kycWeight: 20, affordabilityWeight: 30, repaymentHistoryWeight: 20, guarantorWeight: 15, collateralWeight: 15, maxDebtServiceRatio: 40, approvalThreshold: 70, reviewThreshold: 50 };
const escalationRules = { recipientMode: "roles" as const, roleRecipients: ["Company Administrator", "Collections Officer"] as const, managedRecipients: [], scheduleLocalTime: "12:00", timezone: "Africa/Dar_es_Salaam" as const, deliveryEnabled: false, par30AlertThreshold: 10, overdueAmountAlertThreshold: 0 };

describe("protected microfinance router integration", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates loan products only through the authenticated tenant-scoped route", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerFor("Organization Owner", requests);

    const result = await caller.microfinance.createLoanProduct(product);

    expect(result.id).toBe("22222222-2222-4222-8222-222222222222");
    const productWrite = requests.find((request) => request.method === "POST" && request.url.includes("/rest/v1/mfi_loan_products"));
    expect(productWrite?.body?.company_id).toBe(companyId);
    expect(productWrite?.body?.data).toMatchObject({ code: "BWC-01", annualInterestRate: 24 });
    const auditWrite = requests.find((request) => request.method === "POST" && request.url.includes("/rest/v1/mfi_audit_logs"));
    expect(auditWrite?.body?.company_id).toBe(companyId);
  });

  it("denies non-microfinance staff before an unauthorized product write is attempted", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerFor("Customer Support Agent", requests);

    await expect(caller.microfinance.createLoanProduct(product)).rejects.toThrow("cannot manage loan products");
    expect(requests.some((request) => request.url.includes("/rest/v1/mfi_loan_products"))).toBe(false);
  });

  it("persists administrator-approved credit rules through the authenticated tenant route", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerFor("Organization Owner", requests);
    const result = await caller.microfinance.saveCreditScoringSettings(scoringRules);

    expect(result.settings.approvalThreshold).toBe(70);
    const scoringWrite = requests.find((request) => request.method === "POST" && request.url.includes("/rest/v1/mfi_credit_scoring_settings"));
    expect(scoringWrite?.body?.company_id).toBe(companyId);
    expect(scoringWrite?.body?.data).toMatchObject(scoringRules);
  });

  it("blocks unapproved roles from changing a tenant credit-rule set before it is loaded or written", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerFor("Customer Support Agent", requests);
    await expect(caller.microfinance.saveCreditScoringSettings(scoringRules)).rejects.toThrow("cannot manage credit scoring configuration");
    expect(requests.some((request) => request.url.includes("mfi_credit_scoring_settings"))).toBe(false);
  });

  it("persists an administrator-selected escalation recipient role set without broadening delivery", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerFor("Organization Owner", requests);
    const result = await caller.microfinance.saveEscalationSettings(escalationRules);

    expect(result.settings.roleRecipients).toEqual(["Company Administrator", "Collections Officer"]);
    const escalationWrite = requests.find((request) => request.method === "POST" && request.url.includes("/rest/v1/mfi_par_escalation_settings"));
    expect(escalationWrite?.body?.company_id).toBe(companyId);
    expect(escalationWrite?.body?.data).toMatchObject({ roleRecipients: ["Company Administrator", "Collections Officer"], scheduleLocalTime: "12:00", deliveryEnabled: false });
  });
});
