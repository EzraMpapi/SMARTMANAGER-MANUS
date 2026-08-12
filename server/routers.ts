import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createReportSchedule, deleteReportSchedule, listReportSchedules, sendReportScheduleNow, updateReportSchedule } from "./reportSchedules";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  reportSchedules: router({
    list: protectedProcedure.query(({ ctx }) => listReportSchedules(ctx.user.openId)),
    create: protectedProcedure.input(z.object({
      companyId: z.string().min(1).max(100),
      name: z.string().min(1).max(120),
      recipientEmail: z.string().email(),
      frequency: z.enum(["daily", "weekly", "monthly"]),
      format: z.enum(["csv", "pdf"]),
      modules: z.object({ finance: z.boolean(), sales: z.boolean(), crm: z.boolean(), inventory: z.boolean(), operations: z.boolean() }),
      dateRange: z.object({ start: z.string(), end: z.string() }),
    })).mutation(({ ctx, input }) => createReportSchedule(ctx.user, getSessionToken(ctx.req), input)),
    update: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      companyId: z.string().min(1).max(100).optional(),
      name: z.string().min(1).max(120).optional(),
      recipientEmail: z.string().email().optional(),
      frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
      format: z.enum(["csv", "pdf"]).optional(),
      modules: z.object({ finance: z.boolean(), sales: z.boolean(), crm: z.boolean(), inventory: z.boolean(), operations: z.boolean() }).optional(),
      dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
      isActive: z.boolean().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return updateReportSchedule(ctx.user.openId, getSessionToken(ctx.req), id, patch);
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteReportSchedule(ctx.user.openId, getSessionToken(ctx.req), input.id)),
    toggleActive: protectedProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(({ ctx, input }) => updateReportSchedule(ctx.user.openId, getSessionToken(ctx.req), input.id, { isActive: input.isActive })),
    sendNow: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => sendReportScheduleNow(ctx.user.openId, input.id)),
  }),
});

function getSessionToken(req: { headers: { cookie?: string; authorization?: string } }): string {
  const cookieToken = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const authorization = req.headers.authorization;
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

export type AppRouter = typeof appRouter;
