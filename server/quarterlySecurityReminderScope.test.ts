import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const reminder = source.slice(source.indexOf("function QuarterlySecurityReviewChecklist"), source.indexOf("function BranchesManager"));

describe("quarterly security review reminder scope", () => {
  it("keeps local completion isolated to the active user, workspace, and quarter", () => {
    expect(source).toContain("<QuarterlySecurityReviewChecklist companyName={company.name} companyId={company.id} userId={currentUser.id} />");
    expect(reminder).toContain("function QuarterlySecurityReviewChecklist({ companyName, companyId, userId })");
    expect(reminder).toContain("const reminderScope = `${String(companyId || \"unknown-workspace\")}:${String(userId || \"unknown-user\")}`;");
    expect(reminder).toContain("const reminderKey = `smart-manager:security-review:${reminderScope}:${quarterKey}`;");
    expect(reminder).toContain("[reminderKey]");
    expect(reminder).toContain("this browser, account, and workspace");
  });
});
