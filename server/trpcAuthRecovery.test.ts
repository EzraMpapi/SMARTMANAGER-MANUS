import { describe, expect, it } from "vitest";
import { UNAUTHED_ERR_MSG } from "../shared/const";
import { hasStoredSupabaseSession, isUnauthenticatedTrpcFailure } from "../client/src/lib/trpcAuthRecovery";

function storage(values: Record<string, string> = {}) {
  const entries = new Map(Object.entries(values));
  return { getItem: (key: string) => entries.get(key) ?? null } as Storage;
}

describe("tRPC unauthenticated recovery", () => {
  it("recognizes both legacy message and structured 401 tRPC failures", () => {
    expect(isUnauthenticatedTrpcFailure({ message: UNAUTHED_ERR_MSG })).toBe(true);
    expect(isUnauthenticatedTrpcFailure({ data: { code: "UNAUTHORIZED" } })).toBe(true);
    expect(isUnauthenticatedTrpcFailure({ data: { httpStatus: 401 } })).toBe(true);
    expect(isUnauthenticatedTrpcFailure({ data: { httpStatus: 403 } })).toBe(false);
  });

  it("distinguishes a Supabase-backed workspace session from an empty browser session", () => {
    expect(hasStoredSupabaseSession(storage({ bs_access_token: "access" }))).toBe(true);
    expect(hasStoredSupabaseSession(storage({ bs_session_access_token: "access" }))).toBe(true);
    expect(hasStoredSupabaseSession(storage())).toBe(false);
  });
});
