import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/heartbeat", () => ({
  createHeartbeatJob: vi.fn(),
  updateHeartbeatJob: vi.fn(),
  deleteHeartbeatJob: vi.fn(),
}));

import { getDb } from "./db";
import { createHeartbeatJob } from "./_core/heartbeat";
import { createReportSchedule } from "./reportSchedules";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("report schedule persistence service", () => {
  it("persists the real Heartbeat task UID using project-owner scheduling", async () => {
    const scheduleRow = {
      id: 77,
      ownerUserId: 1,
      ownerOpenId: "sup_user_1",
      companyId: "company-1",
      name: "Weekly report",
      recipientEmail: "reports@example.com",
      frequency: "weekly",
      format: "pdf",
      modules: { finance: true, sales: true, crm: true, inventory: true, operations: true },
      dateRange: { start: "2026-08-01", end: "2026-08-12" },
      scheduleCronTaskUid: "heartbeat-task-77",
      isActive: true,
      lastSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const where = vi.fn().mockResolvedValue(undefined);
    const db = {
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([{ insertId: 77 }]) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where })) })),
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([scheduleRow]) })) })) })),
    };
    vi.mocked(getDb).mockResolvedValue(db as any);
    vi.mocked(createHeartbeatJob).mockResolvedValue({ taskUid: "heartbeat-task-77", nextExecutionAt: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "company-1" }] }));

    const result = await createReportSchedule({ id: 1, openId: "sup_user_1" }, "supabase-access-token", {
      companyId: "company-1",
      name: "Weekly report",
      recipientEmail: "reports@example.com",
      frequency: "weekly",
      format: "pdf",
      modules: { finance: true, sales: true, crm: true, inventory: true, operations: true },
      dateRange: { start: "2026-08-01", end: "2026-08-12" },
    });

    expect(result).toMatchObject({ id: 77, scheduleCronTaskUid: "heartbeat-task-77" });
    expect(createHeartbeatJob).toHaveBeenCalledWith(expect.objectContaining({ path: "/api/scheduled/dashboardReport", payload: { scheduleId: 77 } }), "");
    expect(where).toHaveBeenCalled();
  });
});
