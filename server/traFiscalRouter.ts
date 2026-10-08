import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { resolveVerifiedProfile } from "./aiApprovals";
import {
  callRestaurantTanzaniaRpc,
  getNativeAnomalySettings,
  getNativeFiscalProfile,
  getNativeSnapshot,
  listNativeReceipts,
  mapNativeFiscalReceipt,
  nativeAuxiliaryRows,
  nativeOfficialLinks,
  nativeReceiptStats,
  nativeReadiness,
  nativeVatTrend,
  mutateRows,
  queueNativeReceipt,
  resolveRestaurantOutletId,
  saveNativeAnomalySettings,
  saveNativeFiscalProfile,
  selectRows,
} from "./traFiscalSupabase";

const ADMIN_ROLES = ["admin", "owner", "manager", "organization owner", "ceo", "super administrator", "system administrator", "finance manager", "cfo"];

function getSessionToken(req: { headers: { cookie?: string; authorization?: string } }) {
  const cookieToken = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const authorization = req.headers.authorization;
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function requireCompany(profile: { company_id?: string | null }, companyId: string) {
  if (!profile.company_id || profile.company_id !== companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Company isolation violation." });
}

function canAdmin(role: string) {
  const normalized = role.toLowerCase();
  return ADMIN_ROLES.some((allowed) => normalized.includes(allowed));
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function nativeAudit(companyId: string, action: string, detail: Record<string, unknown> = {}) {
  try {
    const outletId = await resolveRestaurantOutletId(companyId).catch(() => null);
    await mutateRows("restaurant_audit_events", "POST", {}, {
      company_id: companyId,
      outlet_id: outletId,
      actor_id: null,
      action,
      subject_type: "TRA_PORTAL",
      subject_id: null,
      detail,
    });
  } catch {
    // The native RPC already audits profile and receipt actions. Auxiliary audit writes must not hide a successful operation.
  }
}

export const traFiscalRouter = router({
  getProfile: protectedProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      return getNativeFiscalProfile(getSessionToken(ctx.req));
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
      fiscalStatus: z.enum(["active", "suspended", "misconfigured", "offline"]).default("misconfigured"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      if (!canAdmin(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to configure TRA VFD profile." });
      await saveNativeFiscalProfile({ ...input, accessToken: getSessionToken(ctx.req) });
      const saved = await getNativeFiscalProfile(getSessionToken(ctx.req));
      await nativeAudit(input.companyId, "SAVE_TRA_PROFILE", { tin: input.tin, businessName: input.businessName, environment: input.environment });
      return { success: true as const, profile: saved };
    }),

  listReceipts: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), status: z.string().optional(), sourceType: z.string().optional(), limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      const receipts = await listNativeReceipts(input.companyId, input.limit);
      return receipts.filter((receipt) => {
        const statusMatch = !input.status || receipt.status.toLowerCase() === input.status.toLowerCase();
        const sourceMatch = !input.sourceType || receipt.sourceType === input.sourceType;
        return statusMatch && sourceMatch;
      });
    }),

  submitTransaction: protectedProcedure
    .input(z.object({
      companyId: z.string().min(1),
      branchId: z.string().default("MAIN"),
      sourceType: z.literal("restaurant_order"),
      sourceId: z.string().uuid(),
      idempotencyKey: z.string().min(1).max(200),
      items: z.array(z.object({ name: z.string().min(1), quantity: z.number().positive(), unitPrice: z.number().nonnegative(), taxCode: z.string().min(1) })).max(200),
      grossAmount: z.number().positive(),
      vatAmount: z.number().nonnegative(),
      netAmount: z.number().nonnegative(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      const accessToken = getSessionToken(ctx.req);
      const fiscalProfile = await getNativeFiscalProfile(accessToken);
      if (!fiscalProfile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TRA VFD Profile not configured for this company. Please complete TRA configuration first." });
      const queued = await queueNativeReceipt({
        outletId: fiscalProfile.outletId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        items: input.items,
        grossAmount: input.grossAmount,
        vatAmount: input.vatAmount,
        netAmount: input.netAmount,
        currency: "TZS",
        accessToken,
      });
      const recordId = queued && typeof queued === "object" && "recordId" in queued ? String((queued as { recordId: unknown }).recordId) : "";
      const receiptRows = await listNativeReceipts(input.companyId, 100);
      const receipt = receiptRows.find((row) => row.id === recordId) || null;
      await nativeAudit(input.companyId, "QUEUE_TRA_RECEIPT", { sourceType: input.sourceType, sourceId: input.sourceId, recordId, idempotencyKey: input.idempotencyKey });
      return { success: true as const, queued: true as const, duplicate: Boolean(queued && typeof queued === "object" && "duplicate" in queued && (queued as { duplicate?: unknown }).duplicate), receipt };
    }),

  getConnectionStatus: protectedProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      const accessToken = getSessionToken(ctx.req);
      const fiscalProfile = await getNativeFiscalProfile(accessToken);
      const environment = fiscalProfile?.environment === "production" ? "production" : "sandbox";
      const readiness = nativeReadiness(environment, Boolean(fiscalProfile));
      return {
        connection: { connected: readiness.canSubmit, status: readiness.status, message: readiness.reason },
        readiness,
        officialLinks: nativeOfficialLinks(),
        profileConfigured: Boolean(fiscalProfile),
        stats: await nativeReceiptStats(input.companyId),
      };
    }),

  listDocumentEvidence: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), limit: z.number().int().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      if (!canAdmin(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only authorized tenant administrators can view TRA evidence documents." });
      const limit = input.limit || 50;
      const [archives, auditRows] = await Promise.all([
        nativeAuxiliaryRows("tra_z_report_archives", input.companyId, limit),
        selectRows("restaurant_audit_events", { select: "id,company_id,outlet_id,actor_id,action,subject_type,subject_id,detail,created_at", company_id: `eq.${input.companyId}`, order: "created_at.desc", limit: String(limit) }),
      ]);
      return { archives, audit: auditRows.filter((log) => String(log.action || "").toLowerCase().includes("tra") || String(log.subject_type || "").toLowerCase().includes("fiscal")) };
    }),

  getOperationsSummary: protectedProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      const accessToken = getSessionToken(ctx.req);
      const fiscalProfile = await getNativeFiscalProfile(accessToken);
      const environment = fiscalProfile?.environment === "production" ? "production" : "sandbox";
      const readiness = nativeReadiness(environment, Boolean(fiscalProfile));
      const snapshot = await getNativeSnapshot(accessToken);
      const receipts = await listNativeReceipts(input.companyId, 100);
      const [archives, anomalySettings, anomalyEvents] = await Promise.all([
        nativeAuxiliaryRows("tra_z_report_archives", input.companyId, 100),
        getNativeAnomalySettings(input.companyId),
        nativeAuxiliaryRows("tra_vat_anomaly_events", input.companyId, 10),
      ]);
      const taxProfiles = Array.isArray(snapshot.taxProfiles) ? snapshot.taxProfiles : [];
      return {
        provider: { connected: readiness.canSubmit, status: readiness.status, message: readiness.reason, readiness },
        officialLinks: nativeOfficialLinks(),
        fiscalReceipts: { total: receipts.length, verified: receipts.filter((row) => row.status === "Verified").length, failed: receipts.filter((row) => ["Rejected", "Failed"].includes(row.status)).length, pending: receipts.filter((row) => ["Queued", "Submitting", "Submitted"].includes(row.status)).length },
        retryQueue: { pending: receipts.filter((row) => row.status === "Queued").length, processing: receipts.filter((row) => row.status === "Submitting").length, exhausted: 0 },
        zReports: { total: archives.length, latestBusinessDate: archives.map((row) => row.business_date).filter(Boolean).sort().at(-1) || null },
        taxConfigurations: { total: taxProfiles.length, active: taxProfiles.filter((row) => row.is_active !== false).length },
        anomaly: { status: "available", settings: anomalySettings, recentEvents: anomalyEvents },
      };
    }),

  getVatTrendSummary: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), periods: z.number().int().min(3).max(24).optional() }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      return nativeVatTrend(input.companyId, input.periods || 12);
    }),

  getVatAnomalySettings: protectedProcedure
    .input(z.object({ companyId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      return getNativeAnomalySettings(input.companyId);
    }),

  saveVatAnomalySettings: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), enabled: z.boolean(), thresholdPercent: z.number().int().min(5).max(500), cooldownMinutes: z.number().int().min(15).max(10080) }))
    .mutation(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      if (!canAdmin(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to configure VAT anomaly alerts." });
      const settings = await saveNativeAnomalySettings(input.companyId, input);
      await nativeAudit(input.companyId, "SAVE_TRA_VAT_ANOMALY_SETTINGS", input);
      return settings;
    }),

  listVatAnomalyEvents: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), limit: z.number().int().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      return nativeAuxiliaryRows("tra_vat_anomaly_events", input.companyId, input.limit || 50);
    }),

  evaluateVatAnomaly: protectedProcedure
    .input(z.object({ companyId: z.string().min(1), period: z.string().regex(/^\d{4}-\d{2}$/).optional(), branchId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { profile } = await resolveVerifiedProfile(ctx.req);
      requireCompany(profile, input.companyId);
      const settings = await getNativeAnomalySettings(input.companyId);
      const trends = await nativeVatTrend(input.companyId, 12);
      const selected = trends.find((row) => row.period === input.period) || trends.at(-1) || { period: input.period || "", vat: 0 };
      const historical = trends.filter((row) => row.period !== selected.period && row.verifiedReceipts > 0).map((row) => row.vat);
      const historicalAverageVat = historical.length ? historical.reduce((sum, value) => sum + value, 0) / historical.length : 0;
      const variancePercent = historicalAverageVat > 0 ? ((selected.vat - historicalAverageVat) / historicalAverageVat) * 100 : null;
      const threshold = numberValue(settings.threshold_percent) || 50;
      return { period: selected.period, branchId: input.branchId || null, currentVat: selected.vat, historicalAverageVat: Number(historicalAverageVat.toFixed(2)), variancePercent: variancePercent === null ? null : Number(variancePercent.toFixed(2)), thresholdPercent: threshold, status: variancePercent !== null && Math.abs(variancePercent) >= threshold ? "Triggered" : "Normal", deliveryStatus: "Not evaluated", source: "Supabase-native restaurant_fiscal_receipts" };
    }),
});
