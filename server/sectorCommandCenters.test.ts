import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/SectorCommandCenters.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("sector command-center contracts", () => {
  it("covers lending and savings sectors", () => {
    for (const text of ["Microfinance control tower", "Portfolio health, savings, and PAR monitoring", "Active clients", "Loan portfolio", "Net savings", "Banking & MFI control tower", "Deposits", "PAR exposure", "Pending applications"]) expect(workspace).toContain(text);
    for (const source of ["mfi_clients", "mfi_loans", "mfi_savings", "bnk_accounts", "bnk_loans", "bnk_applications"]) expect(workspace).toContain(source);
  });

  it("covers VICOBA and Community Groups", () => {
    for (const text of ["VICOBA / SACCOS control tower", "Member fund", "Defaulted loans", "Community finance control tower", "Groups", "Members represented", "Group funds", "Pending contributions"]) expect(workspace).toContain(text);
    for (const source of ["vicoba_members", "vicoba_loans", "vicoba_meetings", "community_groups", "community_contributions"]) expect(workspace).toContain(source);
  });

  it("keeps all sector centers routed through existing modules", () => {
    for (const route of [
      '{active === "microfinance" && (',
      "<LazyMicrofinanceWorkspace",
      '{active === "banking"     && <BankingMFIModule',
      '{active === "vicoba" && <VicobaSaccosModule',
      '{active === "community" && <CommunityGroupsModule',
    ]) expect(dashboard).toContain(route);
    expect(workspace).toContain("Insufficient confirmed data");
  });
});
