import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("compliance approval export route", () => {
  it("requires the verified profile company before returning audit and role approval history", () => {
    expect(source).toContain("complianceExport: protectedProcedure");
    expect(source).toContain("profile.company_id !== input.companyId");
    expect(source).toContain("await listRoleChangeApprovals(ctx.req)");
  });
});
