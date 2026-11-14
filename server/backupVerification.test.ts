import { afterEach, describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb }));

import { verifyDatabaseBackupStatus } from "./backupVerification";
import { appRouter } from "./routers";

const baseContext = {
  req: { headers: {} },
  res: {},
  user: {
    id: 1,
    openId: "user-1",
    name: "Workspace User",
    email: "user@example.invalid",
    loginMethod: "supabase",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
} as any;

afterEach(() => {
  getDb.mockReset();
});

describe("backup verification truthfulness and authorization", () => {
  it("reports degraded connectivity without asserting managed backup settings", async () => {
    getDb.mockResolvedValue(null);

    const result = await verifyDatabaseBackupStatus();

    expect(result.status).toBe("degraded");
    expect(result.message).toMatch(/not verified/i);
    expect(result).not.toHaveProperty("pitrEnabled");
    expect(result).not.toHaveProperty("dailySnapshotAvailable");
  });

  it("reports database reachability separately from unverified managed backup configuration", async () => {
    getDb.mockResolvedValue({
      execute: vi.fn().mockResolvedValue([{ current_time: "2026-08-23T10:00:00.000Z" }]),
    });

    const result = await verifyDatabaseBackupStatus();

    expect(result.status).toBe("database_reachable");
    expect(result.backupConfiguration).toBe("unverified");
    expect(result.message).toMatch(/require verification in the Supabase project dashboard/i);
    expect(result).not.toHaveProperty("pitrEnabled");
    expect(result).not.toHaveProperty("dailySnapshotAvailable");
  });

  it("rejects the admin backup endpoint for a non-administrator session", async () => {
    const caller = appRouter.createCaller(baseContext);

    await expect(caller.admin.verifyBackup()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getDb).not.toHaveBeenCalled();
  });
});
