// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  ONBOARDING_PROGRESS_STORAGE_KEY,
  clearOnboardingProgress,
  getSignupProgressionStep,
  hasOnboardingProgress,
  readOnboardingProgress,
  sanitizeOnboardingProgress,
  writeOnboardingProgress,
} from "../client/src/lib/onboardingProgress";

const modules = ["crm", "sales", "finance"];
const account = { fullName: "Asha Mrema", email: "asha@example.com", password: "StrongPass!123", confirmPassword: "StrongPass!123" };

describe("headless signup wizard progression", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("moves through account, company, and module-selection steps only when each prerequisite is satisfied", () => {
    expect(getSignupProgressionStep({ step: 1, account: { ...account, confirmPassword: "mismatch" }, company: {} })).toBe(1);
    expect(getSignupProgressionStep({ step: 1, account, company: {} })).toBe(2);
    expect(getSignupProgressionStep({ step: 2, account, company: { name: "" } })).toBe(2);
    expect(getSignupProgressionStep({ step: 2, account, company: { name: "Kilimanjaro Traders" } })).toBe(3);
  });

  it("restores only non-secret draft fields after refresh and always resumes on the password step", () => {
    const safe = sanitizeOnboardingProgress({
      step: 3,
      account: { ...account, phone: "700123456" },
      company: { name: "Kilimanjaro Traders", category: "retail", logo: "data:image/png;base64,unsafe" },
      selectedModules: ["crm", "unknown"],
      joinCode: "JOIN-SECRET",
      firstBranch: "Kariakoo",
    }, modules);
    expect(safe).toMatchObject({ step: 1, account: { fullName: "Asha Mrema", email: "asha@example.com", phone: "700123456" }, company: { name: "Kilimanjaro Traders", category: "retail" }, selectedModules: ["crm"], firstBranch: "Kariakoo" });
    expect(JSON.stringify(safe)).not.toContain("StrongPass!123");
    expect(JSON.stringify(safe)).not.toContain("JOIN-SECRET");
    expect(JSON.stringify(safe)).not.toContain("data:image");
  });

  it("keeps deliberate safe company preference changes but ignores untouched signup defaults", () => {
    const untouchedDefaults = {
      company: { category: "general", country: "Tanzania", currency: "TZS", timezone: "Africa/Dar_es_Salaam", brandColor: "#0B5D3B", brandAccentColor: "#16A34A" },
      selectedModules: modules,
    };
    expect(hasOnboardingProgress(untouchedDefaults, modules)).toBe(false);
    expect(hasOnboardingProgress({ ...untouchedDefaults, company: { ...untouchedDefaults.company, category: "pharmacy" } }, modules)).toBe(true);
    expect(hasOnboardingProgress({ ...untouchedDefaults, company: { ...untouchedDefaults.company, country: "Kenya", currency: "KES", timezone: "Africa/Nairobi", brandColor: "#123456" } }, modules)).toBe(true);
  });

  it("round-trips safe draft state through sessionStorage and clears it after setup succeeds", () => {
    writeOnboardingProgress({ account: { fullName: "Asha" }, company: { name: "Traders" }, selectedModules: ["sales"] }, modules);
    expect(readOnboardingProgress(modules)).toMatchObject({ account: { fullName: "Asha" }, company: { name: "Traders" }, selectedModules: ["sales"] });
    clearOnboardingProgress();
    expect(window.sessionStorage.getItem(ONBOARDING_PROGRESS_STORAGE_KEY)).toBeNull();
  });
});
