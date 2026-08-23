import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ resolveVerifiedProfile: vi.fn(), storagePut: vi.fn() }));
const resolveVerifiedProfile = mocks.resolveVerifiedProfile;
const storagePut = mocks.storagePut;
vi.mock("./aiApprovals", () => ({ resolveVerifiedProfile: mocks.resolveVerifiedProfile }));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import { getProfileIdentity, removeProfileAvatar, updateProfileIdentity, uploadProfileAvatar, validateAvatarUpload } from "./profileIdentity";

const originalFetch = global.fetch;
const request = (token = "session-token") => ({ headers: { authorization: `Bearer ${token}` } }) as any;
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

function installProfileFetch({ extended = true, includeEmployee = true, includeNotifications = true, avatarRpcStatus = 200 } = {}) {
  global.fetch = vi.fn(async (input, init) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    if (url.endsWith("/auth/v1/user")) return json({ id: "user-1", email: "person@example.com", last_sign_in_at: "2026-08-23T08:00:00.000Z" });
    if (url.includes("/rest/v1/get_current_profile_identity")) {
      return extended ? json({ id: "user-1", companyId: "company-1", fullName: "Person Example", email: "person@example.com", role: "Employee", isActive: true, preferredName: "Person", notificationPreferences: { email: true, push: true, sms: false }, updatedAt: "2026-08-23T08:00:00.000Z" }) : json({ message: "function not found" }, 404);
    }
    if (url.includes("/rest/v1/update_current_profile_identity")) {
      expect(body).toEqual({ p_payload: { preferredName: "Asha" } });
      return json({ id: "user-1", companyId: "company-1", fullName: "Asha Example", email: "person@example.com", role: "Employee", isActive: true, preferredName: "Asha", updatedAt: "2026-08-23T08:01:00.000Z" });
    }
    if (url.includes("/rest/v1/set_current_profile_avatar")) {
      if (avatarRpcStatus !== 200) return json({ message: "database confirmation failed" }, avatarRpcStatus);
      return json({ id: "user-1", companyId: "company-1", fullName: "Person Example", email: "person@example.com", role: "Employee", isActive: true, avatarUrl: "https://storage.example/avatar.jpg" });
    }
    if (url.includes("/rest/v1/profiles?")) return json([{ id: "user-1", company_id: "company-1", full_name: "Person Example", email: "person@example.com", role: "Employee", is_active: true, updated_at: "2026-08-23T08:00:00.000Z" }]);
    if (url.includes("/rest/v1/companies?")) return json([{ id: "company-1", name: "Example Workspace", category: "services", region: "Dar es Salaam", country: "Tanzania" }]);
    if (url.includes("/rest/v1/hr_employees?")) return includeEmployee ? json([{ id: "employee-1", company_id: "company-1", profile_id: "user-1", employee_number: "EMP-001", department_id: "department-1", position_id: "position-1", timezone: "Africa/Dar_es_Salaam", status: "Active" }]) : json([]);
    if (url.includes("/rest/v1/hr_notifications?")) return includeNotifications ? json([{ id: "notification-1", title: "Welcome", body: "Welcome to the workspace", type: "system", read_at: null, created_at: "2026-08-23T07:00:00.000Z" }]) : json([]);
    throw new Error(`Unexpected fetch in test: ${url}`);
  }) as any;
}

afterEach(() => {
  global.fetch = originalFetch;
  resolveVerifiedProfile.mockReset();
  storagePut.mockReset();
});

describe("profile identity center service", () => {
  it("validates image magic bytes and rejects mismatched or oversized files", () => {
    expect(validateAvatarUpload({ mimeType: "image/png", base64: png.toString("base64") })).toEqual(png);
    expect(() => validateAvatarUpload({ mimeType: "image/jpeg", base64: png.toString("base64") })).toThrow("does not match");
    expect(() => validateAvatarUpload({ mimeType: "image/png", base64: Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64") })).toThrow("under 2 MB");
  });

  it("reads only the verified user profile and scopes related workspace records to that profile/company", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "user-1", company_id: "company-1", role: "Employee", full_name: "Person Example", customer_ref: null }, token: "session-token" });
    installProfileFetch();
    const result = await getProfileIdentity(request());
    expect(result.profile.id).toBe("user-1");
    expect(result.profile.role).toBe("Employee");
    expect(result.work.employeeNumber).toBe("EMP-001");
    expect(result.activity[0]?.id).toBe("notification-1");
    const urls = (global.fetch as any).mock.calls.map((call: any[]) => String(call[0]));
    expect(urls.some((url: string) => url.includes("id=eq.user-1") && url.includes("company_id=eq.company-1"))).toBe(true);
    expect(urls.some((url: string) => url.includes("profile_id=eq.user-1") && url.includes("company_id=eq.company-1"))).toBe(true);
  });

  it("rejects a role/company mutation before any database write is attempted", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "user-1", company_id: "company-1", role: "Employee", full_name: "Person Example", customer_ref: null }, token: "session-token" });
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;
    await expect(updateProfileIdentity(request(), { role: "Super Administrator" } as any)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateProfileIdentity(request(), { companyId: "company-2" } as any)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when the controlled migration is not available", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "user-1", company_id: "company-1", role: "Employee", full_name: "Person Example", customer_ref: null }, token: "session-token" });
    installProfileFetch({ extended: false });
    await expect(updateProfileIdentity(request(), { preferredName: "Asha" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect((global.fetch as any).mock.calls.some((call: any[]) => String(call[0]).includes("update_current_profile_identity"))).toBe(false);
  });

  it("uploads avatar bytes to scoped storage and persists only the returned URL/key through the avatar RPC", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "user-1", company_id: "company-1", role: "Employee", full_name: "Person Example", customer_ref: null }, token: "session-token" });
    installProfileFetch();
    storagePut.mockResolvedValue({ key: "profile-avatars/company-1/user-1/avatar.jpg", url: "/manus-storage/profile-avatars/company-1/user-1/avatar.jpg" });
    const result = await uploadProfileAvatar(request(), { mimeType: "image/png", base64: png.toString("base64") });
    expect(storagePut).toHaveBeenCalledWith(expect.stringMatching(/^profile-avatars\/company-1\/user-1\//), png, "image/png");
    const avatarCall = (global.fetch as any).mock.calls.find((call: any[]) => String(call[0]).includes("set_current_profile_avatar"));
    expect(JSON.parse(avatarCall[1].body)).toEqual({ p_avatar_url: "/manus-storage/profile-avatars/company-1/user-1/avatar.jpg", p_avatar_storage_key: "profile-avatars/company-1/user-1/avatar.jpg" });
    expect(result.saved).toBe(true);
  });

  it("does not report avatar success when the database cannot confirm the storage reference", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "user-1", company_id: "company-1", role: "Employee", full_name: "Person Example", customer_ref: null }, token: "session-token" });
    installProfileFetch({ avatarRpcStatus: 500 });
    storagePut.mockResolvedValue({ key: "profile-avatars/company-1/user-1/avatar.jpg", url: "/manus-storage/profile-avatars/company-1/user-1/avatar.jpg" });
    await expect(uploadProfileAvatar(request(), { mimeType: "image/png", base64: png.toString("base64") })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect((global.fetch as any).mock.calls.filter((call: any[]) => String(call[0]).includes("get_current_profile_identity") && call[1]?.method === "POST")).toHaveLength(1);
  });

  it("removes only the current user’s avatar references through the verified avatar RPC", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "user-1", company_id: "company-1", role: "Employee", full_name: "Person Example", customer_ref: null }, token: "session-token" });
    installProfileFetch();
    const result = await removeProfileAvatar(request());
    const avatarCall = (global.fetch as any).mock.calls.find((call: any[]) => String(call[0]).includes("set_current_profile_avatar"));
    expect(JSON.parse(avatarCall[1].body)).toEqual({ p_avatar_url: null, p_avatar_storage_key: null });
    expect(result.saved).toBe(true);
  });
});
