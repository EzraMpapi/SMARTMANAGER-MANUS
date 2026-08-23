import { describe, expect, it } from "vitest";
import { authReducer, AUTH_STATES, initialAuthState } from "../client/src/lib/authStateMachine";

const session = { access_token: "access", user: { id: "user-1", email: "owner@example.com" } };
const identity = {
  profile: { id: "user-1", company_id: "company-1", role: "Owner" },
  company: { id: "company-1", name: "Example Company" },
  workspace: { id: "workspace-1", company_id: "company-1" },
  membership: { id: "membership-1", company_id: "company-1" },
  role: "Owner",
  permissions: ["finance.view"],
};

describe("centralized auth state machine", () => {
  it("moves through authenticated profile and workspace loading states", () => {
    const established = authReducer(initialAuthState, { type: "SESSION_ESTABLISHED", session, user: session.user });
    expect(established.status).toBe(AUTH_STATES.AUTHENTICATED);
    expect(authReducer(established, { type: "PROFILE_LOADING" }).status).toBe(AUTH_STATES.PROFILE_LOADING);
    const profileState = authReducer(established, { type: "WORKSPACE_LOADING", profile: identity.profile });
    expect(profileState.status).toBe(AUTH_STATES.WORKSPACE_LOADING);
    expect(profileState.profile).toEqual(identity.profile);
    const authorized = authReducer(profileState, { type: "AUTHORIZED", session, user: session.user, identity });
    expect(authorized.status).toBe(AUTH_STATES.AUTHORIZED);
    expect(authorized.permissions).toEqual(["finance.view"]);
  });

  it("retains a real session but denies incomplete identity without exposing stale tenant state", () => {
    const state = authReducer(initialAuthState, { type: "INCOMPLETE_IDENTITY", session, user: session.user, profile: { id: "user-1" }, reason: "PROFILE_MISSING" });
    expect(state.status).toBe(AUTH_STATES.UNAUTHORIZED);
    expect(state.session).toEqual(session);
    expect(state.user).toEqual(session.user);
    expect(state.company).toBeNull();
    expect(state.permissions).toEqual([]);
    expect(state.reason).toBe("PROFILE_MISSING");
  });

  it("updates a refreshed session and clears all identity on sign-out", () => {
    const authorized = authReducer(initialAuthState, { type: "AUTHORIZED", session, user: session.user, identity });
    const refreshed = authReducer(authorized, { type: "TOKEN_REFRESHED", session: { ...session, access_token: "fresh" } });
    expect(refreshed.session.access_token).toBe("fresh");
    const signedOut = authReducer(refreshed, { type: "SIGNED_OUT" });
    expect(signedOut.status).toBe(AUTH_STATES.UNAUTHENTICATED);
    expect(signedOut.session).toBeNull();
    expect(signedOut.profile).toBeNull();
    expect(signedOut.permissions).toEqual([]);
  });

  it("keeps recovery and user update events explicit", () => {
    const recovery = authReducer(initialAuthState, { type: "PASSWORD_RECOVERY", session, user: session.user });
    expect(recovery.status).toBe(AUTH_STATES.AUTHENTICATED);
    expect(recovery.reason).toBe("PASSWORD_RECOVERY");
    const updated = authReducer(recovery, { type: "USER_UPDATED", user: { ...session.user, email: "new@example.com" } });
    expect(updated.user.email).toBe("new@example.com");
  });

  it("represents initialization failures without falling through to an authenticated shell", () => {
    const failed = authReducer(initialAuthState, { type: "AUTH_ERROR", error: { code: "AUTH_CONFIGURATION_MISSING", message: "Missing configuration" }, reason: "AUTH_CONFIGURATION_MISSING" });
    expect(failed.status).toBe(AUTH_STATES.AUTH_ERROR);
    expect(failed.error).toEqual({ code: "AUTH_CONFIGURATION_MISSING", message: "Missing configuration" });
    expect(failed.session).toBeNull();
    expect(failed.user).toBeNull();
  });
});
