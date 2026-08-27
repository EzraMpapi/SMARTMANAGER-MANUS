import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
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

  it("shows a retryable confirmed-service error instead of presenting rejected ticket reads as loading or empty data", () => {
    expect(ticketSection).toContain("const queryError = shouldSearchServer ? searchedTickets.error : serverTickets.error;");
    expect(ticketSection).toContain("Tickets could not be loaded");
    expect(ticketSection).toContain("Retry tickets");
    expect(ticketSection).toContain("shouldSearchServer ? searchedTickets.refetch() : serverTickets.refetch()");
  });

  it("shows only server-sanitized provider readiness and retains the truthful WhatsApp Web handoff", () => {
    expect(whatsappSection).toContain("trpc.support.whatsappProviderReadiness.useQuery");
    expect(whatsappSection).toContain("Smart Manager does not store or transmit WhatsApp provider credentials in this browser.");
    expect(whatsappSection).toContain("providerReadiness.data.message");
  });

  it("uses the verified support configuration contract for workflow and SLA policies without claiming automatic execution", () => {
    expect(dashboard).toContain("function SupportPolicyCenter()");
    expect(dashboard).toContain("trpc.support.listWorkflowPolicies.useQuery");
    expect(dashboard).toContain("trpc.support.saveWorkflowPolicy.useMutation");
    expect(dashboard).toContain("trpc.support.listSlaPolicies.useQuery");
    expect(dashboard).toContain("trpc.support.saveSlaPolicy.useMutation");
    expect(dashboard).toContain("Automatic execution is disabled.");
    expect(dashboard).toContain("It does not run in the background or change a ticket automatically.");
  });

  it("uses tenant-verified support search and review-only drafting rather than browser-built prompts or send actions", () => {
    const supportAiSection = dashboard.slice(dashboard.indexOf("function SupportAI("), dashboard.indexOf("/* ------------------------------------ ANALYTICS"));
    expect(supportAiSection).toContain("trpc.support.searchTickets.useQuery");
    expect(supportAiSection).toContain("trpc.support.draftTicketReply.useMutation");
    expect(supportAiSection).toContain("Review-only suggested draft");
    expect(supportAiSection).toContain("It cannot send a message, change a ticket, run a workflow, or contact a customer.");
    expect(supportAiSection).not.toContain("trpc.ai.assist.useMutation");
    expect(supportAiSection).not.toContain("sendWebhookNotification");
  });
});
