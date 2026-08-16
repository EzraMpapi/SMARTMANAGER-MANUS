import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./reportSchedules.ts", import.meta.url), "utf8");

describe("report scheduling Heartbeat authorization", () => {
  it("uses the verified requester session for create, update, and delete lifecycle calls", () => {
    expect(source).toContain("}, sessionToken);");
    expect(source).toContain("}, sessionToken);\n  }\n  await db.update");
    expect(source).toContain("deleteHeartbeatJob(row.scheduleCronTaskUid, sessionToken)");
    expect(source).not.toContain("deleteHeartbeatJob(row.scheduleCronTaskUid, \"\")");
  });
});
