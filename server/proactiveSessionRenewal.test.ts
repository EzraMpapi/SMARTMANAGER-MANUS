import { describe, expect, it } from "vitest";
import {
  getAccessTokenExpiryMs,
  getProactiveSessionRenewalDelay,
  isTerminalSessionRefreshError,
  sessionRenewalTiming,
} from "../client/src/lib/proactiveSessionRenewal.js";

function jwtWithExpiry(exp: number) {
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return `header.${payload}.signature`;
}

describe("proactive session renewal", () => {
  it("schedules a valid access token before its expiry without treating the JWT payload as trusted authorization", () => {
    const now = 1_700_000_000_000;
    const expiry = Math.floor((now + 10 * 60 * 1000) / 1000);
    expect(getAccessTokenExpiryMs(jwtWithExpiry(expiry))).toBe(expiry * 1000);
    expect(getProactiveSessionRenewalDelay(jwtWithExpiry(expiry), now)).toBe(8 * 60 * 1000);
  });

  it("uses a bounded fallback delay for malformed tokens and a minimum delay near expiry", () => {
    expect(getProactiveSessionRenewalDelay("not-a-jwt", 0)).toBe(sessionRenewalTiming.defaultDelayMs);
    expect(getProactiveSessionRenewalDelay(jwtWithExpiry(1), 999)).toBe(sessionRenewalTiming.minimumDelayMs);
  });

  it("only treats definitive refresh-token failures as terminal", () => {
    expect(isTerminalSessionRefreshError({ status: 401 })).toBe(true);
    expect(isTerminalSessionRefreshError({ message: "invalid_grant" })).toBe(true);
    expect(isTerminalSessionRefreshError({ status: 503, message: "Service unavailable" })).toBe(false);
  });
});
