import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { provisionPasswordAccount, resetPasswordAccountProvisioningRateLimit } from "./passwordAccountProvisioning";

const original = { url: ENV.supabaseUrl, anon: ENV.supabaseAnonKey, secret: ENV.supabaseSecretKey };

afterEach(() => {
  ENV.supabaseUrl = original.url;
  ENV.supabaseAnonKey = original.anon;
  ENV.supabaseSecretKey = original.secret;
  resetPasswordAccountProvisioningRateLimit();
  vi.unstubAllGlobals();
});

describe("email-confirmed password account provisioning", () => {
  it("uses the public Supabase signup endpoint and returns a confirmation-pending result", async () => {
    ENV.supabaseUrl = "https://project.supabase.co";
    ENV.supabaseAnonKey = "publishable-key";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ user: { id: "user-1", email: "owner@example.com" }, session: null }) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(provisionPasswordAccount({ email: " Owner@Example.com ", password: "Password1!" }, "127.0.0.1")).resolves.toEqual({ access_token: null, refresh_token: null, user: { id: "user-1", email: "owner@example.com" }, requires_email_confirmation: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/auth/v1/signup");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ apikey: "publishable-key" });
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body)).toEqual({ email: "owner@example.com", password: "Password1!" });
  });

  it("passes through a session when Supabase is configured for immediate confirmation", async () => {
    ENV.supabaseUrl = "https://project.supabase.co";
    ENV.supabaseAnonKey = "publishable-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ access_token: "access", refresh_token: "refresh", user: { id: "user-1", email: "owner@example.com" } }) }));
    await expect(provisionPasswordAccount({ email: "owner@example.com", password: "Password1!" }, "127.0.0.1")).resolves.toMatchObject({ access_token: "access", refresh_token: "refresh", requires_email_confirmation: false });
  });

  it("rejects weak passwords without calling Supabase", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(provisionPasswordAccount({ email: "owner@example.com", password: "short" }, "127.0.0.1")).rejects.toThrow(/password/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not claim success when Supabase rejects account creation", async () => {
    ENV.supabaseUrl = "https://project.supabase.co";
    ENV.supabaseAnonKey = "publishable-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ message: "Password policy rejected this request" }) }));
    await expect(provisionPasswordAccount({ email: "owner@example.com", password: "Password1!" }, "127.0.0.1")).rejects.toThrow(/Password policy rejected/i);
  });
});
