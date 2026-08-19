import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, json, decimal, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core";

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
  fiscalStatus: mysqlEnum("fiscalStatus", ["active", "suspended", "misconfigured", "offline"]).notNull().default("misconfigured"),
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
  businessDate: varchar("businessDate", { length: 32 }).notNull(),
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
  code: varchar("code", { length: 32 }).notNull(),
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
  rawResponse: Record<string, unknown>;
}

export type FiscalConnectionStatus = "connected" | "degraded" | "unavailable";

export interface FiscalProviderReadiness {
  status: "READY" | "AWAITING_CONFIGURATION" | "UNAVAILABLE";
  environment: "sandbox" | "production";
  canSubmit: boolean;
  canVerify: boolean;
  reason: string;
  officialPortalUrl: string;
  receiptVerificationUrl: string;
}

export abstract class FiscalProviderAdapter {
  abstract readonly capability: "OFFICIAL" | "UNAVAILABLE";
  abstract getReadiness(): FiscalProviderReadiness;
  abstract submitReceipt(payload: FiscalSubmissionPayload): Promise<FiscalSubmissionResult>;
  abstract checkConnection(): Promise<{ status: FiscalConnectionStatus; latencyMs: number | null; reason: string }>;
}

const OFFICIAL_PORTAL_URL = "https://taxpayerportal.tra.go.tz/";
const RECEIPT_VERIFICATION_URL = "https://verify.tra.go.tz/";

export class UnavailableFiscalProvider extends FiscalProviderAdapter {
  readonly capability = "UNAVAILABLE" as const;
  private readonly environment: "sandbox" | "production";
  private readonly reason: string;

  constructor(environment: "sandbox" | "production", reason = "An approved TRA production adapter, endpoint, credentials, and certificate are not configured.") {
    super();
    this.environment = environment;
    this.reason = reason;
  }

  getReadiness(): FiscalProviderReadiness {
    return {
      status: "AWAITING_CONFIGURATION",
      environment: this.environment,
      canSubmit: false,
      canVerify: false,
      reason: this.reason,
      officialPortalUrl: OFFICIAL_PORTAL_URL,
      receiptVerificationUrl: RECEIPT_VERIFICATION_URL,
    };
  }

  async submitReceipt(_payload: FiscalSubmissionPayload): Promise<FiscalSubmissionResult> {
    return {
      success: false,
      receiptNumber: "",
      responseCode: "OFFICIAL_ADAPTER_NOT_CONFIGURED",
      responseMessage: this.reason,
      qrInformation: "",
      rawResponse: {
        capability: this.capability,
        environment: this.environment,
        reason: this.reason,
      },
    };
  }

  async checkConnection() {
    return {
      status: "unavailable" as const,
      latencyMs: null,
      reason: this.reason,
    };
  }
}

/**
 * The adapter intentionally fails closed until TRA supplies an approved production
 * interface and the tenant has server-side credentials. A generic HTTP client is
 * not used because an undocumented endpoint could create false fiscalization claims.
 */
export function getFiscalProvider(environment: "sandbox" | "production"): FiscalProviderAdapter {
  return new UnavailableFiscalProvider(environment);
}

export function getFiscalProviderReadiness(environment: "sandbox" | "production"): FiscalProviderReadiness {
  return getFiscalProvider(environment).getReadiness();
}

export const officialTraLinks = {
  taxpayerPortalUrl: OFFICIAL_PORTAL_URL,
  receiptVerificationUrl: RECEIPT_VERIFICATION_URL,
} as const;
