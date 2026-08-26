import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const tickets = source.slice(source.indexOf("function Tickets("), source.indexOf("function TicketPanel("));
const panel = source.slice(source.indexOf("function TicketPanel("), source.indexOf("function TicketFormPanel("));
const form = source.slice(source.indexOf("function TicketFormPanel("), source.indexOf("/* ---------------------------------- LIVE CHAT"));

describe("Customer Support persistence boundaries", () => {
  it("keeps server-backed ticket creation confirmed and retryable", () => {
    expect(tickets).toContain("if (createTicket.isPending) return;");
    expect(tickets).toContain("The server did not confirm this ticket. Your form remains open so you can retry.");
    expect(tickets).toContain("await utils.support.listTickets.invalidate();");
    expect(form).toContain("disabled={saving}");
    expect(form).toContain('{saving ? "Creating…" : "Create Ticket"}');
  });

  it("blocks duplicate server status and internal-note submissions", () => {
    expect(tickets).toContain("if (updateTicket.isPending) return;");
    expect(tickets).toContain("if (addInternalNote.isPending) return;");
    expect(tickets).toContain("The server did not confirm this status change.");
    expect(tickets).toContain("The server did not confirm this internal note.");
    expect(panel).toContain("disabled={noteSaving}");
    expect(panel).toContain("disabled={statusSaving || s === ticket.status}");
    expect(panel).toContain("aria-busy={noteSaving}");
  });
});

export {};
