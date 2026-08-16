import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const evidence = readFileSync(new URL("../MOBILE_AUTH_RELEASE_EVIDENCE.md", import.meta.url), "utf8");

describe("mobile authentication release evidence", () => {
  it("records sanitized browser-based provider recovery acceptance evidence", () => {
    expect(evidence).toContain("Browser-based mobile viewport, 375 × 812");
    expect(evidence).toContain("M-05 Google cancellation recovery");
    expect(evidence).toContain("M-06 Microsoft cancellation recovery");
    expect(evidence).toContain("M-07 Apple cancellation recovery");
  });

  it("keeps real-device acceptance and the official square-icon handoff explicit", () => {
    expect(evidence).toContain("Pending physical device");
    expect(evidence).toContain("closing the entire browser after M-02");
    expect(evidence).toContain("1024 × 1024 square Smart Manager app-icon export");
    expect(evidence).toContain("No substitute icon has been created, cropped, recoloured, or inferred.");
  });
});
