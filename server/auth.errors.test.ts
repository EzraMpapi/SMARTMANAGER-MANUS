import { describe, expect, it } from "vitest";
import { createAuthRequestError, toAuthUserMessage, validatePasswordLogin } from "../client/src/lib/authErrors";

describe("password-login validation and error mapping", () => {
  it("validates required fields and email format before sending a password-login request", () => {
    expect(validatePasswordLogin("", "secret")).toBe("Email and password are required.");
    expect(validatePasswordLogin("invalid-email", "secret")).toBe("Enter a valid email address.");
    expect(validatePasswordLogin("member@example.com", "secret")).toBeNull();
  });

  it("maps the live Supabase invalid_credentials response without misclassifying it as a network failure", () => {
    const error = createAuthRequestError(400, { error_code: "invalid_credentials", msg: "Invalid login credentials" }, "Sign-in failed.");
    expect(error.code).toBe("invalid_credentials");
    expect(toAuthUserMessage(error)).toBe("Invalid email or password.");
  });

  it("distinguishes confirmation, rate-limit, server, configuration, and network failures", () => {
    expect(toAuthUserMessage(createAuthRequestError(400, { error_code: "email_not_confirmed", msg: "Email not confirmed" }, "Sign-in failed."))).toBe("Confirm your email address before signing in.");
    expect(toAuthUserMessage(createAuthRequestError(429, { msg: "Too many requests" }, "Sign-in failed."))).toContain("Too many sign-in attempts");
    expect(toAuthUserMessage(createAuthRequestError(503, { msg: "Unavailable" }, "Sign-in failed."))).toContain("authentication server is temporarily unavailable");
    expect(toAuthUserMessage(Object.assign(new Error("Authentication is not configured."), { code: "AUTH_CONFIGURATION_MISSING" }))).toContain("not configured");
    expect(toAuthUserMessage(Object.assign(new Error("Unable to reach the authentication server."), { code: "NETWORK_ERROR" }))).toContain("Unable to connect");
  });

  it("explains password-recovery email delivery outages separately from sign-in outages", () => {
    expect(toAuthUserMessage(Object.assign(new Error("SMTP unavailable"), { code: "AUTH_RECOVERY_SERVICE_UNAVAILABLE", status: 503 }))).toContain("Password recovery email delivery is temporarily unavailable");
  });
});
