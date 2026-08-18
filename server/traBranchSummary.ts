import { and, eq, gte, lt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { fiscalProfiles, fiscalReceipts } from "./traFiscal";
import { getDb } from "./db";

export type TraBranchTaxSummary = {
  branchId: string;
  businessName: string;
  region: string | null;
  receiptCount: number;
  verifiedReceiptCount: number;
  grossSales: number;
  taxableSales: number;
  vatTotal: number;
  vatToGrossPercent: number;
};

function assertDateRange(startDate: string, endDate: string) {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(startDate) || !iso.test(endDate)) throw new TRPCError({ code: "BAD_REQUEST", message: "TRA date filters must use YYYY-MM-DD." });
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || startDate > endDate) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Start date must be on or before end date." });
  }
  return { start, endExclusive: new Date(end.getTime() + 24 * 60 * 60 * 1000) };
}

const decimalNumber = (value: unknown) => Number(Number(value ?? 0).toFixed(2));

export async function getBranchTaxLiabilitySummary(companyId: string, startDate: string, endDate: string): Promise<{ companyId: string; startDate: string; endDate: string; branches: TraBranchTaxSummary[]; totals: Omit<TraBranchTaxSummary, "branchId" | "businessName" | "region"> }> {
  const { start, endExclusive } = assertDateRange(startDate, endDate);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "TRA branch summary database is unavailable." });

  const profiles = await db.select({
    branchId: fiscalProfiles.branchId,
    businessName: fiscalProfiles.businessName,
    region: fiscalProfiles.region,
  }).from(fiscalProfiles).where(eq(fiscalProfiles.companyId, companyId));

  const grouped = await db.select({
    branchId: fiscalReceipts.branchId,
    receiptCount: sql<number>`COUNT(${fiscalReceipts.id})`,
    verifiedReceiptCount: sql<number>`SUM(CASE WHEN ${fiscalReceipts.status} IN ('VERIFIED', 'SUBMITTED') THEN 1 ELSE 0 END)`,
    grossSales: sql<string>`COALESCE(SUM(CASE WHEN ${fiscalReceipts.status} IN ('VERIFIED', 'SUBMITTED') THEN CAST(${fiscalReceipts.grossAmount} AS DECIMAL(14,2)) ELSE 0 END), 0)`,
    taxableSales: sql<string>`COALESCE(SUM(CASE WHEN ${fiscalReceipts.status} IN ('VERIFIED', 'SUBMITTED') THEN CAST(${fiscalReceipts.netAmount} AS DECIMAL(14,2)) ELSE 0 END), 0)`,
    vatTotal: sql<string>`COALESCE(SUM(CASE WHEN ${fiscalReceipts.status} IN ('VERIFIED', 'SUBMITTED') THEN CAST(${fiscalReceipts.vatAmount} AS DECIMAL(14,2)) ELSE 0 END), 0)`,
  }).from(fiscalReceipts).where(and(
    eq(fiscalReceipts.companyId, companyId),
    gte(fiscalReceipts.receiptTimestamp, start),
    lt(fiscalReceipts.receiptTimestamp, endExclusive),
  )).groupBy(fiscalReceipts.branchId);

  const profileMap = new Map(profiles.map((profile) => [profile.branchId, profile]));
  const branchIds = new Set([...profiles.map((profile) => profile.branchId), ...grouped.map((row) => row.branchId)]);
  const branches = Array.from(branchIds).sort().map((branchId) => {
    const profile = profileMap.get(branchId);
    const metrics = grouped.find((row) => row.branchId === branchId);
    const grossSales = decimalNumber(metrics?.grossSales);
    const taxableSales = decimalNumber(metrics?.taxableSales);
    const vatTotal = decimalNumber(metrics?.vatTotal);
    return {
      branchId,
      businessName: profile?.businessName || "Unconfigured TRA branch",
      region: profile?.region || null,
      receiptCount: Number(metrics?.receiptCount ?? 0),
      verifiedReceiptCount: Number(metrics?.verifiedReceiptCount ?? 0),
      grossSales,
      taxableSales,
      vatTotal,
      vatToGrossPercent: grossSales > 0 ? Number(((vatTotal / grossSales) * 100).toFixed(2)) : 0,
    };
  });

  const totals = branches.reduce((acc, branch) => ({
    receiptCount: acc.receiptCount + branch.receiptCount,
    verifiedReceiptCount: acc.verifiedReceiptCount + branch.verifiedReceiptCount,
    grossSales: Number((acc.grossSales + branch.grossSales).toFixed(2)),
    taxableSales: Number((acc.taxableSales + branch.taxableSales).toFixed(2)),
    vatTotal: Number((acc.vatTotal + branch.vatTotal).toFixed(2)),
    vatToGrossPercent: 0,
  }), { receiptCount: 0, verifiedReceiptCount: 0, grossSales: 0, taxableSales: 0, vatTotal: 0, vatToGrossPercent: 0 });
  totals.vatToGrossPercent = totals.grossSales > 0 ? Number(((totals.vatTotal / totals.grossSales) * 100).toFixed(2)) : 0;

  return { companyId, startDate, endDate, branches, totals };
}
