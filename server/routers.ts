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
  ai: router({
    listModels: protectedProcedure.query(async () => {
      try {
        const { listLLMModels } = await import("./_core/llm");
        const res = await listLLMModels();
        return res.data || [];
      } catch (err) {
        return [
          { id: "gpt-5-mini", name: "GPT-5 Mini (Fast & Efficient)" },
          { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6 (Balanced Reasoning)" },
          { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (Multimodal & Fast)" },
        ];
      }
    }),
    chat: protectedProcedure
      .input(z.object({
        model: z.string().optional(),
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const res = await invokeLLM({
          model: input.model,
          messages: input.messages,
        });
        return {
          content: res.choices[0]?.message?.content || "No response generated.",
          model: res.model || input.model || "default",
        };
      }),
    analyzeAnomalies: protectedProcedure
      .input(z.object({
        model: z.string().optional(),
        currency: z.string().default("TZS"),
        totals: z.object({
          revenue: z.number(),
          expenses: z.number(),
          outstanding: z.number(),
          inventoryValue: z.number(),
          lowStockCount: z.number().int(),
          inventoryCount: z.number().int(),
        }),
        inventory: z.array(z.object({
          sku: z.string(), name: z.string(), qty: z.number(), reorder: z.number(), unitCost: z.number(), category: z.string(),
        })).max(200),
        monthly: z.array(z.object({ month: z.string(), revenue: z.number(), expenses: z.number(), profit: z.number() })).max(24),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const fallback = () => {
          const findings: Array<{ severity: "high" | "medium" | "low"; area: "cash_flow" | "inventory"; title: string; detail: string; recommendation: string }> = [];
          if (input.totals.outstanding > input.totals.revenue * 0.35 && input.totals.revenue > 0) {
            findings.push({ severity: "high", area: "cash_flow", title: "Receivables concentration", detail: `${input.currency} ${Math.round(input.totals.outstanding).toLocaleString()} remains outstanding, above 35% of collected revenue.`, recommendation: "Review overdue invoices and prioritize collection follow-ups this week." });
          }
          if (input.totals.lowStockCount > 0) {
            findings.push({ severity: "medium", area: "inventory", title: "Replenishment pressure", detail: `${input.totals.lowStockCount} of ${input.totals.inventoryCount} tracked items are at or below reorder level.`, recommendation: "Review replenishment proposals and confirm supplier lead times before the next cycle." });
          }
          if (input.totals.expenses > input.totals.revenue && input.totals.revenue > 0) {
            findings.push({ severity: "high", area: "cash_flow", title: "Expense-to-revenue inversion", detail: `Recorded expenses exceed collected revenue in the supplied period.`, recommendation: "Investigate the largest expense categories and protect near-term cash commitments." });
          }
          return findings;
        };
        try {
          const res = await invokeLLM({
            model: input.model,
            maxTokens: 1800,
            messages: [
              { role: "system", content: "You are a cautious ERP risk analyst. Analyze only the supplied live tenant metrics. Never invent transactions, causes, or figures. Return at most five actionable findings. If evidence is insufficient, return an empty array." },
              { role: "user", content: JSON.stringify(input) },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "erp_anomaly_findings",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    findings: { type: "array", maxItems: 5, items: { type: "object", properties: { severity: { type: "string", enum: ["high", "medium", "low"] }, area: { type: "string", enum: ["cash_flow", "inventory"] }, title: { type: "string" }, detail: { type: "string" }, recommendation: { type: "string" } }, required: ["severity", "area", "title", "detail", "recommendation"], additionalProperties: false } },
                  },
                  required: ["findings"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = res.choices[0]?.message?.content;
          const parsed = typeof content === "string" ? JSON.parse(content) : content;
          return { findings: Array.isArray(parsed?.findings) ? parsed.findings : fallback(), model: res.model || input.model || "default", source: "ai" as const };
        } catch (_error) {
          return { findings: fallback(), model: input.model || "deterministic-fallback", source: "rule-based-fallback" as const };
        }
      }),
  }),
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
