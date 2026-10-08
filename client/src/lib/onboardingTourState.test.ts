import { describe, expect, it } from "vitest";
import { hasOnboardingCompletion, shouldOpenOnboardingTour } from "./onboardingTourState";

describe("onboarding tour hybrid completion state", () => {
  it("opens for a new user when neither local storage nor profile metadata is complete", () => {
    expect(shouldOpenOnboardingTour({ localStorageValue: null, profileCompletedAt: null })).toBe(true);
    expect(hasOnboardingCompletion({ localStorageValue: null, profileCompletedAt: null })).toBe(false);
  });

  it("stays closed when the scoped local-storage record exists", () => {
    expect(shouldOpenOnboardingTour({
      localStorageValue: JSON.stringify({ status: "completed", completedAt: "2026-10-08T19:00:00.000Z" }),
      profileCompletedAt: null,
    })).toBe(false);
  });

  it("stays closed when profile metadata exists, including on a new device", () => {
    expect(shouldOpenOnboardingTour({
      localStorageValue: null,
      profileCompletedAt: "2026-10-08T19:00:00.000Z",
    })).toBe(false);
  });

  it("uses OR semantics when either persistence source confirms completion", () => {
    expect(hasOnboardingCompletion({ localStorageValue: "dismissed", profileCompletedAt: null })).toBe(true);
    expect(hasOnboardingCompletion({ localStorageValue: null, profileCompletedAt: "2026-10-08T19:00:00.000Z" })).toBe(true);
    expect(hasOnboardingCompletion({ localStorageValue: "completed", profileCompletedAt: "2026-10-08T19:00:00.000Z" })).toBe(true);
  });

  it("treats empty or malformed completion values as incomplete", () => {
    expect(shouldOpenOnboardingTour({ localStorageValue: "", profileCompletedAt: "" })).toBe(true);
    expect(shouldOpenOnboardingTour({ localStorageValue: "   ", profileCompletedAt: "   " })).toBe(true);
    expect(shouldOpenOnboardingTour({ localStorageValue: null, profileCompletedAt: undefined })).toBe(true);
  });
});
