import { describe, expect, it, vi } from "vitest";
import { passkeySignInUserMessage, signInWithPasskeyUsingClient } from "../client/src/lib/accountPasskeys.js";

describe("native passkey login", () => {
  it("accepts only a complete session returned by the official Supabase passkey ceremony", async () => {
    const client = { auth: { signInWithPasskey: vi.fn(async () => ({ data: { user: { id: "user-1" }, session: { access_token: "access", refresh_token: "refresh" } }, error: null })) } } as any;
    await expect(signInWithPasskeyUsingClient(client)).resolves.toMatchObject({ access_token: "access", refresh_token: "refresh" });
  });

  it("does not create a browser session after an incomplete or rejected passkey response", async () => {
    const incomplete = { auth: { signInWithPasskey: vi.fn(async () => ({ data: { user: { id: "user-1" }, session: null }, error: null })) } } as any;
    await expect(signInWithPasskeyUsingClient(incomplete)).rejects.toMatchObject({ code: "AUTH_RESPONSE_INVALID" });
    expect(passkeySignInUserMessage({ code: "passkey_disabled" })).toContain("not enabled");
    expect(passkeySignInUserMessage({ code: "webauthn_credential_not_found" })).toContain("No matching Smart Manager passkey");
  });
});
