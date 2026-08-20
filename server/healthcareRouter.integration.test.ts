import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

const companyId = "11111111-1111-4111-8111-111111111111";
const recordId = "22222222-2222-4222-8222-222222222222";

function callerForRole(role: string, requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ id: "supabase-user-1" }), { status: 200, headers: { "content-type": "application/json" } });
    if (url.includes("/rest/v1/profiles?")) return new Response(JSON.stringify([{ id: "supabase-user-1", company_id: companyId, role, full_name: "Healthcare Test User" }]), { status: 200, headers: { "content-type": "application/json" } });
    const method = init?.method || "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : null;
    requests.push({ url, method, body });
    if (method === "GET") return new Response(JSON.stringify([{ id: recordId, company_id: companyId, name: "Existing healthcare record", status: "Open", amount: 50000, notes: null, data: {} }]), { status: 200, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify([{ id: recordId, ...(body || {}) }]), { status: method === "POST" ? 201 : 200, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return appRouter.createCaller({
    req: { headers: { authorization: "Bearer valid-healthcare-token" } } as any,
    res: {} as any,
    user: { id: 1, openId: "sup_supabase-user-1", name: "Healthcare Test User", email: "healthcare@example.invalid", loginMethod: "supabase", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any,
  });
}

describe("protected healthcare router integration", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("saves diagnostics, pharmacy, billing, claims, reports, and notifications through the authenticated company route", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerForRole("Clinic Administrator", requests);
    const patientId = "33333333-3333-4333-8333-333333333333";
    const doctorId = "44444444-4444-4444-8444-444444444444";
    const records = [
      ["hc_lab_orders", "Asha Mtemi · Laboratory order", "Ordered", { patientId, patientName: "Asha Mtemi", doctorId, doctorName: "Dr. Mhando", orderedAt: "2026-08-20T10:00:00.000Z", tests: ["Full blood count"], priority: "Routine", results: "" }],
      ["hc_prescriptions", "Asha Mtemi · Prescription", "Pending dispense", { patientId, patientName: "Asha Mtemi", doctorId, doctorName: "Dr. Mhando", issuedAt: "2026-08-20T10:00:00.000Z", medications: [{ name: "Paracetamol", dose: "500 mg", frequency: "TID", days: "3" }], instructions: "After meals" }],
      ["hc_invoices", "Asha Mtemi · Invoice", "Awaiting insurer", { patientId, patientName: "Asha Mtemi", issuedAt: "2026-08-20T10:00:00.000Z", services: [{ name: "Consultation", amount: 50000 }], subtotal: 50000, discountPercent: 0, discountAmount: 0, balance: 50000, paymentMethod: "Insurance", insuranceProvider: "NHIF", insuranceClaimStatus: "Submitted" }],
      ["hc_insurance_claims", "Asha Mtemi · NHIF claim", "Submitted", { patientId, patientName: "Asha Mtemi", invoiceId: recordId, invoiceName: "Asha Mtemi · Invoice", provider: "NHIF", memberId: "NHIF-418042", claimNumber: "CLM-000184", submittedAt: "2026-08-20T10:05:00.000Z", reviewedAt: "", decisionAt: "", approvedAmount: null, requestedAmount: 50000, decisionNotes: "Awaiting insurer review" }],
      ["hc_reports", "Asha Mtemi · Consultation summary", "Draft", { patientId, patientName: "Asha Mtemi", doctorId, doctorName: "Dr. Mhando", visitId: recordId, reportType: "Consultation summary", createdAt: "2026-08-20T10:05:00.000Z", signedAt: "", signedBy: "", content: "Clinical summary recorded." }],
      ["hc_notifications", "Laboratory order created", "Unread", { eventType: "Diagnostic", severity: "Information", patientId, patientName: "Asha Mtemi", claimId: null, invoiceId: null, relatedTable: "hc_lab_orders", relatedRecordId: recordId, actionLabel: "Review laboratory order", readAt: "", acknowledgedBy: "" }],
    ] as const;
    for (const [table, name, status, data] of records) {
      const result = await caller.healthcare.create({ table, record: { name, status, amount: table === "hc_invoices" || table === "hc_insurance_claims" ? 50000 : null, notes: null, data } });
      expect(result.record.id).toBe(recordId);
    }
    const healthcareWrites = requests.filter((request) => request.url.includes("/rest/v1/hc_"));
    expect(healthcareWrites).toHaveLength(records.length);
    for (const write of healthcareWrites) {
      expect(write.method).toBe("POST");
      expect(write.body?.company_id).toBe(companyId);
      expect(write.url).toMatch(/\/rest\/v1\/hc_(lab_orders|prescriptions|invoices|insurance_claims|reports|notifications)/);
    }
  });

  it("rejects a receptionist claim mutation before any healthcare record is written", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerForRole("Receptionist", requests);
    await expect(caller.healthcare.create({ table: "hc_insurance_claims", record: { name: "Unauthorized claim", status: "Submitted", amount: 50000, notes: null, data: { patientId: recordId, patientName: "Asha Mtemi", invoiceId: recordId, invoiceName: "Invoice", provider: "NHIF", memberId: "", claimNumber: "CLM-UNAUTH", submittedAt: "2026-08-20T10:00:00.000Z", reviewedAt: "", decisionAt: "", approvedAmount: null, requestedAmount: 50000, decisionNotes: "" } } })).rejects.toThrow("assigned healthcare role does not allow this action");
    expect(requests.filter((request) => request.url.includes("/rest/v1/hc_insurance_claims"))).toHaveLength(0);
  });

  it("updates and archives healthcare records only through an active-company scoped route", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerForRole("Clinic Administrator", requests);
    await caller.healthcare.update({ table: "hc_invoices", id: recordId, patch: { status: "Paid", data: { balance: 0, paidAt: "2026-08-20T11:00:00.000Z" } } });
    await caller.healthcare.archive({ table: "hc_visits", id: recordId });
    const writes = requests.filter((request) => request.method === "PATCH" && request.url.includes("/rest/v1/hc_"));
    expect(writes).toHaveLength(2);
    expect(writes[0].url).toContain(`company_id=eq.${companyId}`);
    expect(writes[0].url).toContain(`id=eq.${recordId}`);
    expect(writes[0].body?.status).toBe("Paid");
    expect(writes[1].url).toContain(`company_id=eq.${companyId}`);
    expect(writes[1].body?.status).toBe("Archived");
  });

  it("does not return or mutate a foreign-company healthcare record", async () => {
    const foreignRecordId = "99999999-9999-4999-8999-999999999999";
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ id: "supabase-user-1" }), { status: 200, headers: { "content-type": "application/json" } });
      if (url.includes("/rest/v1/profiles?")) return new Response(JSON.stringify([{ id: "supabase-user-1", company_id: companyId, role: "Clinic Administrator", full_name: "Healthcare Test User" }]), { status: 200, headers: { "content-type": "application/json" } });
      requests.push({ url, method: init?.method || "GET", body: typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : null });
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const caller = appRouter.createCaller({ req: { headers: { authorization: "Bearer valid-healthcare-token" } } as any, res: {} as any, user: { id: 1, openId: "sup_supabase-user-1", name: "Healthcare Test User", email: "healthcare@example.invalid", loginMethod: "supabase", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any });
    await expect(caller.healthcare.update({ table: "hc_patients", id: foreignRecordId, patch: { status: "Active" } })).rejects.toThrow("no longer available");
    await expect(caller.healthcare.archive({ table: "hc_patients", id: foreignRecordId })).rejects.toThrow("no longer available");
    const foreignReads = requests.filter((request) => request.url.includes(`/rest/v1/hc_patients`) && request.url.includes(`id=eq.${foreignRecordId}`));
    expect(foreignReads).toHaveLength(2);
    expect(foreignReads.every((request) => request.url.includes(`company_id=eq.${companyId}`))).toBe(true);
    expect(requests.some((request) => request.method === "PATCH" && request.url.includes(`id=eq.${foreignRecordId}`))).toBe(false);
  });

  it.each(["hc_patients", "hc_appointments", "hc_visits", "hc_vitals", "hc_prescriptions", "hc_doctors"] as const)("returns a safe not-found result for the missing %s record within the active company", async (table) => {
    const missingId = "88888888-8888-4888-8888-888888888888";
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ id: "supabase-user-1" }), { status: 200, headers: { "content-type": "application/json" } });
      if (url.includes("/rest/v1/profiles?")) return new Response(JSON.stringify([{ id: "supabase-user-1", company_id: companyId, role: "Clinic Administrator", full_name: "Healthcare Test User" }]), { status: 200, headers: { "content-type": "application/json" } });
      requests.push({ url, method: init?.method || "GET", body: typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : null });
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const caller = appRouter.createCaller({ req: { headers: { authorization: "Bearer valid-healthcare-token" } } as any, res: {} as any, user: { id: 1, openId: "sup_supabase-user-1", name: "Healthcare Test User", email: "healthcare@example.invalid", loginMethod: "supabase", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any });
    await expect(caller.healthcare.update({ table, id: missingId, patch: { status: "Updated" } })).rejects.toThrow("no longer available");
    await expect(caller.healthcare.archive({ table, id: missingId })).rejects.toThrow("no longer available");
    expect(requests).toHaveLength(2);
    expect(requests.every((request) => request.url.includes(`company_id=eq.${companyId}`))).toBe(true);
    expect(requests.every((request) => request.url.includes(`id=eq.${missingId}`))).toBe(true);
  });

  it("documents clinic-administrator authority across protected healthcare workspaces", async () => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerForRole("Clinic Administrator", requests);
    const access = await caller.healthcare.access();
    expect(access.canCreate.hc_patients).toBe(true);
    expect(access.canCreate.hc_lab_orders).toBe(true);
    expect(access.canCreate.hc_insurance_claims).toBe(true);
    expect(access.canUpdate.hc_notifications).toBe(true);
  });

  it.each([
    ["Doctor", "hc_invoices"],
    ["Laboratory Technician", "hc_prescriptions"],
    ["Pharmacist", "hc_lab_orders"],
    ["Billing Officer", "hc_visits"],
  ] as const)("rejects %s from creating the out-of-scope %s record", async (role, table) => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerForRole(role, requests);
    await expect(caller.healthcare.create({ table, record: { name: "Out-of-scope healthcare record", status: "Draft", amount: null, notes: null, data: {} } })).rejects.toThrow("assigned healthcare role does not allow this action");
    expect(requests.filter((request) => request.url.includes(`/rest/v1/${table}`))).toHaveLength(0);
  });

  it.each([
    ["Pharmacist", "hc_patients"],
    ["Pharmacist", "hc_appointments"],
    ["Billing Officer", "hc_visits"],
    ["Billing Officer", "hc_vitals"],
    ["Laboratory Technician", "hc_prescriptions"],
    ["Doctor", "hc_doctors"],
  ] as const)("rejects %s from creating the protected patient-care %s record", async (role, table) => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerForRole(role, requests);
    await expect(caller.healthcare.create({ table, record: { name: "Denied patient-care record", status: "Draft", amount: null, notes: null, data: {} } })).rejects.toThrow("assigned healthcare role does not allow this action");
    expect(requests.filter((request) => request.url.includes(`/rest/v1/${table}`))).toHaveLength(0);
  });

  it.each([
    ["Pharmacist", "hc_patients", "update"],
    ["Pharmacist", "hc_appointments", "archive"],
    ["Billing Officer", "hc_visits", "update"],
    ["Billing Officer", "hc_vitals", "archive"],
    ["Laboratory Technician", "hc_prescriptions", "update"],
    ["Doctor", "hc_doctors", "archive"],
  ] as const)("rejects %s from %s on the protected patient-care %s record", async (role, table, action) => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerForRole(role, requests);
    const rejected = action === "update"
      ? caller.healthcare.update({ table, id: recordId, patch: { status: "Updated" } })
      : caller.healthcare.archive({ table, id: recordId });
    await expect(rejected).rejects.toThrow("assigned healthcare role does not allow this action");
    expect(requests.filter((request) => request.url.includes(`/rest/v1/${table}`))).toHaveLength(0);
  });

  it.each([
    ["Laboratory Technician", "hc_patients"],
    ["Pharmacist", "hc_appointments"],
    ["Billing Officer", "hc_visits"],
    ["Billing Officer", "hc_vitals"],
    ["Laboratory Technician", "hc_prescriptions"],
    ["Pharmacist", "hc_doctors"],
  ] as const)("blocks %s from reading, updating, or archiving the protected %s workflow", async (role, table) => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> | null }> = [];
    const caller = callerForRole(role, requests);
    await expect(caller.healthcare.list({ table })).rejects.toThrow("assigned healthcare role does not allow this action");
    await expect(caller.healthcare.update({ table, id: recordId, patch: { status: "Updated" } })).rejects.toThrow("assigned healthcare role does not allow this action");
    await expect(caller.healthcare.archive({ table, id: recordId })).rejects.toThrow("assigned healthcare role does not allow this action");
    expect(requests.filter((request) => request.url.includes(`/rest/v1/${table}`))).toHaveLength(0);
  });
});
