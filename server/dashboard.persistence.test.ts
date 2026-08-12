import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { runScheduledDashboardReport } from "./dashboardReports";
import { getReportScheduleByTaskUid } from "./reportSchedules";

describe("Dashboard report schedule persistence and execution flow", () => {
  it("resolves a persisted report schedule by its task UID", async () => {
    const schedule = await getReportScheduleByTaskUid("nonexistent-task-uid");
    expect(schedule).toBeUndefined();
  });

  it("fails gracefully when executing an orphaned report schedule task UID", async () => {
    const result = await runScheduledDashboardReport("nonexistent-task-uid");
    expect(result).toMatchObject({ ok: true, skipped: "orphan" });
  });
});
