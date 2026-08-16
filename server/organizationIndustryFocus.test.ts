import { describe, expect, it } from "vitest";
import { normalizeOrganizationIndustryFocus } from "../client/src/lib/organizationIndustryFocus.js";
import { getLoginModulesForIndustry } from "../client/src/components/LoginModuleEcosystem.jsx";

describe("organization industry focus", () => {
  it("keeps the login presentation within the approved organization industry set", () => {
    expect(normalizeOrganizationIndustryFocus("retail")).toBe("retail");
    expect(normalizeOrganizationIndustryFocus("unknown")).toBe("general");
    expect(getLoginModulesForIndustry("retail").map((module) => module.id)).toContain("pos");
    expect(getLoginModulesForIndustry("unknown").map((module) => module.id)).toContain("dashboard");
  });
});
