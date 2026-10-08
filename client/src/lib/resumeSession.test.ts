import { describe, expect, it } from "vitest";
import {
  buildResumeUrl,
  getModuleFromUrl,
  getResumeLocationKey,
  getSafeDraftKey,
  isResumeLocationFresh,
  isSensitivePersistenceKey,
  readResumeLocation,
  readSafeDraft,
  readScopedSafeDraft,
  sanitizeResumeLocation,
  writeResumeLocation,
  writeSafeDraft,
  writeScopedSafeDraft,
} from "./resumeSession";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

describe("resumeSession", () => {
  const context = {
    userId: "user-1",
    companyId: "company-1",
    allowedModuleIds: ["dashboard", "inventory", "sales"],
    safeModuleIds: ["settings", "profile"],
  } as const;

  it("stores and reads a location only for the matching user and company", () => {
    const storage = new MemoryStorage();
    const saved = writeResumeLocation(storage, {
      ...context,
      pathname: "/app",
      search: "?module=inventory&search=Samsung&page=3",
      hash: "#details",
      moduleId: "inventory",
    }, context);

    expect(saved?.moduleId).toBe("inventory");
    expect(readResumeLocation(storage, context)?.search).toContain("search=Samsung");
    expect(readResumeLocation(storage, { ...context, companyId: "company-2" })).toBeNull();
    expect(storage.getItem(getResumeLocationKey("user-1", "company-1"))).toContain("company-1");
  });

  it("rejects invalid paths, unauthorized modules, and cross-tenant records", () => {
    const contextWithoutSettings = { ...context, safeModuleIds: [] as const };
    expect(sanitizeResumeLocation({ ...context, pathname: "/admin", moduleId: "inventory" }, context)).toBeNull();
    expect(sanitizeResumeLocation({ ...context, userId: "user-2", pathname: "/app", moduleId: "inventory" }, context)).toBeNull();
    expect(sanitizeResumeLocation({ ...context, companyId: "company-2", pathname: "/app", moduleId: "inventory" }, context)).toBeNull();
    expect(sanitizeResumeLocation({ ...context, pathname: "/app", moduleId: "finance" }, contextWithoutSettings)).toBeNull();
    expect(getModuleFromUrl("?module=finance", context.allowedModuleIds, context.safeModuleIds)).toBeNull();
    expect(getModuleFromUrl("?module=settings", context.allowedModuleIds, context.safeModuleIds)).toBe("settings");
  });

  it("strips credential, onboarding, and authentication callback state from query and hash", () => {
    const safe = sanitizeResumeLocation({
      ...context,
      pathname: "/app",
      search: "?module=inventory&access_token=do-not-save&tab=details&invite=join-code&code=oauth-code&state=csrf-state",
      hash: "#refresh_token=do-not-save&nonce=oauth-nonce&tab=details",
      moduleId: "inventory",
    }, context);

    expect(safe?.search).toContain("tab=details");
    expect(safe?.search).not.toMatch(/access_token|invite|code|state/);
    expect(safe?.hash).toBe("#tab=details");
    const resumeUrl = buildResumeUrl({ pathname: "/app", search: "?auth=login&invite=unsafe&code=unsafe&tab=details", hash: "#state=unsafe&tab=details", moduleId: "inventory" });
    expect(resumeUrl).toContain("module=inventory");
    expect(resumeUrl).toContain("tab=details");
    expect(resumeUrl).not.toMatch(/auth=|invite=|code=|state=/);
  });

  it("fails closed for malformed input and rejects expired or future-dated locations", () => {
    expect(sanitizeResumeLocation({ ...context, pathname: "/app", search: "%E0%A4%A" , moduleId: "inventory" }, context)).not.toBeNull();
    expect(isResumeLocationFresh(Date.now() - (30 * 24 * 60 * 60 * 1000 + 1))).toBe(false);
    expect(isResumeLocationFresh(Date.now() + 10 * 60 * 1000)).toBe(false);

    const storage = new MemoryStorage();
    const key = getResumeLocationKey(context.userId, context.companyId);
    storage.setItem(key, JSON.stringify({
      version: 1,
      ...context,
      pathname: "/app",
      search: "?module=inventory",
      hash: "",
      moduleId: "inventory",
      savedAt: Date.now() - (30 * 24 * 60 * 60 * 1000 + 1),
    }));
    expect(readResumeLocation(storage, context)).toBeNull();
    expect(storage.getItem(key)).toBeNull();
  });

  it("requires scoped draft keys and recursively excludes sensitive fields and data URLs", () => {
    const storage = new MemoryStorage();
    const key = getSafeDraftKey("user-1", "company-1", "onboarding-company");
    expect(key).toContain("smart_manager_safe_draft_v1");
    expect(writeScopedSafeDraft(storage, "user-1", "company-1", "onboarding-company", {
      companyName: "Acme",
      password: "never",
      nested: { apiKey: "never", displayName: "Safe" },
      logoPreview: "data:image/png;base64,not-for-storage",
    })).toBe(true);
    expect(readScopedSafeDraft<Record<string, unknown>>(storage, "user-1", "company-1", "onboarding-company")).toEqual({
      companyName: "Acme",
      nested: { displayName: "Safe" },
    });
    expect(writeSafeDraft(storage, "onboarding-company-draft", { companyName: "Acme" })).toBe(false);
    expect(readSafeDraft(storage, "onboarding-company-draft")).toBeNull();
    expect(isSensitivePersistenceKey("password")).toBe(true);
    expect(writeScopedSafeDraft(storage, "user-1", "company-2", "onboarding-company", { companyName: "Other" })).toBe(true);
    expect(readScopedSafeDraft(storage, "user-1", "company-1", "onboarding-company")).not.toEqual({ companyName: "Other" });
  });
});
