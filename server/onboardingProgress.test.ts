import { describe, expect, it } from "vitest";
import { getSignupProgressionStep, getSignupStepOneValidationError } from "../client/src/lib/onboardingProgress";

const account = {
  fullName: "Asha Mrema",
  email: "asha@example.invalid",
  password: "StrongPass!123",
  confirmPassword: "StrongPass!123",
};

describe("signup first-step progression", () => {
  it("requires explicit terms acceptance without suppressing the continuation action", () => {
    expect(getSignupStepOneValidationError({ account, termsAccepted: false }))
      .toBe("Please accept the Terms of Service and Privacy Policy to continue.");
  });

  it("advances a valid accepted account directly to company setup", () => {
    expect(getSignupStepOneValidationError({ account, termsAccepted: true })).toBeNull();
    expect(getSignupProgressionStep({ step: 1, account, company: {} })).toBe(2);
  });
});
