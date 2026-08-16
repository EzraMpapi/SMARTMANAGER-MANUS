import { describe, expect, it } from "vitest";
import { isTransactionalEmailDeliveryEnabled, TRANSACTIONAL_EMAIL_DISABLED_MESSAGE } from "./transactionalEmail";
import { readFileSync } from "node:fs";

const schedulesSource = readFileSync(new URL("./reportSchedules.ts", import.meta.url), "utf8");
const reportsSource = readFileSync(new URL("./dashboardReports.ts", import.meta.url), "utf8");

describe("scheduled report delivery availability", () => {
  it("does not permit creating a recurring email schedule while delivery is disabled", () => {
    expect(isTransactionalEmailDeliveryEnabled()).toBe(false);
    expect(TRANSACTIONAL_EMAIL_DISABLED_MESSAGE).toBe("Workspace email delivery is disabled. No email was sent.");
    expect(schedulesSource).toContain("assertTransactionalEmailDeliveryEnabled();");
  });

  it("acknowledges disabled recurring jobs without generating or marking a report as sent", () => {
    const executionBody = reportsSource.slice(reportsSource.indexOf("export async function runScheduledDashboardReport"));
    expect(executionBody).toContain('skipped: "delivery-disabled"');
    const deliveryCheck = executionBody.indexOf('skipped: "delivery-disabled"');
    const reportBuild = executionBody.indexOf("buildScheduledReportData");
    expect(deliveryCheck).toBeGreaterThan(-1);
    expect(deliveryCheck).toBeLessThan(reportBuild);
  });
});
