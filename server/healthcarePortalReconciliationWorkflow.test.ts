import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { decidePortalReferenceApproval, getPortalReferenceDailySummary, stagePortalReferenceCsvImport } from "./healthcarePortalReconciliationWorkflow";
import { resolveVerifiedProfile } from "./aiApprovals";

vi.mock("./aiApprovals", () => ({ resolveVerifiedProfile: vi.fn() }));

const resolvedProfile = vi.mocked(resolveVerifiedProfile);
const original = { url: ENV.supabaseUrl, key: ENV.supabaseSecretKey };
const companyId = "11111111-1111-4111-8111-111111111111";
const patientOne = { id: "22222222-2222-4222-8222-222222222222", company_id: companyId, name: "Asha Mtemi", status: "Active", created_at: "2026-08-21T06:00:00.000Z", data: { mrn: "SMC-000184", phone: "+255700000000", patientPortalReference: "" } };
const patientTwo = { id: "33333333-3333-4333-8333-333333333333", company_id: companyId, name: "Baraka Mushi", status: "Active", created_at: "2026-08-21T06:00:00.000Z", data: { mrn: "SMC-000185", phone: "+255700000001", patientPortalReference: "OLD-PORTAL" } };

function asRole(role = "Receptionist") {
  resolvedProfile.mockResolvedValue({ profile: { id: "staff-1", company_id: companyId, role, full_name: "Clinic staff", customer_ref: null }, token: "staff-token" });
}
function json(body: unknown) { return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }); }

describe("portal-reference CSV staging and supervisor approval", () => {
  beforeEach(() => { ENV.supabaseUrl = "https://example.invalid"; ENV.supabaseSecretKey = "service-only-key"; asRole(); });
  afterEach(() => { ENV.supabaseUrl = original.url; ENV.supabaseSecretKey = original.key; vi.unstubAllGlobals(); vi.clearAllMocks(); });

  it("stages reviewed CSV rows without applying them or leaking patient phone values", async () => {
    let importNumber = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/profiles?")) return json([{ id: "portal-a", full_name: "Asha portal", customer_ref: "ASHA-PORTAL", role: "External Client" }, { id: "portal-b", full_name: "Baraka portal", customer_ref: "BARAKA-PORTAL", role: "Patient" }]);
      if (url.includes("/hc_patients?")) return json([patientOne, patientTwo]);
      if (url.includes("/hc_portal_reference_imports?") && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        return json(body.map((row: Record<string, unknown>) => ({ ...row, id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${++importNumber}`.slice(0, 36) })));
      }
      if (url.includes("/hc_portal_reference_approvals?") && init?.method === "POST") return json([{ id: "44444444-4444-4444-8444-444444444444", status: "Pending" }]);
      if (init?.method === "PATCH") return json([{ id: "22222222-2222-4222-8222-222222222222", company_id: companyId, name: "staged", status: "Approval required", data: {} }]);
      return json([]);
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await stagePortalReferenceCsvImport({} as never, { csvText: "MRN,Portal Reference\nSMC-000184,ASHA-PORTAL\nSMC-000185,BARAKA-PORTAL" });
    expect(result).toMatchObject({ staged: 2, ready: 1, approvalRequired: 1, invalid: 0 });
    expect(fetchMock.mock.calls.some((call) => call[1]?.method === "PATCH" && String(call[0]).includes("hc_patients"))).toBe(false);
    expect(JSON.stringify(result)).not.toContain("+255700000000");
  });

  it("blocks non-supervisors from deciding a replacement before any patient or approval record is read", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(decidePortalReferenceApproval({} as never, { approvalId: "44444444-4444-4444-8444-444444444444", decision: "Approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns an administrator-only in-app summary without phone, portal-reference, or scheduler data", async () => {
    asRole("Clinic Administrator");
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/hc_patients?")) return json([patientOne, patientTwo]);
      if (url.includes("/hc_portal_reference_imports?")) return json([{ id: "import-1", company_id: companyId, name: "row", status: "Applied", created_at: new Date().toISOString(), data: { proposedReference: "ASHA-PORTAL" } }]);
      if (url.includes("/hc_portal_reference_approvals?")) return json([{ id: "approval-1", company_id: companyId, name: "approval", status: "Pending", created_at: new Date().toISOString(), data: { proposedReference: "BARAKA-PORTAL" } }]);
      return json([]);
    }));
    const result = await getPortalReferenceDailySummary({} as never);
    expect(result.delivery).toContain("In-app only");
    expect(result.totals).toMatchObject({ unlinkedPatients: 1, pendingApprovals: 1, appliedToday: 1 });
    expect(JSON.stringify(result)).not.toContain("ASHA-PORTAL");
    expect(JSON.stringify(result)).not.toContain("+255700000000");
  });
});
