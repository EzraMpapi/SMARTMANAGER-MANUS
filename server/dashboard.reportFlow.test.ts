import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

vi.mock("./reportSchedules", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./reportSchedules")>();
  return {
    ...actual,
    listReportSchedules: vi.fn(),
    createReportSchedule: vi.fn(),
    updateReportSchedule: vi.fn(),
    deleteReportSchedule: vi.fn(),
    sendReportScheduleNow: vi.fn(),
  };
});

import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { assertSupabaseCompanyAccess, createReportSchedule, deleteReportSchedule, listReportSchedules, sendReportScheduleNow, updateReportSchedule } from "./reportSchedules";

describe("Dashboard report schedules and Supabase-authenticated flow", () => {
  const schedule = {
    id: 17,
    companyId: "company-1",
    name: "Weekly executive report",
    recipientEmail: "reports@example.com",
    frequency: "weekly" as const,
    format: "pdf" as const,
    modules: { finance: true, sales: true, crm: true, inventory: false, operations: true },
    dateRange: { start: "2026-08-01", end: "2026-08-12" },
    scheduleCronTaskUid: "cron_test_task_123",
    isActive: true,
    lastSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("bridges a validated Supabase bearer token into protected tRPC context", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "supabase-user-1", email: "test@example.com", user_metadata: { full_name: "Test User" }, app_metadata: { provider: "email" } }) }));
    const context = await createContext({ req: { headers: { authorization: "Bearer mock-supabase-access-token" } } as any, res: {} as any });
    expect(context.user?.loginMethod).toBe("email");
    expect(context.user?.openId).toBe("sup_supabase-user-1");
  });

  it("enforces the requested company through Supabase RLS before schedule persistence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "company-1" }] }));
    await expect(assertSupabaseCompanyAccess("company-1", "mock-supabase-access-token")).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/rest/v1/companies?"), expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer mock-supabase-access-token" }) }));
  });

  it("exercises schedule create, list, pause/resume, sendNow, and delete through the protected router", async () => {
    vi.mocked(createReportSchedule).mockResolvedValue(schedule as any);
    vi.mocked(listReportSchedules).mockResolvedValue([schedule] as any);
    vi.mocked(deleteReportSchedule).mockResolvedValue({ success: true });
    vi.mocked(updateReportSchedule).mockResolvedValue({ ...schedule, isActive: false } as any);
    vi.mocked(sendReportScheduleNow).mockResolvedValue({ ok: true, scheduleId: 17, format: "pdf" } as any);
    const caller = appRouter.createCaller({
      req: { headers: { authorization: "Bearer mock-supabase-access-token" } } as any,
      res: {} as any,
      user: { id: 1, openId: "sup_mock-supabase-access-token", name: "Test User", email: "test@example.com", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any,
    });
    const input = {
      companyId: "company-1",
      name: "Weekly executive report",
      recipientEmail: "reports@example.com",
      frequency: "weekly" as const,
      format: "pdf" as const,
      modules: schedule.modules,
      dateRange: schedule.dateRange,
    };

    const created = await caller.reportSchedules.create(input);
    const listed = await caller.reportSchedules.list();
    const toggled = await caller.reportSchedules.toggleActive({ id: 17, isActive: false });
    const sentNow = await caller.reportSchedules.sendNow({ id: 17 });
    const removed = await caller.reportSchedules.remove({ id: 17 });

    expect(created).toMatchObject({ id: 17, format: "pdf" });
    expect(listed).toHaveLength(1);
    expect(toggled).toMatchObject({ isActive: false });
    expect(sentNow).toMatchObject({ ok: true, scheduleId: 17 });
    expect(removed).toEqual({ success: true });
    expect(createReportSchedule).toHaveBeenCalledWith(expect.objectContaining({ openId: "sup_mock-supabase-access-token" }), "mock-supabase-access-token", input);
    expect(updateReportSchedule).toHaveBeenCalledWith("sup_mock-supabase-access-token", "mock-supabase-access-token", 17, { isActive: false });
    expect(sendReportScheduleNow).toHaveBeenCalledWith("sup_mock-supabase-access-token", 17);
    expect(deleteReportSchedule).toHaveBeenCalledWith("sup_mock-supabase-access-token", "mock-supabase-access-token", 17);
  });
});
