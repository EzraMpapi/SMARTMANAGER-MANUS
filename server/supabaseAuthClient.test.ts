import { afterEach, describe, expect, it, vi } from "vitest";
import {
  authDiagnosticCode,
  isDefinitiveSupabaseAuthFailure,
  refreshSupabaseSession,
  resetSupabaseAuthClient,
} from "../client/src/lib/supabaseAuthClient";

afterEach(() => {
  resetSupabaseAuthClient();
  vi.restoreAllMocks();
});

describe("shared Supabase auth session manager", () => {
  it("single-flights concurrent refresh calls", async () => {
    let resolveRefresh!: (value: any) => void;
    const refreshSession = vi.fn(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    const client = { auth: { refreshSession } } as any;

    const first = refreshSupabaseSession(client);
    const second = refreshSupabaseSession(client);
    resolveRefresh({ data: { session: { access_token: "fresh" } }, error: null });

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
  });

  it("treats refresh-token rejection as definitive but not an unclassified network failure", () => {
    expect(isDefinitiveSupabaseAuthFailure({ status: 400, message: "Invalid refresh token" })).toBe(true);
    expect(authDiagnosticCode({ status: 400, message: "Invalid refresh token" })).toBe("SM-AUTH-401-REFRESH-TOKEN-INVALID");
    expect(isDefinitiveSupabaseAuthFailure(new TypeError("Failed to fetch"))).toBe(false);
    expect(authDiagnosticCode(new TypeError("Failed to fetch"))).toBe("SM-AUTH-401-NETWORK");
  });
});
