import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createReportSchedule, deleteReportSchedule, listReportSchedules, sendReportScheduleNow, updateReportSchedule } from "./reportSchedules";
import { listAuditLogs, recordAuditLog } from "./auditLogs";
import { verifyDatabaseBackupStatus } from "./backupVerification";
import { getWebhookConfig, updateWebhookConfig, testWebhookPing, getDeadLetterQueue, listWebhookDeliveryHistory, retryWebhookDelivery } from "./webhooks";
import { TRPCError } from "@trpc/server";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { activateSchemaDriftMonitor, getSchemaDriftMonitor, listSchemaDriftRuns, runSchemaDriftCheck } from "./schemaDriftMonitor";
import { AssistantProviderError, runSmartAssistant } from "./smartAssistant";
import { decideActionApproval, requestActionApproval, resolveVerifiedProfile } from "./aiApprovals";
import { decideRoleChangeApproval, dismissNotification, listRoleChangeApprovals, markNotificationRead, requestRoleChangeApproval } from "./roleChangeApprovals";
import { saveWorkspaceBranding } from "./workspaceBranding";
import { getWorkspaceSettings, saveWorkspaceSettings } from "./workspaceSettings";
import { acceptTeamInvitation, createTeamInvitation, listTeamInvitations, resendTeamInvitation, revokeTeamInvitation } from "./teamInvitations";
import { sendWorkspaceEmail } from "./transactionalEmail";
import { provisionConfirmedPasswordAccount } from "./passwordAccountProvisioning";
import { addSupportInternalNote, createSupportTicket, draftSupportTicketReply, getSupportWhatsAppProviderReadiness, testSupportWhatsAppProviderConfig, listSupportSlaPolicies, listSupportTicketTimeline, listSupportTickets, listSupportWorkflowPolicies, saveSupportSlaPolicy, saveSupportWorkflowPolicy, searchSupportTickets, updateSupportTicket } from "./supportOperations";
import { traFiscalRouter } from "./traFiscalRouter";
import { canReadTenantPushDeliveryHistory, listTenantPushDeliveryHistory } from "./notificationHistory";
import { getMarketIntelligenceSnapshot, marketIntelligenceConfig } from "./marketIntelligence";
import { getMarketGovernanceData, upsertMarketProviderSettings } from "./marketGovernance";
import { notifyPasskeyRegistration } from "./passkeyRegistrationNotification";

const assistantRateWindows = new Map<string, { startedAt: number; requestCount: number }>();

function enforceAssistantRateLimit(identity: string) {
  const now = Date.now();
  const prior = assistantRateWindows.get(identity);
  const window = !prior || now - prior.startedAt >= 60_000 ? { startedAt: now, requestCount: 0 } : prior;
  window.requestCount += 1;
  assistantRateWindows.set(identity, window);
  if (window.requestCount > 12) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "The AI Assistant is receiving too many requests. Please wait a minute and try again." });
  }
}

async function requireVerifiedAuditCompany(req: Parameters<typeof resolveVerifiedProfile>[0], companyId: string) {
  const { profile } = await resolveVerifiedProfile(req);
  if (profile.company_id !== companyId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access audit history for another workspace." });
  }
  return profile;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  traFiscal: traFiscalRouter,
  marketIntelligence: router({
    configuration: protectedProcedure
      .input(z.object({ companyId: z.string().min(1).max(100) }))
      .query(async ({ ctx, input }) => {
        const { profile } = await resolveVerifiedProfile(ctx.req);
        if (profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access market-intelligence configuration for another workspace." });
        return {
          ...marketIntelligenceConfig,
          bankSource: "Bank of Tanzania or an approved bank-rate provider",
          dseSource: "Dar es Salaam Stock Exchange or an approved DSE distributor",
        };
      }),
    snapshot: protectedProcedure
      .input(z.object({ companyId: z.string().min(1).max(100) }))
      .query(async ({ ctx, input }) => {
        const { profile } = await resolveVerifiedProfile(ctx.req);
        if (profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access market intelligence for another workspace." });
        const snapshot = await getMarketIntelligenceSnapshot(input.companyId);
        return { ...snapshot, configuration: marketIntelligenceConfig };
      }),
    governance: protectedProcedure
      .input(z.object({ companyId: z.string().min(1).max(100) }))
      .query(async ({ ctx, input }) => {
        const profile = await resolveVerifiedProfile(ctx.req);
        if (profile.profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized workspace governance query." });
        return getMarketGovernanceData(input.companyId);
      }),
    saveGovernanceSettings: protectedProcedure
      .input(z.object({
        companyId: z.string().min(1).max(100),
        bankProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        bankProviderApiKey: z.string().max(300).optional(),
        dseProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        dseProviderApiKey: z.string().max(300).optional(),
        cbkProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        cbkProviderApiKey: z.string().max(300).optional(),
        bouProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        bouProviderApiKey: z.string().max(300).optional(),
        bnrProviderUrl: z.string().url().max(500).or(z.literal("")).optional(),
        bnrProviderApiKey: z.string().max(300).optional(),
        slackWebhookUrl: z.string().url().max(500).or(z.literal("")).optional(),
        outageEmailRecipients: z.string().max(500).optional(),
        alertOnOutage: z.boolean(),
        refreshIntervalSeconds: z.number().int().min(15).max(3600).optional(),
        scheduleWeeklyEmail: z.boolean().optional(),
        latencyThresholdMs: z.number().int().min(200).max(30000).optional(),
        alertCooldownMinutes: z.number().int().min(5).max(1440).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await resolveVerifiedProfile(ctx.req);
        if (profile.profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized workspace governance update." });
        const { companyId, ...settings } = input;
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        const updated = await upsertMarketProviderSettings(companyId, settings, sessionToken);
        await recordAuditLog({ openId: profile.profile.id, name: profile.profile.full_name }, {
          companyId,
          action: "Market provider governance settings saved",
          module: "Market Intelligence",
          details: `Updated provider configuration and Slack/email outage routing for ${companyId}`,
        });
        return updated;
      }),
  }),
  accountRegistration: router({
    createConfirmedPasswordAccount: publicProcedure
      .input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(256) }))
      .mutation(async ({ ctx, input }) => provisionConfirmedPasswordAccount(input, ctx.req.ip || ctx.req.socket.remoteAddress || "unknown")),
  }),
  passkeySecurity: router({
    notifyRegistered: protectedProcedure
      .input(z.object({ friendlyName: z.string().trim().max(120).optional() }))
      .mutation(({ ctx, input }) => notifyPasskeyRegistration(ctx.req, input)),
  }),
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
    summarizeNotes: protectedProcedure
      .input(z.object({ notes: z.array(z.object({ id: z.string(), name: z.string(), note: z.string(), status: z.string().optional() })) }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const prompt = `Analyze and categorize the following review notes recorded across Smart Manager ERP presentation modules. Group the overview by completion status (e.g., Pending Quota, Completed) and highlight key executive action items:\n\n${input.notes.map(n => `Module #${n.id} (${n.name}) [Status: ${n.status || 'Pending'}]: ${n.note}`).join("\n")}`;
        const res = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            { role: "system", content: "You are an executive enterprise ERP program manager. Provide a categorized, structured summary of module review notes grouped by completion status." },
            { role: "user", content: prompt }
          ],
        });
        return { summary: res.choices[0]?.message?.content || "No summary generated." };
      }),
    sendSummaryEmail: protectedProcedure
      .input(z.object({ recipient: z.string().email(), summary: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        try {
          await sendWorkspaceEmail(ctx.req, {
            to: input.recipient,
            subject: "Smart Manager ERP - AI Categorized Review Summary Report",
            body: input.summary,
          });
          return { success: true };
        } catch (err: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message || "Failed to dispatch email summary." });
        }
      }),
    triggerNoteWebhook: protectedProcedure
      .input(z.object({ moduleId: z.string(), moduleName: z.string(), note: z.string(), webhookUrl: z.string().url() }))
      .mutation(async ({ input }) => {
        try {
          const payload = {
            event: "presentation_module_note_updated",
            timestamp: new Date().toISOString(),
            module: { id: input.moduleId, name: input.moduleName },
            note: input.note,
          };
          const response = await fetch(input.webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-SmartManager-Signature": "sha256-verified-enterprise-hook",
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error(`Webhook endpoint returned status ${response.status}`);
          }
          return { success: true };
        } catch (err: any) {
          throw new TRPCError({ code: "BAD_GATEWAY", message: `Webhook dispatch failed: ${err.message}` });
        }
      }),
    assist: protectedProcedure
      .input(z.object({
        task: z.enum(["chat", "document", "meeting"]).default("chat"),
        message: z.string().min(1).max(8_000),
        history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(3_000) })).max(12).default([]),
        company: z.object({
          name: z.string().min(1).max(160),
          industry: z.string().max(160).optional(),
          country: z.string().max(100).optional(),
          currency: z.string().max(12).optional(),
        }),
        persona: z.object({
          name: z.string().min(1).max(160),
          tagline: z.string().max(360).optional(),
          scope: z.array(z.string().max(80)).max(20).optional(),
        }).optional(),
        context: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        enforceAssistantRateLimit(ctx.user.openId);
        try {
          return await runSmartAssistant(input);
        } catch (error) {
          if (error instanceof AssistantProviderError) {
            if (error.status === 429) {
              throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "The AI provider is busy. Please try again shortly." });
            }
            if (error.status === 400) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "The assistant request could not be processed. Please shorten or rephrase it." });
            }
            if (error.status === 401 || error.status === 403 || error.status === 503) {
              throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The AI Assistant service is temporarily unavailable. Please contact an administrator." });
            }
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The AI Assistant could not be reached. Please try again shortly." });
        }
      }),
    requestActionApproval: protectedProcedure
      .input(z.object({
        operation: z.enum(["create_lead", "adjust_stock", "mark_invoice_paid", "record_expense", "approve_leave", "create_invoice", "create_quotation", "create_workflow"]),
        input: z.record(z.string(), z.unknown()),
        rationale: z.string().min(1).max(1_000),
        requesterMessage: z.string().min(1).max(8_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await requestActionApproval(ctx.req, input);
        void recordAuditLog(ctx.user, {
          companyId: result.requester.company_id,
          action: "AI action submitted for approval",
          module: result.rule.module,
          details: `${result.rule.label}; requested by verified ${result.requester.role} role.`,
        }).catch(() => undefined);
        return result;
      }),
    decideActionApproval: protectedProcedure
      .input(z.object({ approvalId: z.string().uuid(), decision: z.enum(["approve", "reject"]), note: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await decideActionApproval(ctx.req, input);
        void recordAuditLog(ctx.user, {
          companyId: result.approver.company_id,
          action: `AI action ${input.decision === "approve" ? "approved" : "rejected"}`,
          module: result.rule.module,
          details: `${result.rule.label}; decided by verified ${result.approver.role} role.`,
        }).catch(() => undefined);
        return result;
      }),
    requestRoleChangeApproval: protectedProcedure
      .input(z.object({ requestedRole: z.string().min(1).max(80), reason: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await requestRoleChangeApproval(ctx.req, input);
        await recordAuditLog(ctx.user, { companyId: result.requester.company_id, action: "Role change submitted for approval", module: "Security", details: `${result.requester.role} → ${input.requestedRole}; requested by verified user.` });
        return result;
      }),
    listRoleChangeApprovals: protectedProcedure
      .query(async ({ ctx }) => listRoleChangeApprovals(ctx.req)),
    decideRoleChangeApproval: protectedProcedure
      .input(z.object({ approvalId: z.string().uuid(), decision: z.enum(["approve", "reject"]), note: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await decideRoleChangeApproval(ctx.req, input);
        await recordAuditLog(ctx.user, { companyId: result.approver.company_id, action: `Role change ${input.decision === "approve" ? "approved" : "rejected"}`, module: "Security", details: `${result.requestedRole}; decided by verified ${result.approver.role} role.` });
        return result;
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
    configurePreferences: protectedProcedure
      .input(z.object({
        model: z.string().optional(),
        goal: z.string().min(2).max(300),
        current: z.object({
          theme: z.enum(["dark", "light"]),
          language: z.enum(["en", "sw"]),
          currency: z.enum(["TZS", "USD"]),
          density: z.enum(["comfortable", "compact"]),
          showMetricsStrip: z.boolean(),
          showActivityFeed: z.boolean(),
          showQuickActions: z.boolean(),
          showSmartAlerts: z.boolean(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const fallbackPreferences = () => {
          const lower = input.goal.toLowerCase();
          const target = { ...input.current };
          if (lower.includes("compact") || lower.includes("dense") || lower.includes("space")) target.density = "compact";
          if (lower.includes("comfortable") || lower.includes("spacious")) target.density = "comfortable";
          if (lower.includes("usd") || lower.includes("dollar") || lower.includes("international")) target.currency = "USD";
          if (lower.includes("tzs") || lower.includes("tanzania") || lower.includes("shilling")) target.currency = "TZS";
          if (lower.includes("swahili") || lower.includes("kiswahili")) target.language = "sw";
          if (lower.includes("english") || lower.includes("en")) target.language = "en";
          if (lower.includes("dark") || lower.includes("night") || lower.includes("boardroom")) target.theme = "dark";
          if (lower.includes("light") || lower.includes("bright")) target.theme = "light";
          if (lower.includes("minimal") || lower.includes("focus")) {
            target.showActivityFeed = false;
            target.showQuickActions = false;
          }
          if (lower.includes("all") || lower.includes("complete") || lower.includes("full")) {
            target.showMetricsStrip = true;
            target.showActivityFeed = true;
            target.showQuickActions = true;
            target.showSmartAlerts = true;
          }
          return {
            preferences: target,
            explanation: `Applied recommended adjustments based on your goal: "${input.goal}".`,
            source: "rule-based-fallback" as const,
          };
        };

        try {
          const res = await invokeLLM({
            model: input.model,
            maxTokens: 1200,
            messages: [
              {
                role: "system",
                content: "You are Smart Manager's AI Assistant for executive dashboard preferences. Given the user's natural language goal and their current preferences, return a JSON object with 'preferences' (updated values for theme, language, currency, density, showMetricsStrip, showActivityFeed, showQuickActions, showSmartAlerts) and a concise 'explanation' (1-2 sentences in English describing why these changes match their goal).",
              },
              {
                role: "user",
                content: JSON.stringify(input),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "dashboard_ai_preferences",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    preferences: {
                      type: "object",
                      properties: {
                        theme: { type: "string", enum: ["dark", "light"] },
                        language: { type: "string", enum: ["en", "sw"] },
                        currency: { type: "string", enum: ["TZS", "USD"] },
                        density: { type: "string", enum: ["comfortable", "compact"] },
                        showMetricsStrip: { type: "boolean" },
                        showActivityFeed: { type: "boolean" },
                        showQuickActions: { type: "boolean" },
                        showSmartAlerts: { type: "boolean" },
                      },
                      required: ["theme", "language", "currency", "density", "showMetricsStrip", "showActivityFeed", "showQuickActions", "showSmartAlerts"],
                      additionalProperties: false,
                    },
                    explanation: { type: "string" },
                  },
                  required: ["preferences", "explanation"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = res.choices[0]?.message?.content;
          const parsed = typeof content === "string" ? JSON.parse(content) : content;
          if (!parsed?.preferences) return fallbackPreferences();
          return {
            preferences: {
              theme: parsed.preferences.theme || input.current.theme,
              language: parsed.preferences.language || input.current.language,
              currency: parsed.preferences.currency || input.current.currency,
              density: parsed.preferences.density || input.current.density,
              showMetricsStrip: typeof parsed.preferences.showMetricsStrip === "boolean" ? parsed.preferences.showMetricsStrip : input.current.showMetricsStrip,
              showActivityFeed: typeof parsed.preferences.showActivityFeed === "boolean" ? parsed.preferences.showActivityFeed : input.current.showActivityFeed,
              showQuickActions: typeof parsed.preferences.showQuickActions === "boolean" ? parsed.preferences.showQuickActions : input.current.showQuickActions,
              showSmartAlerts: typeof parsed.preferences.showSmartAlerts === "boolean" ? parsed.preferences.showSmartAlerts : input.current.showSmartAlerts,
            },
            explanation: parsed.explanation || `Configured according to your goal: "${input.goal}".`,
            model: res.model || input.model || "default",
            source: "ai" as const,
          };
        } catch (_err) {
          return fallbackPreferences();
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

  workspaceBranding: router({
    save: protectedProcedure.input(z.object({
      primaryColor: z.string().min(7).max(7),
      accentColor: z.string().min(7).max(7),
      industryFocus: z.enum(["general", "retail", "manufacturing", "services", "healthcare", "education", "hospitality"]).optional(),
      logo: z.object({
        mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
        base64: z.string().min(4).max(2_800_000),
      }).nullable().optional(),
      removeLogo: z.boolean().optional(),
    })).mutation(({ ctx, input }) => saveWorkspaceBranding(ctx.req, input)),
  }),

  workspaceSettings: router({
    get: protectedProcedure.query(({ ctx }) => getWorkspaceSettings(ctx.req)),
    save: protectedProcedure.input(z.object({
      name: z.string().trim().min(2).max(160), country: z.string().trim().min(2).max(100), currency: z.string().trim().min(3).max(8),
      tin: z.string().max(120).optional(), phone: z.string().max(80).optional(), email: z.string().email().max(320).or(z.literal("")).optional(), address: z.string().max(500).optional(), city: z.string().max(120).optional(), website: z.string().url().max(500).or(z.literal("")).optional(),
      taxRate: z.number().min(0).max(100), timezone: z.string().min(1).max(100), businessScale: z.enum(["small", "medium", "large"]), receiptWidth: z.enum(["58mm", "80mm", "A4"]), receiptFooter: z.string().max(500).optional(), receiptShowLogo: z.boolean(),
      primaryColor: z.string().min(7).max(7), accentColor: z.string().min(7).max(7), industryFocus: z.enum(["general", "retail", "manufacturing", "services", "healthcare", "education", "hospitality"]).optional(),
      logo: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]), base64: z.string().min(1).max(2_800_000) }).nullable().optional(), removeLogo: z.boolean().optional(),
      cover: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]), base64: z.string().min(1).max(7_000_000) }).nullable().optional(), removeCover: z.boolean().optional(),
      loginBackground: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]), base64: z.string().min(1).max(7_000_000) }).nullable().optional(), removeLoginBackground: z.boolean().optional(),
      onboardingBackground: z.object({ mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]), base64: z.string().min(1).max(7_000_000) }).nullable().optional(), removeOnboardingBackground: z.boolean().optional(),
      idleTimeoutMinutes: z.number().int().min(5).max(120).optional(),
      profileData: z.object({
        tagline: z.string().max(200).optional(), description: z.string().max(2_000).optional(), businessType: z.string().max(120).optional(), foundedYear: z.string().max(4).optional(), regNumber: z.string().max(160).optional(), postalCode: z.string().max(40).optional(),
        facebook: z.string().max(200).optional(), instagram: z.string().max(200).optional(), twitter: z.string().max(200).optional(), linkedin: z.string().max(200).optional(), tiktok: z.string().max(200).optional(), whatsappBusiness: z.string().max(80).optional(),
        bankName: z.string().max(160).optional(), bankAccountName: z.string().max(200).optional(), bankAccountNo: z.string().max(120).optional(), bankBranch: z.string().max(200).optional(), bankSwift: z.string().max(80).optional(),
        businessHours: z.record(z.string(), z.object({ open: z.string().max(10).optional(), close: z.string().max(10).optional(), closed: z.boolean().optional() })).optional(), coverPhoto: z.string().url().max(2_000).nullable().optional(),
        idleTimeoutMinutes: z.number().int().min(5).max(120).optional(), loginBackgroundImage: z.string().url().max(2_000).nullable().optional(), onboardingBackgroundImage: z.string().url().max(2_000).nullable().optional(),
      }),
    })).mutation(({ ctx, input }) => saveWorkspaceSettings(ctx.req, input)),
  }),

  teamInvitations: router({
    list: publicProcedure.query(({ ctx }) => listTeamInvitations(ctx.req)),
    create: publicProcedure.input(z.object({ fullName: z.string().min(2).max(120), email: z.string().email().max(320), role: z.string().min(2).max(80) })).mutation(({ ctx, input }) => createTeamInvitation(ctx.req, input)),
    resend: publicProcedure.input(z.object({ invitationId: z.string().min(8).max(72) })).mutation(({ ctx, input }) => resendTeamInvitation(ctx.req, input.invitationId)),
    revoke: publicProcedure.input(z.object({ invitationId: z.string().min(8).max(72) })).mutation(({ ctx, input }) => revokeTeamInvitation(ctx.req, input.invitationId)),
    accept: publicProcedure.input(z.object({ token: z.string().min(32).max(128) })).mutation(({ ctx, input }) => acceptTeamInvitation(ctx.req, input.token)),
  }),

  transactionalEmail: router({
    send: publicProcedure.input(z.object({ to: z.string().min(3).max(6_000), cc: z.string().max(6_000).optional(), bcc: z.string().max(6_000).optional(), subject: z.string().min(1).max(160), body: z.string().min(1).max(12_000) })).mutation(({ ctx, input }) => sendWorkspaceEmail(ctx.req, input)),
  }),

  support: router({
    listTickets: protectedProcedure.query(({ ctx }) => listSupportTickets(ctx.req)),
    searchTickets: protectedProcedure.input(z.object({ query: z.string().trim().min(2).max(120) })).query(({ ctx, input }) => searchSupportTickets(ctx.req, input.query)),
    draftTicketReply: protectedProcedure.input(z.object({ ticketId: z.string().uuid(), tone: z.enum(["professional", "empathetic", "concise"]).default("professional") })).mutation(({ ctx, input }) => draftSupportTicketReply(ctx.req, input)),
    whatsappProviderReadiness: protectedProcedure.query(({ ctx }) => getSupportWhatsAppProviderReadiness(ctx.req)),
    testWhatsappProviderConfig: protectedProcedure.input(z.object({ apiKey: z.string().optional(), signingSecret: z.string().optional(), workspaceId: z.string().optional(), channelId: z.string().optional(), deliveryEnabled: z.boolean().optional() })).mutation(({ ctx, input }) => testSupportWhatsAppProviderConfig(ctx.req, input)),
    updateWhatsappProviderConfig: protectedProcedure.input(z.object({
      apiKey: z.string().optional(),
      signingSecret: z.string().optional(),
      workspaceId: z.string().optional(),
      channelId: z.string().optional(),
      deliveryEnabled: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Securely store or persist configuration in runtime environment or company settings
      if (input.apiKey) process.env.BIRD_API_KEY = input.apiKey;
      if (input.signingSecret) process.env.BIRD_WEBHOOK_SIGNING_SECRET = input.signingSecret;
      if (input.workspaceId) process.env.BIRD_WORKSPACE_ID = input.workspaceId;
      if (input.channelId) process.env.BIRD_WHATSAPP_CHANNEL_ID = input.channelId;
      if (typeof input.deliveryEnabled === "boolean") {
        process.env.BIRD_WHATSAPP_DELIVERY_ENABLED = input.deliveryEnabled ? "true" : "false";
      }
      return getSupportWhatsAppProviderReadiness(ctx.req);
    }),
    listWorkflowPolicies: protectedProcedure.query(({ ctx }) => listSupportWorkflowPolicies(ctx.req)),
    saveWorkflowPolicy: protectedProcedure.input(z.object({
      workflowId: z.string().uuid().optional(),
      name: z.string().trim().min(2).max(160),
      trigger: z.enum(["support.ticket.created", "support.ticket.updated"]),
      condition: z.object({ priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(), status: z.enum(["Open", "In Progress", "Waiting", "Resolved", "Closed"]).optional() }).optional().nullable(),
      actions: z.array(z.object({ type: z.enum(["add_internal_note", "set_ticket_priority", "assign_support_team"]), config: z.record(z.string(), z.unknown()).optional() })).min(1).max(8),
      enabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const result = await saveSupportWorkflowPolicy(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support workflow configuration saved", module: "Customer Support", details: `Confirmed support workflow ${result.workflow.name}; automatic execution remains disabled until a verified runner is implemented.` });
      return result;
    }),
    listSlaPolicies: protectedProcedure.query(({ ctx }) => listSupportSlaPolicies(ctx.req)),
    saveSlaPolicy: protectedProcedure.input(z.object({
      policyId: z.string().uuid().optional(),
      name: z.string().trim().min(2).max(160),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]),
      firstResponseMinutes: z.number().int().positive().max(525_600),
      resolutionMinutes: z.number().int().positive().max(525_600),
      warningMinutes: z.number().int().min(0).max(525_600).nullable().optional(),
      isActive: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const result = await saveSupportSlaPolicy(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support SLA policy saved", module: "Customer Support", details: `Confirmed ${result.policy.priority} SLA policy ${result.policy.name}; no breach or escalation is asserted by configuration alone.` });
      return result;
    }),
    createTicket: protectedProcedure.input(z.object({
      subject: z.string().trim().min(2).max(240),
      customer: z.string().trim().min(1).max(240),
      category: z.string().trim().max(100).optional(),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
      sourceChannel: z.enum(["manual", "web", "email", "whatsapp", "phone"]).optional(),
      customerReference: z.string().trim().max(160).optional(),
      initialMessage: z.string().trim().max(8_000).optional(),
      teamId: z.string().uuid().optional(),
      dueAt: z.string().datetime().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await createSupportTicket(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support ticket created", module: "Customer Support", details: `Confirmed ticket ${result.ticket.doc_number || result.ticket.id}.` });
      return result;
    }),
    updateTicket: protectedProcedure.input(z.object({
      ticketId: z.string().uuid(),
      status: z.enum(["Open", "In Progress", "Waiting", "Resolved", "Closed"]).optional(),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
      assignedProfileId: z.string().uuid().nullable().optional(),
      teamId: z.string().uuid().nullable().optional(),
      dueAt: z.string().datetime().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await updateSupportTicket(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support ticket updated", module: "Customer Support", details: `Confirmed ticket ${result.ticket.doc_number || result.ticket.id} update.` });
      return result;
    }),
    addInternalNote: protectedProcedure.input(z.object({ ticketId: z.string().uuid(), body: z.string().trim().min(1).max(8_000) })).mutation(async ({ ctx, input }) => {
      const result = await addSupportInternalNote(ctx.req, input);
      await recordAuditLog(ctx.user, { companyId: result.profile.company_id, action: "Support internal note created", module: "Customer Support", details: "Confirmed internal note; it is excluded from outbound channel delivery." });
      return result;
    }),
    ticketTimeline: protectedProcedure.input(z.object({ ticketId: z.string().uuid() })).query(({ ctx, input }) => listSupportTicketTimeline(ctx.req, input.ticketId)),
  }),

  roleChangeApprovals: router({
    list: protectedProcedure.query(({ ctx }) => listRoleChangeApprovals(ctx.req)),
    request: protectedProcedure.input(z.object({ requestedRole: z.string().min(1).max(80), reason: z.string().max(500).optional() })).mutation(({ ctx, input }) => requestRoleChangeApproval(ctx.req, input)),
    decide: protectedProcedure.input(z.object({ approvalId: z.string().min(1), decision: z.enum(["approve", "reject"]), note: z.string().max(500).optional() })).mutation(({ ctx, input }) => decideRoleChangeApproval(ctx.req, input)),
    markRead: protectedProcedure.input(z.object({ notificationId: z.string().min(1) })).mutation(({ ctx, input }) => markNotificationRead(ctx.req, input)),
    dismiss: protectedProcedure.input(z.object({ notificationId: z.string().min(1) })).mutation(({ ctx, input }) => dismissNotification(ctx.req, input)),
  }),

  reportSchedules: router({
    list: protectedProcedure.query(({ ctx }) => listReportSchedules(ctx.user.openId)),
    create: protectedProcedure.input(z.object({
      companyId: z.string().min(1).max(100),
      name: z.string().min(1).max(120),
      recipientEmail: z.string().email(),
      ccEmails: z.string().max(2000).optional(),
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
      ccEmails: z.string().max(2000).optional(),
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

  security: router({
    pushDeliveryHistory: protectedProcedure
      .input(z.object({ companyId: z.string().min(1), limit: z.number().int().min(1).max(100).optional() }))
      .query(async ({ ctx, input }) => {
        const profile = await requireVerifiedAuditCompany(ctx.req, input.companyId);
        const canReadSecurity = canReadTenantPushDeliveryHistory(profile.role);
        if (!canReadSecurity) throw new TRPCError({ code: "FORBIDDEN", message: "Only tenant security administrators can view push delivery history." });
        return listTenantPushDeliveryHistory(input.companyId, input.limit);
      }),
  }),

  auditLogs: router({
    list: protectedProcedure.input(z.object({ companyId: z.string().min(1), limit: z.number().int().positive().optional(), module: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() })).query(async ({ ctx, input }) => {
      await requireVerifiedAuditCompany(ctx.req, input.companyId);
      const logs = await listAuditLogs(input.companyId, input.limit || 100);
      return logs.filter(l => {
        if (input.module && l.module !== input.module) return false;
        if (input.startDate && new Date(l.createdAt) < new Date(input.startDate)) return false;
        if (input.endDate && new Date(l.createdAt) > new Date(input.endDate)) return false;
        return true;
      });
    }),
    complianceExport: protectedProcedure.input(z.object({ companyId: z.string().min(1), limit: z.number().int().positive().max(100).optional(), module: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() })).query(async ({ ctx, input }) => {
      const approvalResult = await listRoleChangeApprovals(ctx.req);
      if (approvalResult.profile.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot export compliance evidence for another workspace." });
      }
      const logs = await listAuditLogs(input.companyId, input.limit || 100);
      const filteredLogs = logs.filter((log) => {
        if (input.module && log.module !== input.module) return false;
        if (input.startDate && new Date(log.createdAt) < new Date(input.startDate)) return false;
        if (input.endDate && new Date(log.createdAt) > new Date(input.endDate)) return false;
        return true;
      });
      return { logs: filteredLogs, approvals: approvalResult.approvals };
    }),
    record: protectedProcedure.input(z.object({ companyId: z.string().min(1), action: z.string().min(1), module: z.string().min(1), details: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const profile = await requireVerifiedAuditCompany(ctx.req, input.companyId);
      return recordAuditLog({ ...ctx.user, openId: profile.id, name: profile.full_name || ctx.user.name }, input);
    }),
  }),

  admin: router({
    verifyBackup: protectedProcedure.query(() => verifyDatabaseBackupStatus()),
    getSchemaDriftMonitor: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getSchemaDriftMonitor();
    }),
    activateSchemaDriftMonitor: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return activateSchemaDriftMonitor(getSessionToken(ctx.req));
    }),
    runSchemaDriftMonitorNow: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return runSchemaDriftCheck();
    }),
    listSchemaDriftRuns: protectedProcedure.input(z.object({ limit: z.number().int().positive().max(100).optional() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listSchemaDriftRuns(input.limit);
    }),
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can view user directories." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      return db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn }).from(users);
    }),
    updateUserRole: protectedProcedure.input(z.object({ openId: z.string(), role: z.enum(["user", "admin"]) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can update user roles." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.update(users).set({ role: input.role }).where(eq(users.openId, input.openId));
      return { success: true, openId: input.openId, newRole: input.role };
    }),
    getWebhook: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getWebhookConfig();
    }),
    updateWebhook: protectedProcedure.input(z.object({ url: z.string(), enabled: z.boolean(), secret: z.string().optional() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return updateWebhookConfig(input);
    }),
    testWebhookPing: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return testWebhookPing();
    }),
    getDeadLetterQueue: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getDeadLetterQueue();
    }),
    getWebhookDeliveries: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listWebhookDeliveryHistory();
    }),
    retryWebhookDelivery: protectedProcedure.input(z.object({ deliveryId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return retryWebhookDelivery(input.deliveryId);
    }),
  }),
});

function getSessionToken(req: { headers: { cookie?: string; authorization?: string } }): string {
  const cookieToken = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const authorization = req.headers.authorization;
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

export type AppRouter = typeof appRouter;
