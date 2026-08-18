import { describe, expect, it } from "vitest";
import { getTraPortalLanguage, readPersistedTraPortalLanguage, resolveTraPortalLanguage } from "../client/src/lib/traPortalRoute";

describe("TRA Portal route language safety", () => {
  it("normalizes only Kiswahili to sw and all other values to English", () => {
    expect(resolveTraPortalLanguage("sw")).toBe("sw");
    expect(resolveTraPortalLanguage("en")).toBe("en");
    expect(resolveTraPortalLanguage(undefined)).toBe("en");
    expect(resolveTraPortalLanguage("unexpected-value")).toBe("en");
  });

  it("reads the persisted application language without throwing", () => {
    expect(readPersistedTraPortalLanguage({ getItem: () => "sw" })).toBe("sw");
    expect(readPersistedTraPortalLanguage({ getItem: () => null })).toBe("en");
    expect(readPersistedTraPortalLanguage({ getItem: () => { throw new Error("storage unavailable"); } })).toBe("en");
  });

  it("defaults to English when window is unavailable", () => {
    expect(getTraPortalLanguage()).toBe("en");
  });
});
