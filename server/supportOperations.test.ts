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
});
