import { describe, expect, it, vi } from "vitest";
import { getBearerToken } from "./_core/authHeaders";
import { createContext } from "./_core/context";

describe("shared bearer-token extraction", () => {
  it("prefers the standard authorization header and supports the Supabase fallback header", () => {
    expect(getBearerToken({ headers: { authorization: "Bearer manus-session", "x-supabase-authorization": "Bearer supabase-session" } })).toBe("manus-session");
    expect(getBearerToken({ headers: { "x-supabase-authorization": "Bearer supabase-session" } })).toBe("supabase-session");
    expect(getBearerToken({ headers: { "x-supabase-authorization": ["Bearer array-session"] } })).toBe("array-session");
  });

  it("rejects malformed or empty bearer headers", () => {
    expect(getBearerToken({ headers: { authorization: "Basic credentials" } })).toBeNull();
    expect(getBearerToken({ headers: { authorization: "Bearer    " } })).toBeNull();
    expect(getBearerToken({ headers: {} })).toBeNull();
  });

  it("bridges a Supabase custom authorization header into the protected context fallback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "supabase-user-custom-header", email: "custom@example.invalid", user_metadata: {}, app_metadata: { provider: "email" } }),
    }));

    const context = await createContext({
      req: { headers: { "x-supabase-authorization": "Bearer custom-header-token" } } as any,
      res: {} as any,
    });

    expect(context.user?.openId).toBe("sup_supabase-user-custom-header");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/v1/user"), expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer custom-header-token" }) }));
  });
});
