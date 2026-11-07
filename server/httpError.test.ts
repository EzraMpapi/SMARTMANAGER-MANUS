import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { httpStatusFromError } from "./_core/httpError";

describe("REST error status mapping", () => {
  it("preserves explicit handler statuses", () => {
    expect(httpStatusFromError(Object.assign(new Error("provider unavailable"), { status: 503 }))).toBe(503);
  });

  it("maps TRPC authorization errors to REST status codes", () => {
    expect(httpStatusFromError(new TRPCError({ code: "UNAUTHORIZED" }))).toBe(401);
    expect(httpStatusFromError(new TRPCError({ code: "FORBIDDEN" }))).toBe(403);
  });

  it("uses the safe fallback for unknown errors", () => {
    expect(httpStatusFromError(new Error("unexpected"))).toBe(500);
  });
});
