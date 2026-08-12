import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./dashboardReports", () => ({ runScheduledDashboardReport: vi.fn() }));

import { getDb } from "./db";
import { runScheduledDashboardReport } from "./dashboardReports";
import { sendReportScheduleNow } from "./reportSchedules";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendReportScheduleNow service", () => {
  it("verifies schedule ownership and immediately dispatches the report", async () => {
    const scheduleRow = {
      id: 99,
      ownerOpenId: "sup_user_1",
      scheduleCronTaskUid: "task-uid-99",
    };
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([scheduleRow]) })) })) })),
    };
    vi.mocked(getDb).mockResolvedValue(db as any);
    vi.mocked(runScheduledDashboardReport).mockResolvedValue({ ok: true, scheduleId: 99 } as any);

    const result = await sendReportScheduleNow("sup_user_1", 99);
    expect(result).toEqual({ ok: true, scheduleId: 99 });
    expect(runScheduledDashboardReport).toHaveBeenCalledWith("task-uid-99");
  });
});
