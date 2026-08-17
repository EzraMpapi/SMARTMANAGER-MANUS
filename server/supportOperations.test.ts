import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveVerifiedProfile = vi.fn();
vi.mock("./aiApprovals", () => ({ resolveVerifiedProfile }));
const invokeLLM = vi.fn();
vi.mock("./_core/llm", () => ({ invokeLLM }));

describe("support operations", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "profile-a", company_id: "company-a", role: "Support Manager", full_name: "Asha" }, token: "session-a" });
  });

  it("derives company ownership from the verified profile when creating a ticket", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "ticket-a", company_id: "company-a", subject: "Need help" }]), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "activity-a" }]), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { createSupportTicket } = await import("./supportOperations");
    const result = await createSupportTicket({ headers: { authorization: "Bearer ignored" } } as any, { subject: "Need help", customer: "Kilimo Fresh", initialMessage: "Please investigate" });
    expect(result.ticket.id).toBe("ticket-a");
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.company_id).toBe("company-a");
    expect(payload.status).toBe("Open");
    expect(payload.notes).toBe("Please investigate");
  });

  it("rejects support operations for a verified role outside the support matrix", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "profile-b", company_id: "company-b", role: "Cashier", full_name: "Bongo" }, token: "session-b" });
    const { listSupportTickets } = await import("./supportOperations");
    await expect(listSupportTickets({ headers: {} } as any)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("accepts only the established owner alias as an Organization Owner and returns the canonical role", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "profile-owner", company_id: "company-a", role: "owner", full_name: "Ezra" }, token: "session-owner" });
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { listSupportTickets } = await import("./supportOperations");
    const result = await listSupportTickets({ headers: {} } as any);
    expect(result.tickets).toEqual([]);
    expect(result.profile.role).toBe("Organization Owner");
    expect(fetchMock.mock.calls[0][0]).toContain("support_tickets?select=");
  });

  it("writes an explicit internal note and never models it as an outbound message", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "ticket-a", company_id: "company-a" }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "note-a", kind: "internal_note" }]), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "activity-a" }]), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { addSupportInternalNote } = await import("./supportOperations");
    const result = await addSupportInternalNote({ headers: {} } as any, { ticketId: "ticket-a", body: "Confirm payment before replying." });
    expect(result.note.kind).toBe("internal_note");
    const payload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(payload.kind).toBe("internal_note");
    expect(JSON.stringify(payload)).not.toContain("whatsapp");
  });

  it("creates a bounded support workflow only with the verified profile company and supported internal action", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([{ id: "workflow-a", company_id: "company-a", name: "Urgent triage", trigger_type: "support.ticket.created", enabled: true, steps: JSON.stringify([{ type: "add_internal_note", config: { body: "Triage within the support team." } }]) }]), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { saveSupportWorkflowPolicy } = await import("./supportOperations");
    const result = await saveSupportWorkflowPolicy({ headers: {} } as any, { name: "Urgent triage", trigger: "support.ticket.created", actions: [{ type: "add_internal_note", config: { body: "Triage within the support team." } }], enabled: true });
    expect(result.workflow.id).toBe("workflow-a");
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.company_id).toBe("company-a");
    expect(payload.steps).toContain("add_internal_note");
    expect(payload.steps).not.toContain("whatsapp");
  });

  it("rejects workflow and SLA configuration writes from a support agent", async () => {
    resolveVerifiedProfile.mockResolvedValue({ profile: { id: "profile-agent", company_id: "company-a", role: "Support Agent", full_name: "Neema" }, token: "session-agent" });
    const { saveSupportSlaPolicy, saveSupportWorkflowPolicy } = await import("./supportOperations");
    await expect(saveSupportWorkflowPolicy({ headers: {} } as any, { name: "Update triage", trigger: "support.ticket.updated", actions: [{ type: "set_ticket_priority", config: { priority: "High" } }], enabled: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(saveSupportSlaPolicy({ headers: {} } as any, { name: "High response", priority: "High", firstResponseMinutes: 60, resolutionMinutes: 480, warningMinutes: 60, isActive: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates an SLA policy from validated values and verified tenant ownership", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([{ id: "sla-a", company_id: "company-a", name: "Urgent commitment", priority: "Urgent", first_response_minutes: 15, resolution_minutes: 240, warning_minutes: 30, is_active: true }]), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { saveSupportSlaPolicy } = await import("./supportOperations");
    const result = await saveSupportSlaPolicy({ headers: {} } as any, { name: "Urgent commitment", priority: "Urgent", firstResponseMinutes: 15, resolutionMinutes: 240, warningMinutes: 30, isActive: true });
    expect(result.policy.id).toBe("sla-a");
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.company_id).toBe("company-a");
    expect(payload.is_active).toBe(true);
  });

  it("searches only tickets returned through the verified workspace session", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([
      { id: "ticket-a", company_id: "company-a", subject: "Invoice discrepancy", customer: "Kilimo Fresh", priority: "High", status: "Open" },
      { id: "ticket-b", company_id: "company-a", subject: "Stock question", customer: "Mtaa Store", priority: "Low", status: "Closed" },
    ]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { searchSupportTickets } = await import("./supportOperations");
    const result = await searchSupportTickets({ headers: {} } as any, "invoice");
    expect(result.query).toBe("invoice");
    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0].id).toBe("ticket-a");
    expect(fetchMock.mock.calls[0][0]).toContain("support_tickets?select=");
  });

  it("returns an AI review draft from bounded non-internal ticket context without sending or mutating a ticket", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "ticket-a", company_id: "company-a", subject: "Invoice discrepancy", customer: "Kilimo Fresh", category: "Billing", priority: "High" }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ sender_kind: "customer", body: "Please confirm why this invoice changed.", sent_at: "2026-08-17T01:00:00Z", is_internal: false }]), { status: 200 }));
    invokeLLM.mockResolvedValueOnce({ model: "gpt-5-mini", choices: [{ message: { content: JSON.stringify({ draft: "Thank you for raising this. We are reviewing the invoice details.", cautions: ["Confirm the invoice revision before sending."] }) } }] });
    vi.stubGlobal("fetch", fetchMock);
    const { draftSupportTicketReply } = await import("./supportOperations");
    const result = await draftSupportTicketReply({ headers: {} } as any, { ticketId: "ticket-a", tone: "professional" });
    expect(result.reviewOnly).toBe(true);
    expect(result.draft).toContain("reviewing the invoice");
    expect(result.cautions).toEqual(["Confirm the invoice revision before sending."]);
    expect(fetchMock.mock.calls[1][0]).toContain("is_internal=eq.false");
    expect(JSON.stringify(invokeLLM.mock.calls[0][0])).not.toContain("support_ticket_notes");
    expect(fetchMock.mock.calls).toHaveLength(2);
  });
});
