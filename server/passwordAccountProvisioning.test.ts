import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { provisionConfirmedPasswordAccount, resetPasswordAccountProvisioningRateLimit } from "./passwordAccountProvisioning";

const original = { url: ENV.supabaseUrl, anon: ENV.supabaseAnonKey, secret: ENV.supabaseSecretKey };

afterEach(() => {
  ENV.supabaseUrl = original.url;
  ENV.supabaseAnonKey = original.anon;
  ENV.supabaseSecretKey = original.secret;
  resetPasswordAccountProvisioningRateLimit();
  vi.unstubAllGlobals();
});

describe("confirmed password account provisioning", () => {
  it("creates an email-confirmed account server-side, then returns only the authenticated user session", async () => {
    ENV.supabaseUrl = "https://project.supabase.co";
    ENV.supabaseAnonKey = "publishable-key";
    ENV.supabaseSecretKey = "server-only-key";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "user-1", email: "owner@example.com" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ access_token: "access", refresh_token: "refresh", user: { id: "user-1", email: "owner@example.com" } }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(provisionConfirmedPasswordAccount({ email: " Owner@Example.com ", password: "Password1!" }, "127.0.0.1")).resolves.toEqual({ access_token: "access", refresh_token: "refresh", user: { id: "user-1", email: "owner@example.com" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/auth/v1/admin/users");
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body)).toMatchObject({ email: "owner@example.com", email_confirm: true });
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: "Bearer server-only-key" });
    expect(fetchMock.mock.calls[1]?.[0]).toContain("grant_type=password");
  });

  it("rejects weak passwords without calling Supabase", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(provisionConfirmedPasswordAccount({ email: "owner@example.com", password: "short" }, "127.0.0.1")).rejects.toThrow(/password/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not claim success when Supabase rejects account creation", async () => {
    ENV.supabaseUrl = "https://project.supabase.co";
    ENV.supabaseAnonKey = "publishable-key";
    ENV.supabaseSecretKey = "server-only-key";
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ message: "Password policy rejected this request" }) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(provisionConfirmedPasswordAccount({ email: "owner@example.com", password: "Password1!" }, "127.0.0.1")).rejects.toThrow(/could not be created/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("continues with a verified session when the account already exists and the supplied password is correct", async () => {
    ENV.supabaseUrl = "https://project.supabase.co";
    ENV.supabaseAnonKey = "publishable-key";
    ENV.supabaseSecretKey = "server-only-key";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ message: "User already registered" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ access_token: "access", refresh_token: "refresh", user: { id: "user-1", email: "owner@example.com" } }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(provisionConfirmedPasswordAccount({ email: "owner@example.com", password: "Password1!" }, "127.0.0.1")).resolves.toEqual({ access_token: "access", refresh_token: "refresh", user: { id: "user-1", email: "owner@example.com" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toContain("grant_type=password");
  });
});
