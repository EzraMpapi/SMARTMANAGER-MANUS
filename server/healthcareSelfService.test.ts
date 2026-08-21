import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { getPatientSmsConsentPreferences, updatePatientSmsConsentPreferences } from "./healthcareSelfService";
import { resolveVerifiedProfile } from "./aiApprovals";

vi.mock("./aiApprovals", () => ({ resolveVerifiedProfile: vi.fn() }));

const resolvedProfile = vi.mocked(resolveVerifiedProfile);
const original = { url: ENV.supabaseUrl, key: ENV.supabaseSecretKey };
const patient = { id: "22222222-2222-4222-8222-222222222222", company_id: "11111111-1111-4111-8111-111111111111", status: "Active", data: { patientPortalReference: "PATIENT-PORTAL-42", phone: "+255700000000", smsConsentStatus: "Granted", smsConsentCapturedAt: "2026-08-20T08:00:00.000Z", smsConsentMethod: "Signed form" } };

describe("patient self-service SMS consent", () => {
  beforeEach(() => {
    ENV.supabaseUrl = "https://example.invalid";
    ENV.supabaseSecretKey = "service-only-key";
    resolvedProfile.mockResolvedValue({ profile: { id: "profile-42", company_id: patient.company_id, role: "External Client", full_name: "Patient", customer_ref: "PATIENT-PORTAL-42" }, token: "end-user-token" });
  });

  afterEach(() => {
    ENV.supabaseUrl = original.url;
    ENV.supabaseSecretKey = original.key;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns only the current linked patient’s SMS preference metadata", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([patient]), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getPatientSmsConsentPreferences({} as never)).resolves.toMatchObject({ preference: "Granted", method: "Signed form", eligibleWhenProviderEnabled: true });
    expect(JSON.stringify(await getPatientSmsConsentPreferences({} as never))).not.toContain("+255700000000");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: "Bearer service-only-key" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("patientPortalReference");
  });

  it("records a self-service revocation against the linked company and reference only", async () => {
    const revised = { ...patient, data: { ...patient.data, smsConsentStatus: "Revoked", smsConsentRevokedAt: "2026-08-21T08:00:00.000Z" } };
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => init?.method === "PATCH"
      ? new Response(JSON.stringify([revised]), { status: 200, headers: { "content-type": "application/json" } })
      : new Response(JSON.stringify([patient]), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(updatePatientSmsConsentPreferences({} as never, { preference: "Revoked", method: "Verified digital confirmation" })).resolves.toMatchObject({ preference: "Revoked", eligibleWhenProviderEnabled: false });
    const patchUrl = String(fetchMock.mock.calls[1]?.[0]);
    const patchBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(patchUrl).toContain(patient.company_id);
    expect(patchUrl).toContain("patientPortalReference");
    expect(patchBody.data).toMatchObject({ smsConsentStatus: "Revoked", patientPortalReference: "PATIENT-PORTAL-42" });
  });

  it("fails closed when a verified portal account is not linked to exactly one patient record", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } })));
    await expect(getPatientSmsConsentPreferences({} as never)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
