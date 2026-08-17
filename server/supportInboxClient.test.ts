import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const ticketSection = dashboard.slice(dashboard.indexOf("function Tickets("), dashboard.indexOf("function TicketPanel("));
const panelSection = dashboard.slice(dashboard.indexOf("function TicketPanel("), dashboard.indexOf("function TicketFormPanel("));
const whatsappSection = dashboard.slice(dashboard.indexOf("function WhatsAppCenter("), dashboard.indexOf("/* ═══════════════════════════════════════════════════════════════════════\n   CUSTOMER PORTAL"));

describe("server-confirmed support inbox", () => {
  it("uses the verified support tRPC contract in configured workspaces", () => {
    expect(ticketSection).toContain("trpc.support.listTickets.useQuery");
    expect(ticketSection).toContain("trpc.support.createTicket.useMutation");
    expect(ticketSection).toContain("trpc.support.updateTicket.useMutation");
    expect(ticketSection).toContain("trpc.support.addInternalNote.useMutation");
    expect(ticketSection).toContain("const result = await createTicket.mutateAsync");
    expect(ticketSection).toContain("await updateTicket.mutateAsync");
    expect(ticketSection).toContain("await addInternalNote.mutateAsync");
    expect(ticketSection).toContain("The server did not confirm this ticket");
  });

  it("labels ticket-panel writes as internal notes rather than customer-channel delivery", () => {
    expect(panelSection).toContain("Add internal note");
    expect(panelSection).toContain("Internal note");
    expect(panelSection).not.toContain("Send reply");
  });

  it("shows only server-sanitized provider readiness and retains the truthful WhatsApp Web handoff", () => {
    expect(whatsappSection).toContain("trpc.support.whatsappProviderReadiness.useQuery");
    expect(whatsappSection).toContain("Smart Manager does not store or transmit WhatsApp provider credentials in this browser.");
    expect(whatsappSection).toContain("providerReadiness.data.message");
  });
});
