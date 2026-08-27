import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const ticketSection = source.slice(source.indexOf("function CustomerSupportTab"), source.indexOf("function CustomerSupportTab") + 3000);

describe("support ticket persistence", () => {
  it("waits for a confirmed server record before updating the configured-workspace UI", () => {
    expect(ticketSection).toContain('await sb("support_tickets").insert');
    expect(ticketSection).toContain(".single().run()");
    expect(ticketSection).toContain("The server did not confirm the support ticket.");
    expect(ticketSection).toContain("The ticket could not be submitted to the server. Your details are still available to retry.");
    expect(ticketSection.indexOf('await sb("support_tickets").insert')).toBeLessThan(ticketSection.indexOf("tickets.setRows"));
  });
});
