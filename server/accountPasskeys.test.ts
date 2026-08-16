import { describe, expect, it, vi } from "vitest";
import {
  listAccountPasskeys,
  passkeyUserMessage,
  registerAccountPasskey,
  renameAccountPasskey,
  revokeAccountPasskey,
} from "../client/src/lib/accountPasskeys.js";

describe("account passkey helpers", () => {
  it("requires confirmed provider responses for list, enrollment, rename, and revocation", async () => {
    const client = {
      auth: {
        passkey: {
          list: vi.fn(async () => ({ data: [{ id: "pk-1", friendly_name: "Work laptop" }], error: null })),
          update: vi.fn(async () => ({ data: { id: "pk-1", friendly_name: "Office laptop" }, error: null })),
          delete: vi.fn(async () => ({ error: null })),
        },
        registerPasskey: vi.fn(async () => ({ data: { id: "pk-2" }, error: null })),
      },
    } as any;

    await expect(listAccountPasskeys(client)).resolves.toEqual([{ id: "pk-1", friendly_name: "Work laptop" }]);
    await expect(registerAccountPasskey(client)).resolves.toEqual({ id: "pk-2" });
    await expect(renameAccountPasskey(client, "pk-1", "Office laptop")).resolves.toMatchObject({ id: "pk-1" });
    await expect(revokeAccountPasskey(client, "pk-1")).resolves.toBeUndefined();
  });

  it("does not hide native passkey configuration or verification errors", () => {
    expect(passkeyUserMessage({ code: "passkey_disabled" })).toContain("relying-party setup");
    expect(passkeyUserMessage({ code: "webauthn_verification_failed" })).toContain("could not be verified");
  });
});
