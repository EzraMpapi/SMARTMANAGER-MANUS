import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const tour = source.slice(source.indexOf("const ONBOARDING_TOUR_STEPS"), source.indexOf("function SmartManager()"));

describe("interactive onboarding tour", () => {
  it("introduces the verified high-value ERP modules", () => {
    for (const moduleId of ["dashboard", "sales", "pos", "inventory", "finance", "collaboration", "ai"]) {
      expect(tour).toContain(`moduleId: "${moduleId}"`);
    }
    expect(tour).toContain("ONBOARDING_TOUR_STEPS.length");
    expect(tour).toContain("remainingSteps = Math.max(0");
    expect(tour).toContain("remainingLabel = remainingSteps === 0 ? \"Final step\"");
    expect(tour).toContain('role="progressbar"');
    expect(tour).toContain("aria-valuetext={`Step ${stepIndex + 1} of ${ONBOARDING_TOUR_STEPS.length}; ${remainingLabel}`}");
    expect(tour).toContain("Every permanent change is designed to wait for server confirmation.");
  });

  it("scopes completion to the authenticated user and active workspace", () => {
    expect(tour).toContain("bs_onboarding_tour_");
    expect(tour).toContain("currentUser?.id || currentUser?.name");
    expect(tour).toContain("company?.id || company?.name");
    expect(tour).toContain("window.localStorage.getItem(storageKey)");
    expect(tour).toContain("window.localStorage.setItem(storageKey");
  });

  it("provides dialog semantics, focus management, keyboard navigation, and restart access", () => {
    expect(tour).toContain('role="dialog"');
    expect(tour).toContain('aria-modal="true"');
    expect(tour).toContain('aria-labelledby="onboarding-tour-title"');
    expect(tour).toContain('event.key === "Escape"');
    expect(tour).toContain('event.key === "ArrowRight"');
    expect(tour).toContain('event.key === "ArrowLeft"');
    expect(tour).toContain('event.key !== "Tab"');
    expect(tour).toContain('data-onboarding-trigger="true"');
    expect(source).toContain("<OnboardingTour currentUser={currentUser} company={company}");
  });
});

export {};
