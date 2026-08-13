import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const monitorSource = readFileSync(new URL("./schemaDriftMonitor.ts", import.meta.url), "utf8");
const handlerSource = readFileSync(new URL("./scheduledSchemaDriftMonitor.ts", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");

describe("daily schema-drift monitor contract", () => {
  it("uses a six-field daily UTC Heartbeat schedule and durable monitor identity", () => {
    expect(monitorSource).toContain('const DAILY_SCHEMA_DRIFT_CRON = "0 0 7 * * *"');
    expect(monitorSource).toContain('const MONITOR_KEY = "primary"');
    expect(monitorSource).toContain('path: "/api/scheduled/schemaDriftMonitor"');
    expect(monitorSource).toContain("createHeartbeatJob");
    expect(monitorSource).toContain("updateHeartbeatJob");
  });

  it("records every healthy, drift, or error result and alerts only on unhealthy outcomes", () => {
    expect(schemaSource).toContain('mysqlTable("schema_drift_monitors"');
    expect(schemaSource).toContain('mysqlTable("schema_drift_runs"');
    expect(monitorSource).toContain("status !== \"healthy\"");
    expect(monitorSource).toContain("notifyOwner");
    expect(monitorSource).toContain("notificationDelivered");
    expect(monitorSource).toContain("persistRun");
  });

  it("accepts only an authenticated cron callback and registers the required scheduled route", () => {
    expect(handlerSource).toContain("sdk.authenticateRequest");
    expect(handlerSource).toContain("!user.isCron || !user.taskUid");
    expect(handlerSource).toContain('error: "cron-only"');
    expect(routeSource).toContain('app.post("/api/scheduled/schemaDriftMonitor", scheduledSchemaDriftMonitorHandler)');
  });
});
