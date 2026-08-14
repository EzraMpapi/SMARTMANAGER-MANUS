import { afterEach, describe, expect, it, vi } from "vitest";
import { decideActionApproval, requestActionApproval } from "./aiApprovals";

const originalFetch = global.fetch;
const request = (token = "session-token") => ({ headers: { "x-supabase-authorization": `Bearer ${token}` } }) as any;

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => { global.fetch = originalFetch; });

describe("AI action approval authorization", () => {
  it("creates a pending tenant-scoped review request without trusting a role supplied by the browser", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ id: "user-1" }))
      .mockResolvedValueOnce(json([{ id: "user-1", company_id: "company-1", role: "Sales Manager", full_name: "Sales Lead" }]))
      .mockResolvedValueOnce(json([{ id: "approval-1", status: "Pending Review", data: {} }]));
    global.fetch = fetchMock as any;

    const result = await requestActionApproval(request(), {
      operation: "create_lead",
      input: { company_name: "Mwanza Foods", contact_name: "Asha" },
      rationale: "The user supplied a new prospect.",
      requesterMessage: "Please add this prospect.",
    });

    expect(result.approval?.id).toBe("approval-1");
    expect(result.rule.roles).toContain("Sales Manager");
    const insert = JSON.parse(fetchMock.mock.calls[2]?.[1]?.body);
    expect(insert.status).toBe("Pending Review");
    expect(insert.data.requestedBy.role).toBe("Sales Manager");
    expect(insert.data.requiredRoles).toContain("Sales Manager");
  });

  it("rejects a decision from a verified role that is not authorized for the proposed operation", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ id: "user-2" }))
      .mockResolvedValueOnce(json([{ id: "user-2", company_id: "company-1", role: "Employee", full_name: "Staff User" }]))
      .mockResolvedValueOnce(json([{ id: "approval-2", status: "Pending Review", data: { kind: "ai_action_approval", operation: "adjust_stock", expiresAt: new Date(Date.now() + 60_000).toISOString() } }]));
    global.fetch = fetchMock as any;

    await expect(decideActionApproval(request(), { approvalId: "approval-2", decision: "approve" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
