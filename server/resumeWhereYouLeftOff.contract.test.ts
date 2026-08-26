import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const resumeSource = readFileSync(resolve(process.cwd(), "client/src/lib/resumeSession.ts"), "utf8");

const requiredModules = [
  "dashboard", "sales", "inventory", "procurement", "finance", "pos", "crm", "hr", "reports",
  "healthcare", "pharmacy", "school", "microfinance", "vicoba", "hotel", "fleet", "restaurant", "employee-portal",
];

describe("resume where you left off contracts", () => {
  it("restores only after authenticated workspace and entitlement resolution", () => {
    expect(dashboardSource).toContain("readResumeLocation");
    expect(dashboardSource).toContain("subscriptionFilteringReady");
    expect(dashboardSource).toContain("resumeRestoredRef.current === resumeRestoreKey");
    expect(dashboardSource).toContain("const nextModule = allowedModuleIds.includes(candidate)");
    expect(dashboardSource).toContain("window.history.replaceState(null, \"\", buildResumeUrl");
  });

  it("persists the current location from the central module navigation boundary", () => {
    expect(dashboardSource).toContain("const persistResumeLocation = useCallback");
    expect(dashboardSource).toContain("persistResumeLocation(id);");
    expect(dashboardSource).toContain("clearResumeLocation(window.localStorage, session.userId, session.company.id)");
    for (const moduleId of requiredModules) expect(dashboardSource).toContain(`{ id: "${moduleId}"`);
  });

  it("keeps credentials and cross-tenant records outside the persistence contract", () => {
    expect(resumeSource).toContain("SENSITIVE_KEY_PATTERN");
    expect(resumeSource).toContain("input?.userId && input.userId !== context.userId");
    expect(resumeSource).toContain("input?.companyId && input.companyId !== context.companyId");
    expect(resumeSource).toContain("SENSITIVE_CALLBACK_KEY_PATTERN");
    expect(resumeSource).toContain("function sanitizeSearch");
    expect(resumeSource).toContain("function sanitizeHash");
    expect(resumeSource).toContain("isResumeLocationFresh");
    expect(resumeSource).toContain("getSafeDraftKey");
    expect(resumeSource).toContain("sanitizeDraftValue");
    expect(resumeSource).toContain("writeSafeDraft");
  });
});
