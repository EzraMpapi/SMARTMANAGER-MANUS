import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveVerifiedProfile = vi.fn();
vi.mock("./aiApprovals", () => ({ resolveVerifiedProfile }));

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
});
