import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { clearPatientPortalReference, linkPatientPortalReference, listPortalReferenceReconciliation } from "./healthcarePortalReconciliation";
import { resolveVerifiedProfile } from "./aiApprovals";

vi.mock("./aiApprovals", () => ({
  resolveVerifiedProfile: vi.fn(),
  canonicalVerifiedRole: (role: string) => String(role || "").trim(),
}));

const resolvedProfile = vi.mocked(resolveVerifiedProfile);
const original = { url: ENV.supabaseUrl, key: ENV.supabaseSecretKey };
const companyId = "11111111-1111-4111-8111-111111111111";
const patient = { id: "22222222-2222-4222-8222-222222222222", company_id: companyId, name: "Asha Mtemi", status: "Active", data: { mrn: "SMC-000184", phone: "+255700000000", patientPortalReference: "" } };

function asStaff(role = "Receptionist") {
  resolvedProfile.mockResolvedValue({ profile: { id: "staff-1", company_id: companyId, role, full_name: "Clinic staff", customer_ref: null }, token: "staff-token" });
}

describe("clinic portal-reference reconciliation", () => {
  beforeEach(() => {
    ENV.supabaseUrl = "https://example.invalid";
    ENV.supabaseSecretKey = "service-only-key";
    asStaff();
  });

  afterEach(() => {
    ENV.supabaseUrl = original.url;
    ENV.supabaseSecretKey = original.key;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("lists safe unlinked patient records and available portal candidates without phone data", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(url.includes("/profiles?")
      ? [{ id: "portal-1", full_name: "Asha Portal", customer_ref: "ASHA-PORTAL", role: "External Client" }]
      : [patient]), { status: 200, headers: { "content-type": "application/json" } })));
    const result = await listPortalReferenceReconciliation({} as never, { query: "", status: "unlinked", limit: 50 });
    expect(result.summary).toEqual({ unlinkedPatients: 1, availableReferences: 1 });
    expect(result.patients).toEqual([expect.objectContaining({ id: patient.id, mrn: "SMC-000184", portalReference: null, linkState: "unlinked" })]);
    expect(JSON.stringify(result)).not.toContain("+255700000000");
    expect(result.candidates).toEqual([expect.objectContaining({ reference: "ASHA-PORTAL", availability: "available" })]);
  });

  it("denies portal reconciliation to an external patient account before reading records", async () => {
    asStaff("External Client");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(listPortalReferenceReconciliation({} as never, { query: "", status: "unlinked", limit: 50 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("links an available portal reference only after uniqueness checks within the active clinic", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") return new Response(JSON.stringify([{ ...patient, data: { ...patient.data, patientPortalReference: "ASHA-PORTAL" } }]), { status: 200, headers: { "content-type": "application/json" } });
      if (url.includes("/profiles?")) return new Response(JSON.stringify([{ id: "portal-1", full_name: "Asha Portal", customer_ref: "ASHA-PORTAL", role: "External Client" }]), { status: 200, headers: { "content-type": "application/json" } });
      if (url.includes("data-%3E%3EpatientPortalReference")) return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
      return new Response(JSON.stringify([patient]), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(linkPatientPortalReference({} as never, { patientId: patient.id, reference: "ASHA-PORTAL", replaceExisting: false })).resolves.toMatchObject({ id: patient.id, portalReference: "ASHA-PORTAL", linkState: "linked" });
    const patch = fetchMock.mock.calls.find((call) => call[1]?.method === "PATCH");
    expect(String(patch?.[0])).toContain(companyId);
    expect(JSON.parse(String(patch?.[1]?.body)).data.patientPortalReference).toBe("ASHA-PORTAL");
  });

  it("clears a reference only through the explicit confirmed action", async () => {
    const linked = { ...patient, data: { ...patient.data, patientPortalReference: "ASHA-PORTAL" } };
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => init?.method === "PATCH"
      ? new Response(JSON.stringify([patient]), { status: 200, headers: { "content-type": "application/json" } })
      : new Response(JSON.stringify([linked]), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(clearPatientPortalReference({} as never, { patientId: patient.id, confirmed: true })).resolves.toMatchObject({ portalReference: null, linkState: "unlinked" });
    const patch = fetchMock.mock.calls.find((call) => call[1]?.method === "PATCH");
    expect(JSON.parse(String(patch?.[1]?.body)).data.patientPortalReference).toBeUndefined();
  });
});
