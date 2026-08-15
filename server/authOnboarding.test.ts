import { describe, expect, it } from "vitest";
import { authScreenFromSearch, companyDefaultsForCountry, getPasswordChecks, isEnterprisePassword, oauthCallbackFromHash, passwordStrength } from "../client/src/lib/authOnboarding";

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

  it("parses an OAuth callback without conflating it with a recovery session", () => {
    expect(oauthCallbackFromHash("#access_token=access&refresh_token=refresh")).toEqual({ accessToken: "access", refreshToken: "refresh", errorCode: null, errorDescription: null });
    expect(oauthCallbackFromHash("#error=access_denied&error_description=cancelled")).toEqual({ accessToken: null, refreshToken: null, errorCode: "access_denied", errorDescription: "cancelled" });
  });
});
