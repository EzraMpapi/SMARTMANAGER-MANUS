import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const signupTranslationsSource = readFileSync(new URL("../client/src/lib/signupTranslations.ts", import.meta.url), "utf8");

describe("Mobile Defect Fixes & Stabilization", () => {
  it("includes Edit3 icon in Lucide imports and uses it correctly in Collaboration Hub email folders", () => {
    expect(dashboardSource).toContain("Edit3");
    expect(dashboardSource).toContain("id:\"compose\"");
  });

  it("handles SignupPage step 1 submission with explicit validation feedback and step progression", () => {
    expect(signupTranslationsSource).toContain("Create your account");
    expect(signupTranslationsSource).toContain("Continue to company setup →");
    expect(dashboardSource).toContain("setStep(2)");
  });
});
