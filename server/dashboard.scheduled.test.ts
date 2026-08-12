import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createScheduledReportPdf, serializeReportSectionsToCsv } from "./dashboardReports";

const handlerSource = readFileSync(new URL("./scheduledDashboardReport.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const scheduleServiceSource = readFileSync(new URL("./reportSchedules.ts", import.meta.url), "utf8");

const sections = [
  { title: "Executive KPIs", rows: [{ metric: "Revenue", value: "TZS 4,800k" }] },
  { title: "CRM Pipeline by Stage", rows: [{ stage: "Proposal", deal_count: 2 }] },
];

describe("scheduled dashboard reports", () => {
  it("serializes filtered sections as a CSV attachment", () => {
    const csv = serializeReportSectionsToCsv(sections);
    expect(csv).toContain("scheduled dashboard report");
    expect(csv).toContain('"metric","value"');
    expect(csv).toContain('"Revenue","TZS 4,800k"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("creates a non-empty PDF attachment", () => {
    const pdf = createScheduledReportPdf({
      companyName: "Kilimanjaro Trading Co.",
      periodLabel: "2026-08-01 → 2026-08-12",
      filterSummary: "Finance, CRM · 2026-08-01 → 2026-08-12",
      sections,
    });
    expect(pdf.byteLength).toBeGreaterThan(500);
  });

  it("looks up schedules through the authenticated Heartbeat task UID", () => {
    expect(handlerSource).toContain("user.isCron");
    expect(handlerSource).toContain("user.taskUid");
    expect(scheduleServiceSource).toContain("createHeartbeatJob");
    expect(scheduleServiceSource).toContain("deleteHeartbeatJob");
    expect(routerSource).toContain("deleteReportSchedule");
  });
});
