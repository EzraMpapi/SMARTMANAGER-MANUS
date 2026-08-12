import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn() } }));
vi.mock("./dashboardReports", () => ({ runScheduledDashboardReport: vi.fn() }));

import { scheduledDashboardReportHandler } from "./scheduledDashboardReport";
import { sdk } from "./_core/sdk";
import { runScheduledDashboardReport } from "./dashboardReports";

describe("/api/scheduled/dashboardReport handler", () => {
  it("dispatches by authenticated Heartbeat task UID and returns the report result", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ isCron: true, taskUid: "cron_test_task_123" } as any);
    vi.mocked(runScheduledDashboardReport).mockResolvedValue({ ok: true, scheduleId: 17, format: "csv" } as any);
    const response = { json: vi.fn(), status: vi.fn() } as any;
    response.status.mockReturnValue(response);

    await scheduledDashboardReportHandler({ originalUrl: "/api/scheduled/dashboardReport", headers: {} } as any, response);

    expect(runScheduledDashboardReport).toHaveBeenCalledWith("cron_test_task_123");
    expect(response.json).toHaveBeenCalledWith({ ok: true, scheduleId: 17, format: "csv" });
  });

  it("rejects non-cron callers", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ isCron: false } as any);
    const response = { json: vi.fn(), status: vi.fn() } as any;
    response.status.mockReturnValue(response);

    await scheduledDashboardReportHandler({ originalUrl: "/api/scheduled/dashboardReport", headers: {} } as any, response);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "cron-only" });
  });
});
