import { afterEach, describe, expect, it } from "vitest";
import { readStoredAccessToken, readStoredAuthSession } from "../client/src/lib/authSessionStorage";

type StorageFixture = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function storage(values: Record<string, string> = {}): StorageFixture {
  const entries = new Map(Object.entries(values));
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: (key) => { entries.delete(key); },
  };
}

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
});

describe("stored SMART MANAGER Supabase session access", () => {
  it("reads a persistent access token before a session-scoped token", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: storage({ bs_access_token: "persistent.header.signature" }),
        sessionStorage: storage({ bs_session_access_token: "session.header.signature" }),
      },
    });

    expect(readStoredAccessToken()).toBe("persistent.header.signature");
  });

  it("returns a session-scoped access token even when no refresh token is available", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: storage(),
        sessionStorage: storage({ bs_session_access_token: "session.header.signature" }),
      },
    });

    expect(readStoredAccessToken()).toBe("session.header.signature");
    expect(readStoredAuthSession()).toBeNull();
  });
});
