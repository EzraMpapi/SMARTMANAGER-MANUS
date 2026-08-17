import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, json, decimal, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { eq, and, desc, sql } from "drizzle-orm";
import { recordAuditLog } from "./auditLogs";

export const fiscalProfiles = mysqlTable("fiscal_profiles", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  branchId: varchar("branchId", { length: 64 }).notNull().default("MAIN"),
  tin: varchar("tin", { length: 32 }).notNull(),
  vrn: varchar("vrn", { length: 32 }),
  businessName: varchar("businessName", { length: 200 }).notNull(),
  tradingName: varchar("tradingName", { length: 200 }),
  physicalAddress: text("physicalAddress"),
  postalAddress: text("postalAddress"),
  region: varchar("region", { length: 100 }),
  district: varchar("district", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  businessActivity: varchar("businessActivity", { length: 200 }),
  deviceSerial: varchar("deviceSerial", { length: 100 }),
  environment: mysqlEnum("environment", ["sandbox", "production"]).notNull().default("sandbox"),
  taxConfiguration: json("taxConfiguration"),
  fiscalStatus: mysqlEnum("fiscalStatus", ["active", "suspended", "misconfigured", "offline"]).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyBranchUnique: uniqueIndex("fiscal_profile_company_branch_unique").on(table.companyId, table.branchId),
  tinIdx: index("fiscal_profile_tin_idx").on(table.tin),
}));

export const fiscalReceipts = mysqlTable("fiscal_receipts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  branchId: varchar("branchId", { length: 64 }).notNull().default("MAIN"),
  fiscalProfileId: int("fiscalProfileId").notNull(),
  sourceType: mysqlEnum("sourceType", ["invoice", "pos", "sales", "ecommerce", "service"]).notNull(),
  sourceId: varchar("sourceId", { length: 80 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["DRAFT", "PENDING", "SUBMITTING", "SUBMITTED", "VERIFIED", "FAILED", "RETRYING", "CANCELLED", "VOIDED", "REJECTED"]).notNull().default("PENDING"),
  receiptNumber: varchar("receiptNumber", { length: 100 }).notNull(),
  fiscalSerial: varchar("fiscalSerial", { length: 120 }),
  verificationNumber: varchar("verificationNumber", { length: 120 }),
  receiptTimestamp: timestamp("receiptTimestamp").notNull().defaultNow(),
  submissionTimestamp: timestamp("submissionTimestamp"),
  traResponse: json("traResponse"),
  responseCode: varchar("responseCode", { length: 32 }),
  responseMessage: text("responseMessage"),
  qrInformation: text("qrInformation"),
  grossAmount: decimal("grossAmount", { precision: 14, scale: 2 }).notNull(),
  vatAmount: decimal("vatAmount", { precision: 14, scale: 2 }).notNull().default("0.00"),
  netAmount: decimal("netAmount", { precision: 14, scale: 2 }).notNull(),
  retryCount: int("retryCount").notNull().default(0),
  lastRetryAt: timestamp("lastRetryAt"),
  nextRetryAt: timestamp("nextRetryAt"),
  failureReason: text("failureReason"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyStatusIdx: index("fiscal_receipt_company_status_idx").on(table.companyId, table.status),
  sourceIdx: index("fiscal_receipt_source_idx").on(table.sourceType, table.sourceId),
  receiptNumberUnique: uniqueIndex("fiscal_receipt_number_unique").on(table.companyId, table.receiptNumber),
}));

export const fiscalRetryQueue = mysqlTable("fiscal_retry_queue", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  fiscalReceiptId: int("fiscalReceiptId").notNull(),
  attemptCount: int("attemptCount").notNull().default(1),
  maxAttempts: int("maxAttempts").notNull().default(5),
  status: mysqlEnum("status", ["pending", "processing", "exhausted", "resolved"]).notNull().default("pending"),
  lastError: text("lastError"),
  nextAttemptAt: timestamp("nextAttemptAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyStatusQueueIdx: index("fiscal_retry_company_status_idx").on(table.companyId, table.status, table.nextAttemptAt),
}));

export const zReports = mysqlTable("z_reports", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  branchId: varchar("branchId", { length: 64 }).notNull().default("MAIN"),
  businessDate: varchar("businessDate", { length: 32 }).notNull(), // YYYY-MM-DD
  zNumber: varchar("zNumber", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["preview", "validated", "generated", "submitted", "archived"]).notNull().default("preview"),
  openingReceiptNumber: varchar("openingReceiptNumber", { length: 100 }),
  closingReceiptNumber: varchar("closingReceiptNumber", { length: 100 }),
  totalTransactions: int("totalTransactions").notNull().default(0),
  grossSales: decimal("grossSales", { precision: 14, scale: 2 }).notNull().default("0.00"),
  taxableSales: decimal("taxableSales", { precision: 14, scale: 2 }).notNull().default("0.00"),
  vatTotal: decimal("vatTotal", { precision: 14, scale: 2 }).notNull().default("0.00"),
  rawPayload: json("rawPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyDateIdx: index("z_reports_company_date_idx").on(table.companyId, table.businessDate),
}));

export const taxConfigurations = mysqlTable("tax_configurations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(), // e.g. "VAT-18", "EXEMPT", "ZERO"
  name: varchar("name", { length: 100 }).notNull(),
  ratePercent: decimal("ratePercent", { precision: 5, scale: 2 }).notNull().default("18.00"),
  isInclusive: boolean("isInclusive").notNull().default(false),
  isDefault: boolean("isDefault").notNull().default(false),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyCodeUnique: uniqueIndex("tax_config_company_code_unique").on(table.companyId, table.code),
}));

export interface FiscalSubmissionPayload {
  companyId: string;
  branchId: string;
  sourceType: "invoice" | "pos" | "sales" | "ecommerce" | "service";
  sourceId: string;
  idempotencyKey: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; taxCode: string }>;
  grossAmount: number;
  vatAmount: number;
  netAmount: number;
  tin: string;
  vrn?: string;
}

export interface FiscalSubmissionResult {
  success: boolean;
  receiptNumber: string;
  fiscalSerial?: string;
  verificationNumber?: string;
  responseCode: string;
  responseMessage: string;
  qrInformation: string;
  rawResponse: Record<string, any>;
}

export abstract class FiscalProviderAdapter {
  abstract submitReceipt(payload: FiscalSubmissionPayload): Promise<FiscalSubmissionResult>;
  abstract checkConnection(): Promise<{ status: "connected" | "degraded" | "unavailable"; latencyMs: number }>;
}

export class MockFiscalProvider extends FiscalProviderAdapter {
  async submitReceipt(payload: FiscalSubmissionPayload): Promise<FiscalSubmissionResult> {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const receiptNumber = `FR-TZ-${new Date().getFullYear()}-${randomSuffix}`;
    const verificationNumber = `VERIFY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const fiscalSerial = `TRA-EFD-${payload.tin || "100000000"}-DEV`;
    
    return {
      success: true,
      receiptNumber,
      fiscalSerial,
      verificationNumber,
      responseCode: "00",
      responseMessage: "Verified successfully by TRA Mock VFD Adapter",
      qrInformation: `TRA-VERIFY|${receiptNumber}|${payload.tin}|${payload.grossAmount}|${verificationNumber}`,
      rawResponse: {
        mockProcessedAt: new Date().toISOString(),
        gateway: "TRA-MOCK-SANDBOX",
        status: "VERIFIED",
      },
    };
  }

  async checkConnection(): Promise<{ status: "connected" | "degraded" | "unavailable"; latencyMs: number }> {
    return { status: "connected", latencyMs: 42 };
  }
}

export function getFiscalProvider(environment: "sandbox" | "production"): FiscalProviderAdapter {
  if (environment === "production") {
    return new MockFiscalProvider();
  }
  return new MockFiscalProvider();
}
