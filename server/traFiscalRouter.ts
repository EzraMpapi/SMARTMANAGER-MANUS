import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { fiscalProfiles, fiscalReceipts, fiscalRetryQueue, zReports, taxConfigurations, getFiscalProvider, FiscalSubmissionPayload } from "./traFiscal";
import { recordAuditLog } from "./auditLogs";
import { resolveVerifiedProfile } from "./aiApprovals";
import { evaluateVatAnomaly, getVatAnomalySettings, listVatAnomalyEvents, saveVatAnomalySettings } from "./traVatAnomaly";

function getSessionToken(req: { headers: { cookie?: string; authorization?: string } }) {
  const cookieToken = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const authorization = req.headers.authorization;
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

export const traFiscalRouter = router({
  getProfile: protectedProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection unavailable." });
      const rows = await db.select().from(fiscalProfiles).where(eq(fiscalProfiles.companyId, input.companyId)).limit(1);
      return rows[0] || null;
    }),

  saveProfile: protectedProcedure
    .input(z.object({
      companyId: z.string().min(1),
      branchId: z.string().min(1).default("MAIN"),
      tin: z.string().min(5).max(32),
      vrn: z.string().max(32).optional(),
      businessName: z.string().min(1).max(200),
      tradingName: z.string().max(200).optional(),
      physicalAddress: z.string().optional(),
      postalAddress: z.string().optional(),
      region: z.string().max(100).optional(),
      district: z.string().max(100).optional(),
      phone: z.string().max(50).optional(),
      email: z.string().email().max(320).optional(),
      businessActivity: z.string().max(200).optional(),
      deviceSerial: z.string().max(100).optional(),
      environment: z.enum(["sandbox", "production"]).default("sandbox"),
      fiscalStatus: z.enum(["active", "suspended", "misconfigured", "offline"]).default("active"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      }
      const allowedRoles = ["admin", "owner", "manager", "Organization Owner", "CEO", "Super Administrator", "Finance Manager", "CFO"];
      if (!allowedRoles.some(r => profile.role.toLowerCase().includes(r.toLowerCase()))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to configure TRA VFD profile." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection unavailable." });
      const existing = await db.select().from(fiscalProfiles).where(eq(fiscalProfiles.companyId, input.companyId)).limit(1);

      if (existing.length > 0) {
        await db.update(fiscalProfiles)
          .set({
            branchId: input.branchId,
            tin: input.tin,
            vrn: input.vrn || null,
            businessName: input.businessName,
            tradingName: input.tradingName || null,
            physicalAddress: input.physicalAddress || null,
            postalAddress: input.postalAddress || null,
            region: input.region || null,
            district: input.district || null,
            phone: input.phone || null,
            email: input.email || null,
            businessActivity: input.businessActivity || null,
            deviceSerial: input.deviceSerial || null,
            environment: input.environment,
            fiscalStatus: input.fiscalStatus,
            updatedAt: new Date(),
          })
          .where(eq(fiscalProfiles.companyId, input.companyId));
      } else {
        await db.insert(fiscalProfiles).values({
          companyId: input.companyId,
          branchId: input.branchId,
          tin: input.tin,
          vrn: input.vrn || null,
          businessName: input.businessName,
          tradingName: input.tradingName || null,
          physicalAddress: input.physicalAddress || null,
          postalAddress: input.postalAddress || null,
          region: input.region || null,
          district: input.district || null,
          phone: input.phone || null,
          email: input.email || null,
          businessActivity: input.businessActivity || null,
          deviceSerial: input.deviceSerial || null,
          environment: input.environment,
          fiscalStatus: input.fiscalStatus,
        });
      }

      await recordAuditLog(ctx.user, {
        companyId: input.companyId,
        action: "SAVE_TRA_PROFILE",
        module: "TRA_PORTAL",
        details: `Saved TRA VFD Profile for TIN ${input.tin} (${input.businessName})`,
      });

      return { success: true };
    }),

  listReceipts: protectedProcedure
    .input(z.object({
      companyId: z.string().min(1),
      status: z.string().optional(),
      sourceType: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection unavailable." });
      const rows = await db.select().from(fiscalReceipts)
        .where(eq(fiscalReceipts.companyId, input.companyId))
        .orderBy(desc(fiscalReceipts.createdAt))
        .limit(input.limit);
      return rows;
    }),

  submitTransaction: protectedProcedure
    .input(z.object({
      companyId: z.string().min(1),
      branchId: z.string().default("MAIN"),
      sourceType: z.enum(["invoice", "pos", "sales", "ecommerce", "service"]),
      sourceId: z.string().min(1),
      idempotencyKey: z.string().min(1),
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxCode: z.string(),
      })),
      grossAmount: z.number(),
      vatAmount: z.number(),
      netAmount: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection unavailable." });

      const existing = await db.select().from(fiscalReceipts).where(eq(fiscalReceipts.idempotencyKey, input.idempotencyKey)).limit(1);
      if (existing.length > 0) {
        return { success: true, receipt: existing[0], duplicate: true };
      }

      const profRows = await db.select().from(fiscalProfiles).where(eq(fiscalProfiles.companyId, input.companyId)).limit(1);
      if (profRows.length === 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TRA VFD Profile not configured for this company. Please complete TRA configuration first." });
      }
      const profileRec = profRows[0];

      const provider = getFiscalProvider(profileRec.environment);
      const submissionPayload: FiscalSubmissionPayload = {
        companyId: input.companyId,
        branchId: input.branchId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        items: input.items,
        grossAmount: input.grossAmount,
        vatAmount: input.vatAmount,
        netAmount: input.netAmount,
        tin: profileRec.tin,
        vrn: profileRec.vrn || undefined,
      };

      const result = await provider.submitReceipt(submissionPayload);

      const inserted = await db.insert(fiscalReceipts).values({
        companyId: input.companyId,
        branchId: input.branchId,
        fiscalProfileId: profileRec.id,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        status: result.success ? "VERIFIED" : "FAILED",
        receiptNumber: result.receiptNumber,
        fiscalSerial: result.fiscalSerial || null,
        verificationNumber: result.verificationNumber || null,
        submissionTimestamp: new Date(),
        traResponse: result.rawResponse,
        responseCode: result.responseCode,
        responseMessage: result.responseMessage,
        qrInformation: result.qrInformation,
        grossAmount: input.grossAmount.toFixed(2),
        vatAmount: input.vatAmount.toFixed(2),
        netAmount: input.netAmount.toFixed(2),
        createdByOpenId: profile.id || "system",
      });

      const newReceiptId = Number(inserted[0].insertId);
      const [newReceipt] = await db.select().from(fiscalReceipts).where(eq(fiscalReceipts.id, newReceiptId)).limit(1);

      await recordAuditLog(ctx.user, {
        companyId: input.companyId,
        action: "SUBMIT_TRA_RECEIPT",
        module: "TRA_PORTAL",
        details: `Fiscalized ${input.sourceType} #${input.sourceId} -> Receipt ${result.receiptNumber} (${result.responseCode})`,
      });

      return { success: result.success, receipt: newReceipt };
    }),

  getConnectionStatus: protectedProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection unavailable." });
      const profRows = await db.select().from(fiscalProfiles).where(eq(fiscalProfiles.companyId, input.companyId)).limit(1);
      const env = profRows[0]?.environment || "sandbox";
      const provider = getFiscalProvider(env);
      const conn = await provider.checkConnection();

      const stats = await db.select({
        total: sql<number>`count(*)`,
        verified: sql<number>`sum(case when status='VERIFIED' then 1 else 0 end)`,
        failed: sql<number>`sum(case when status='FAILED' then 1 else 0 end)`,
        pending: sql<number>`sum(case when status='PENDING' then 1 else 0 end)`,
      }).from(fiscalReceipts).where(eq(fiscalReceipts.companyId, input.companyId));

      return {
        connection: conn,
        stats: stats[0] || { total: 0, verified: 0, failed: 0, pending: 0 },
      };
    }),

  getVatAnomalySettings: protectedProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      return getVatAnomalySettings(input.companyId);
    }),

  saveVatAnomalySettings: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), enabled: z.boolean(), thresholdPercent: z.number().int().min(5).max(500), cooldownMinutes: z.number().int().min(15).max(10080) }))
    .mutation(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      const allowedRoles = ["admin", "owner", "manager", "Organization Owner", "CEO", "Super Administrator", "System Administrator", "Finance Manager", "CFO"];
      if (!allowedRoles.some((role) => profile.role.toLowerCase().includes(role.toLowerCase()))) throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to configure VAT anomaly alerts." });
      const settings = await saveVatAnomalySettings(ctx.user, getSessionToken(ctx.req), input);
      await recordAuditLog(ctx.user, { companyId: input.companyId, action: "SAVE_TRA_VAT_ANOMALY_SETTINGS", module: "TRA_PORTAL", details: `VAT anomaly alerts ${input.enabled ? "enabled" : "disabled"}; threshold ${input.thresholdPercent}%; cooldown ${input.cooldownMinutes} minutes.` });
      return settings;
    }),

  listVatAnomalyEvents: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), limit: z.number().int().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      return listVatAnomalyEvents(input.companyId, input.limit);
    }),

  evaluateVatAnomaly: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), period: z.string().regex(/^\\d{4}-\\d{2}$/).optional(), branchId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      if (profile.company_id !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
      const settings = await getVatAnomalySettings(input.companyId);
      return evaluateVatAnomaly(input.companyId, settings, input.period, input.branchId);
    }),
});
