import { describe, expect, it } from "vitest";
import {
  buildResumeUrl,
  getModuleFromUrl,
  getResumeLocationKey,
  isSensitivePersistenceKey,
  readResumeLocation,
  readSafeDraft,
  sanitizeResumeLocation,
  writeResumeLocation,
  writeSafeDraft,
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

  it("strips credential-bearing query and hash state", () => {
    const safe = sanitizeResumeLocation({
      ...context,
      pathname: "/app",
      search: "?module=inventory&access_token=do-not-save&tab=details",
      hash: "#refresh_token=do-not-save",
      moduleId: "inventory",
    }, context);

    expect(safe?.search).toContain("tab=details");
    expect(safe?.search).not.toContain("access_token");
    expect(safe?.hash).toBe("");
    expect(buildResumeUrl({ pathname: "/app", search: "?auth=login&invite=unsafe&tab=details", hash: safe?.hash || "", moduleId: safe?.moduleId })).toContain("module=inventory");
    expect(buildResumeUrl({ pathname: "/app", search: "?auth=login&invite=unsafe&tab=details", hash: safe?.hash || "", moduleId: safe?.moduleId })).not.toContain("auth=");
  });

  it("does not persist sensitive draft keys and excludes sensitive fields", () => {
    const storage = new MemoryStorage();
    expect(isSensitivePersistenceKey("password")).toBe(true);
    expect(isSensitivePersistenceKey("companyName")).toBe(false);
    expect(writeSafeDraft(storage, "onboarding-company-draft", { companyName: "Acme", password: "never" })).toBe(true);
    expect(readSafeDraft<Record<string, string>>(storage, "onboarding-company-draft")).toEqual({ companyName: "Acme" });
    expect(writeSafeDraft(storage, "password-draft", { value: "never" })).toBe(false);
    expect(readSafeDraft(storage, "password-draft")).toBeNull();
  });
});
