import { afterEach, describe, expect, it, vi } from "vitest";
import { callWorkspaceRpcWithSessionRefresh, isTerminalWorkspaceSessionError, sessionRecoveryDiagnosticCode, workspaceJoinErrorMessage } from "../client/src/BusinessSphereDashboard.jsx";
import { reportSessionRefreshOutcome } from "../client/src/lib/runtimeTelemetry";

function storage(values: Record<string, string> = {}) {
  const entries = new Map(Object.entries(values));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  };
}

function response(status: number, body: Record<string, unknown>) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("workspace session recovery", () => {
  it("refreshes a recoverably expired access token once before retrying the tenant RPC", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, { message: "JWT expired" }))
      .mockResolvedValueOnce(response(200, { access_token: "fresh-access", refresh_token: "fresh-refresh" }))
      .mockResolvedValueOnce(response(200, { id: "tenant-1", name: "Kilimanjaro Traders" }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { localStorage: storage({ bs_refresh_token: "refresh-token" }), sessionStorage: storage(), dispatchEvent: vi.fn() });

    const result = await callWorkspaceRpcWithSessionRefresh("join_company_with_code", { p_join_code: "JOIN01" }, "expired-access");

    expect(result.data).toMatchObject({ id: "tenant-1" });
    expect(result.accessToken).toBe("fresh-access");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer expired-access");
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer fresh-access");
  });

  it("does not classify tenant authorization and business-rule errors as expired sessions", () => {
    expect(isTerminalWorkspaceSessionError({ status: 403 })).toBe(false);
    expect(isTerminalWorkspaceSessionError({ status: 422, message: "Sign in with your administrator" })).toBe(false);
    expect(isTerminalWorkspaceSessionError({ status: 401 })).toBe(true);
    expect(isTerminalWorkspaceSessionError({ code: "SESSION_REFRESH_FAILED" })).toBe(true);
  });

  it("maps company join errors truthfully and reserves expiry wording for terminal authentication failures", () => {
    expect(workspaceJoinErrorMessage(new Error("Invalid join code"), "fallback")).toContain("not recognised");
    expect(workspaceJoinErrorMessage(new Error("This account already belongs to a different company"), "fallback")).toContain("another workspace");
    expect(workspaceJoinErrorMessage({ status: 422, message: "Sign in through your administrator portal" }, "fallback")).toBe("Sign in through your administrator portal");
    expect(workspaceJoinErrorMessage({ status: 401, message: "JWT expired" }, "fallback")).toContain("Your session has expired");
    expect(sessionRecoveryDiagnosticCode({ status: 401 })).toBe("SM-AUTH-401");
    expect(sessionRecoveryDiagnosticCode({ status: 503 })).toBeNull();
  });

  it("records refresh outcomes without credentials, identity fields, routes, or raw error details", () => {
    const localStorage = storage();
    vi.stubGlobal("window", { localStorage });
    reportSessionRefreshOutcome("retryable_failure", "launch_bootstrap");
    const serialized = localStorage.getItem("bs_session_refresh_telemetry") || "";
    expect(serialized).toContain('"type":"session_refresh"');
    expect(serialized).toContain('"outcome":"retryable_failure"');
    expect(serialized).not.toMatch(/token|email|tenant|company|href|error/i);
  });

  it("marks a failed refresh as terminal instead of silently retrying an invalid session", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, { message: "JWT expired" }))
      .mockResolvedValueOnce(response(400, { error_description: "Invalid refresh token" }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { localStorage: storage({ bs_refresh_token: "invalid-refresh" }), sessionStorage: storage(), dispatchEvent: vi.fn() });

    await expect(callWorkspaceRpcWithSessionRefresh("join_company_with_code", {}, "expired-access"))
      .rejects.toMatchObject({ code: "SESSION_REFRESH_FAILED" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
