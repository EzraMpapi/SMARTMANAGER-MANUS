import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const matrix = readFileSync(new URL("../MOBILE_AUTH_TEST_MATRIX.md", import.meta.url), "utf8");

describe("mobile authentication release matrix", () => {
  it("covers persistent and session-only login behavior on real devices", () => {
    expect(matrix).toContain("M-01");
    expect(matrix).toContain("M-02");
    expect(matrix).toContain("M-03");
    expect(matrix).toContain("reopening after the browser closes returns to the sign-in page");
  });

  it("covers provider-specific success, recovery, retry, and fallback flows", () => {
    expect(matrix).toContain("M-04");
    expect(matrix).toContain("M-05");
    expect(matrix).toContain("M-06");
    expect(matrix).toContain("M-07");
    expect(matrix).toContain("M-08");
    expect(matrix).toContain("M-09");
  });

  it("requires an approved square app icon without modifying the official horizontal artwork", () => {
    expect(matrix).toContain("1024 × 1024 square Smart Manager app-icon export");
    expect(matrix).toContain("Do not crop, recolour, recreate, or infer");
  });
});
