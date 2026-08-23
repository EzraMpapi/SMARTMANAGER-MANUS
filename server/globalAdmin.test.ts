import { afterEach, describe, expect, it, vi } from "vitest";

const { resolveVerifiedProfile } = vi.hoisted(() => ({ resolveVerifiedProfile: vi.fn() }));
vi.mock("./aiApprovals", () => ({ resolveVerifiedProfile }));
vi.mock("./_core/env", () => ({ ENV: { supabaseUrl: "https://example.supabase.co", supabaseAnonKey: "anon-key" } }));

import { getGlobalAdminSnapshot, recordGlobalAdminAction } from "./globalAdmin";
import { appRouter } from "./routers";

const request = { headers: {} } as any;
const platformProfile = { id: "profile-1", company_id: "company-1", role: "Platform Administrator", full_name: "Platform Admin", customer_ref: null };
const baseUser = { id: 1, openId: "platform-1", name: "Platform Admin", email: "admin@example.invalid", loginMethod: "supabase", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

function response(payload: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } }));
}

afterEach(() => {
  vi.restoreAllMocks();
  resolveVerifiedProfile.mockReset();
});

describe("Global Admin server contract", () => {
  it("denies unauthenticated tRPC snapshot access before invoking the boundary", async () => {
    const caller = appRouter.createCaller({ req: request, res: {} } as any);
    await expect(caller.globalAdmin.snapshot()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(resolveVerifiedProfile).not.toHaveBeenCalled();
  });

  it("denies a non-platform profile even when the legacy session is admin", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { ...platformProfile, role: "Organization Owner" }, token: "user-token" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => response({ error: "should not be called" }, 200));
    await expect(getGlobalAdminSnapshot(request)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the guarded live snapshot RPC with the verified bearer token", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: platformProfile, token: "verified-token" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => response({ overview: { companyCount: 1 } }));
    await expect(getGlobalAdminSnapshot(request)).resolves.toEqual({ overview: { companyCount: 1 } });
    expect(fetchSpy).toHaveBeenCalledWith("https://example.supabase.co/rest/v1/rpc/platform_admin_snapshot", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ authorization: "Bearer verified-token" }) }));
  });

  it("posts only the explicit reasoned action payload to the guarded action RPC", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: platformProfile, token: "verified-token" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => response({ id: "action-1", action: "REVIEW_TENANT_ACCESS" }));
    await recordGlobalAdminAction(request, { action: "REVIEW_TENANT_ACCESS", targetType: "company", targetId: "company-1", reason: "Review access posture", confirmationText: "CONFIRM:REVIEW_TENANT_ACCESS:company-1", details: { source: "test" } });
    const [, init] = fetchSpy.mock.calls[0] || [];
    expect(init?.body).toBe(JSON.stringify({ p_action: "REVIEW_TENANT_ACCESS", p_target_type: "company", p_target_id: "company-1", p_reason: "Review access posture", p_confirmation_text: "CONFIRM:REVIEW_TENANT_ACCESS:company-1", p_details: { source: "test" } }));
  });

  it("rejects a legacy admin session at the tRPC boundary when Supabase verification has no platform role", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { ...platformProfile, role: "owner" }, token: "user-token" });
    const caller = appRouter.createCaller({ req: request, res: {}, user: baseUser } as any);
    await expect(caller.globalAdmin.snapshot()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
