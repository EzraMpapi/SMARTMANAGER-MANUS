import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateRequest } = vi.hoisted(() => ({ authenticateRequest: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));

import { createContext } from "./_core/context";

describe("Supabase bearer fallback context", () => {
  beforeEach(() => {
    authenticateRequest.mockRejectedValue(new Error("Not a Manus session"));
  });

  it("derives the backend tenant and owner role from the authenticated user profile rather than client input", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "auth-user-1", email: "owner@example.com", user_metadata: { full_name: "Company Owner" }, app_metadata: { provider: "email" } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ company_id: "company-1", role: "owner" }]) });
    vi.stubGlobal("fetch", fetchMock);

    const context = await createContext({
      req: { headers: { authorization: "Bearer real-supabase-token" } },
      res: {},
    } as any);

    expect(context.user).toMatchObject({
      openId: "sup_auth-user-1",
      companyId: "company-1",
      role: "admin",
      loginMethod: "email",
    });
    expect(String(fetchMock.mock.calls[1][0])).toContain("profiles?select=company_id,role&id=eq.auth-user-1");
  });

  it("does not create an authorized tenant context when the profile cannot be read", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "auth-user-2", email: "staff@example.com" }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const context = await createContext({
      req: { headers: { authorization: "Bearer real-supabase-token" } },
      res: {},
    } as any);

    expect(context.user?.companyId).toBeUndefined();
    expect(context.user?.role).toBe("user");
  });
});
