import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/CommercialCommandCenters.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("commercial command-center contracts", () => {
  it("covers Sales and CRM operating views", () => {
    for (const text of ["Sales performance", "Revenue, pipeline, and collection execution", "Pipeline funnel", "Sales action queue", "CRM performance", "Pipeline quality and customer coverage", "Top opportunities", "Follow-up queue"]) expect(workspace).toContain(text);
    for (const source of ["sales_invoices", "inventory_items", "crm_leads"]) expect(workspace).toContain(source);
  });

  it("covers Marketing and E-Commerce operating views without fabricating attribution", () => {
    for (const text of ["Marketing performance", "Campaign reach and engagement", "Channel mix", "Attribution readiness", "ROI: Insufficient confirmed data", "E-Commerce performance", "Storefront health and order execution", "Payment mix", "Fulfillment queue"]) expect(workspace).toContain(text);
    for (const source of ["marketing_campaigns", "ecommerce_orders"]) expect(workspace).toContain(source);
  });

  it("keeps all four commercial capabilities wired through the current dashboard route shells", () => {
    for (const route of [
      '{active === "crm" && <CRM',
      '{active === "sales" && <Sales',
      '{active === "marketing" && <Marketing',
      '{active === "ecommerce" && <ECommerce',
    ]) expect(dashboard).toContain(route);
    expect(workspace).toContain("Insufficient confirmed data");
  });
});
