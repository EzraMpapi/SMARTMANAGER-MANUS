import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "client/src");
const intelligence = fs.readFileSync(path.join(root, "components/IntelligenceCommandCenters.jsx"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "BusinessSphereDashboardCore.jsx"), "utf8");
const tra = fs.readFileSync(path.join(root, "components/TraPortalModule.jsx"), "utf8");

describe("support, AI, and TRA intelligence contracts", () => {
  it("covers support workload and data-grounded AI signals", () => {
    for (const text of ["Service control tower", "Support workload, priority, and response posture", "Open tickets", "Priority tickets", "Confirmed-data signals ready for analysis", "Grounding policy", "Insufficient confirmed data"]) expect(intelligence).toContain(text);
    for (const source of ["support_tickets + support_ticket_messages", "tenant-scoped invoice, inventory, CRM, expense, HR, supplier, quotation, and workflow context"]) expect(intelligence).toContain(source);
  });

  it("keeps Support and AI capabilities routed through the current dashboard module shells", () => {
    expect(dashboard).toContain('{active === "support" && <CustomerSupport company={company} />}');
    expect(dashboard).toContain('{active === "ai" && (');
    expect(dashboard).toContain("<AIAssistant company={company}");
  });

  it("preserves explicit TRA readiness and non-fabrication language", () => {
    for (const text of ["READY", "AWAITING_CONFIGURATION", "UNAVAILABLE", "Internal ERP records are never presented as TRA acknowledgements", "No production fiscal submission has been attempted.", "Not a TRA filing or TRA acknowledgement"]) expect(tra).toContain(text);
  });
});
