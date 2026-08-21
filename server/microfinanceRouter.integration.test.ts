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
});
