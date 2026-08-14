import { describe, expect, it } from "vitest";
import { authScreenFromSearch, companyDefaultsForCountry, getPasswordChecks, isEnterprisePassword, passwordStrength } from "../client/src/lib/authOnboarding";

describe("enterprise authentication onboarding helpers", () => {
  it("requires a balanced, non-trivial password for new password credentials", () => {
    expect(getPasswordChecks("Short1!").length).toBe(false);
    expect(passwordStrength("Password1!")).toBe(5);
    expect(isEnterprisePassword("Password1!")).toBe(true);
    expect(isEnterprisePassword("password1!")).toBe(false);
  });

  it("uses Tanzania-safe workspace defaults while retaining international defaults", () => {
    expect(companyDefaultsForCountry("Tanzania")).toEqual({ currency: "TZS", timezone: "Africa/Dar_es_Salaam" });
    expect(companyDefaultsForCountry("Other")).toEqual({ currency: "USD", timezone: "UTC" });
  });

  it("accepts only public authentication screens from query state", () => {
    expect(authScreenFromSearch("?auth=reset")).toBe("reset");
    expect(authScreenFromSearch("?auth=dashboard")).toBe("login");
  });
});
