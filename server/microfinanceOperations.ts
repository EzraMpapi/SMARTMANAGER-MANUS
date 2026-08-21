import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { webhookDeliveries } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { createHeartbeatJob, deleteHeartbeatJob } from "./_core/heartbeat";
import { resolveVerifiedProfile } from "./aiApprovals";
import { getDb } from "./db";

export const MICROFINANCE_TABLES = [
  "mfi_clients", "mfi_groups", "mfi_loan_products", "mfi_loan_applications", "mfi_loans",
  "mfi_repayment_schedules", "mfi_repayments", "mfi_savings", "mfi_guarantors", "mfi_collateral",
  "mfi_collections", "mfi_cash_sessions", "mfi_cash_transactions", "mfi_staff_commissions",
  "mfi_notifications", "mfi_audit_logs", "mfi_credit_scoring_settings", "mfi_credit_scorecards", "mfi_par_escalation_settings",
] as const;

type MicrofinanceTable = (typeof MICROFINANCE_TABLES)[number];
type Row = { id: string; company_id: string; name: string | null; status: string | null; amount: number | string | null; notes: string | null; data: unknown; created_at: string; updated_at: string };
type StaffProfile = { id: string; company_id: string; full_name: string | null; role: string };

const money = z.number().finite().positive().max(1_000_000_000_000);
const nonNegativeMoney = z.number().finite().min(0).max(1_000_000_000_000);
const shortText = z.string().trim().min(1).max(240);
const optionalText = z.string().trim().max(2_000).optional().default("");
const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const paymentMethod = z.enum(["cash", "mobile_money", "bank_transfer"]);
const loanFrequency = z.enum(["weekly", "biweekly", "monthly"]);

export const microfinanceBorrowerInput = z.object({
  firstName: shortText,
  lastName: shortText,
  phone: z.string().trim().min(9).max(32),
  nationalId: z.string().trim().min(4).max(64),
  dateOfBirth: dateInput,
  gender: z.enum(["Female", "Male", "Other", "Prefer not to say"]),
  village: shortText,
  district: shortText,
  region: shortText,
  occupation: z.string().trim().max(160).optional().default(""),
  monthlyIncome: nonNegativeMoney.optional().default(0),
  kycStatus: z.enum(["Pending", "Verified", "Needs review"]).optional().default("Pending"),
  groupId: z.string().uuid().nullable().optional().default(null),
});
export const microfinanceGroupInput = z.object({ name: shortText, meetingDay: z.string().trim().max(32), meetingLocation: z.string().trim().max(240), chairperson: z.string().trim().max(160).optional().default("") });
export const microfinanceProductInput = z.object({
  name: shortText, code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,24}$/),
  minimumPrincipal: money, maximumPrincipal: money,
  annualInterestRate: z.number().min(0).max(200),
  setupFeeRate: z.number().min(0).max(30).default(0),
  insuranceFeeRate: z.number().min(0).max(30).default(0),
  penaltyRateMonthly: z.number().min(0).max(30).default(0),
  collectorCommissionRate: z.number().min(0).max(30).default(0),
  termMinMonths: z.number().int().min(1).max(120), termMaxMonths: z.number().int().min(1).max(120),
  repaymentFrequency: loanFrequency.default("monthly"), requiresGuarantor: z.boolean().default(false), requiresCollateral: z.boolean().default(false),
});
export const microfinanceApplicationInput = z.object({ borrowerId: z.string().uuid(), productId: z.string().uuid(), principal: money, termMonths: z.number().int().min(1).max(120), repaymentFrequency: loanFrequency, intendedUse: z.string().trim().min(3).max(400), groupId: z.string().uuid().nullable().optional().default(null), guarantorIds: z.array(z.string().uuid()).max(5).default([]), collateralIds: z.array(z.string().uuid()).max(5).default([]) });
export const microfinanceDecisionInput = z.object({ applicationId: z.string().uuid(), decision: z.enum(["Approved", "Rejected"]), approvedAmount: nonNegativeMoney.optional().default(0), decisionNote: optionalText });
export const microfinanceDisbursementInput = z.object({ applicationId: z.string().uuid(), disbursedOn: dateInput, paymentMethod, provider: z.string().trim().max(60).optional().default(""), providerReference: z.string().trim().max(100).optional().default(""), cashSessionId: z.string().uuid().nullable().optional().default(null) });
export const microfinanceRepaymentInput = z.object({ loanId: z.string().uuid(), amount: money, receivedOn: dateInput, paymentMethod, provider: z.string().trim().max(60).optional().default(""), providerReference: z.string().trim().max(100).optional().default(""), cashSessionId: z.string().uuid().nullable().optional().default(null), idempotencyKey: z.string().uuid().optional() });
export const microfinanceSavingsInput = z.object({ borrowerId: z.string().uuid(), amount: money, transactionType: z.enum(["Deposit", "Withdrawal"]), transactedOn: dateInput, paymentMethod, providerReference: z.string().trim().max(100).optional().default(""), cashSessionId: z.string().uuid().nullable().optional().default(null), note: optionalText });
export const microfinanceGuarantorInput = z.object({ borrowerId: z.string().uuid(), fullName: shortText, phone: z.string().trim().min(9).max(32), nationalId: z.string().trim().min(4).max(64), relationship: shortText, guaranteedAmount: money });
export const microfinanceCollateralInput = z.object({ borrowerId: z.string().uuid(), description: shortText, collateralType: shortText, estimatedValue: money, documentReference: z.string().trim().max(120).optional().default("") });
export const microfinanceCashOpenInput = z.object({ openingBalance: nonNegativeMoney, openedOn: dateInput, note: optionalText });
export const microfinanceCashCloseInput = z.object({ cashSessionId: z.string().uuid(), closingBalance: nonNegativeMoney, note: optionalText });
export const microfinanceCollectionInput = z.object({ loanId: z.string().uuid(), action: z.enum(["Call", "Visit", "Promise to pay", "Restructure review"]), dueOn: dateInput, note: optionalText });
export const microfinanceListInput = z.object({ limit: z.number().int().min(1).max(200).optional().default(100) });
const ESCALATION_RECIPIENT_ROLE_OPTIONS = ["Company Administrator", "Organization Owner", "CEO", "Finance Manager", "Microfinance Manager", "Collections Officer"] as const;
const DEFAULT_ESCALATION_ROLES = ["Company Administrator", "Collections Officer"] as const;
export const microfinanceCreditScoringSettingsInput = z.object({
  kycWeight: z.number().int().min(0).max(100), affordabilityWeight: z.number().int().min(0).max(100), repaymentHistoryWeight: z.number().int().min(0).max(100), guarantorWeight: z.number().int().min(0).max(100), collateralWeight: z.number().int().min(0).max(100),
  maxDebtServiceRatio: z.number().min(5).max(100), approvalThreshold: z.number().int().min(1).max(100), reviewThreshold: z.number().int().min(0).max(99),
});
export const microfinanceEscalationSettingsInput = z.object({
  recipientMode: z.enum(["roles", "managed", "both"]), roleRecipients: z.array(z.enum(ESCALATION_RECIPIENT_ROLE_OPTIONS)).min(1).max(ESCALATION_RECIPIENT_ROLE_OPTIONS.length).default([...DEFAULT_ESCALATION_ROLES]), managedRecipients: z.array(z.string().trim().email()).max(20).default([]), scheduleLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), timezone: z.literal("Africa/Dar_es_Salaam").default("Africa/Dar_es_Salaam"), deliveryEnabled: z.boolean().default(false),
  par30AlertThreshold: z.number().min(0).max(100), overdueAmountAlertThreshold: nonNegativeMoney,
});

const ADMIN_ROLES = new Set(["super administrator", "organization owner", "owner", "ceo", "cfo", "finance manager", "branch manager", "microfinance manager"]);
const CREDIT_ROLES = new Set(["credit officer", "loan officer", "microfinance officer"]);
const TELLER_ROLES = new Set(["teller", "cashier", "finance officer"]);
const COLLECTION_ROLES = new Set(["collections officer", "recovery officer", "credit officer", "loan officer"]);
const AUDIT_ROLES = new Set(["internal auditor", "auditor"]);
const PORTFOLIO_READ_ROLES = new Set(["credit officer", "loan officer", "microfinance officer", "teller", "cashier", "finance officer", "collections officer", "recovery officer", "internal auditor", "auditor"]);
const REPAYMENT_RECORDING_ROLES = new Set(["teller", "cashier", "finance officer", "collections officer", "recovery officer", "credit officer", "loan officer"]);
const ESCALATION_ACTION = "MICROFINANCE_PAR_COLLECTIONS_ESCALATION_EMAIL";
const ESCALATION_TIMEZONE = "Africa/Dar_es_Salaam";
const DEFAULT_SCORING_RULES = { kycWeight: 20, affordabilityWeight: 30, repaymentHistoryWeight: 20, guarantorWeight: 15, collateralWeight: 15, maxDebtServiceRatio: 40, approvalThreshold: 70, reviewThreshold: 50 };
type CreditScoringRules = z.infer<typeof microfinanceCreditScoringSettingsInput>;

function dataOf(row: Row | undefined): Record<string, unknown> { return row?.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data as Record<string, unknown> : {}; }
function numeric(value: unknown): number { const parsed = typeof value === "number" ? value : Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function roundTzs(value: number) { return Math.round(value); }
function normalizedRole(role: string) { return role.trim().toLowerCase(); }
function normalizedRecipients(values: string[]) { return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter((value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)))); }
function headers() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Microfinance operations are not configured." });
  return { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
}
function endpoint(table: string, params = new URLSearchParams()) { return `${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?${params.toString()}`; }
async function request<T>(table: string, params = new URLSearchParams(), init: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint(table, params), { ...init, headers: { ...headers(), ...(init.headers || {}) } });
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The microfinance operation could not be completed safely." });
  return body as T;
}
async function profile(req: CreateExpressContextOptions["req"]): Promise<StaffProfile> {
  const resolved = await resolveVerifiedProfile(req);
  if (!resolved.profile?.company_id) throw new TRPCError({ code: "FORBIDDEN", message: "A verified tenant assignment is required for microfinance operations." });
  return resolved.profile as StaffProfile;
}
function can(profile: StaffProfile, allowed: Set<string>) { return ADMIN_ROLES.has(normalizedRole(profile.role)) || allowed.has(normalizedRole(profile.role)); }
function requirePermission(profile: StaffProfile, allowed: Set<string>, action: string) { if (!can(profile, allowed)) throw new TRPCError({ code: "FORBIDDEN", message: `Your role cannot ${action} in Microfinance.` }); }
async function rows(table: MicrofinanceTable, companyId: string, limit = 200, status?: string) {
  const params = new URLSearchParams({ select: "id,company_id,name,status,amount,notes,data,created_at,updated_at", company_id: `eq.${companyId}`, order: "created_at.desc", limit: String(limit) });
  if (status) params.set("status", `eq.${status}`);
  return request<Row[]>(table, params);
}
async function row(table: MicrofinanceTable, companyId: string, id: string) { return (await request<Row[]>(table, new URLSearchParams({ select: "id,company_id,name,status,amount,notes,data,created_at,updated_at", id: `eq.${id}`, company_id: `eq.${companyId}`, limit: "1" })))[0]; }
async function insert(table: MicrofinanceTable, values: Omit<Row, "id" | "created_at" | "updated_at">) { return (await request<Row[]>(table, new URLSearchParams(), { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(values) }))[0]; }
async function patch(table: MicrofinanceTable, companyId: string, id: string, values: Partial<Pick<Row, "name" | "status" | "amount" | "notes" | "data">>) {
  const result = await request<Row[]>(table, new URLSearchParams({ id: `eq.${id}`, company_id: `eq.${companyId}` }), { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(values) });
  if (result.length !== 1) throw new TRPCError({ code: "CONFLICT", message: "This microfinance record changed before it could be saved." });
  return result[0];
}
async function audit(companyId: string, actor: StaffProfile, action: string, entityType: string, entityId: string, details: Record<string, unknown> = {}) {
  await insert("mfi_audit_logs", { company_id: companyId, name: action, status: "Recorded", amount: null, notes: null, data: { entityType, entityId, actorId: actor.id, actorName: actor.full_name || "Microfinance staff", actorRole: actor.role, occurredAt: new Date().toISOString(), ...details } });
}
async function notify(companyId: string, name: string, severity: "Info" | "Warning" | "Critical", reference: Record<string, unknown>) {
  await insert("mfi_notifications", { company_id: companyId, name, status: "Unread", amount: null, notes: null, data: { severity, createdAt: new Date().toISOString(), ...reference } });
}
function displayBorrower(row: Row) { const data = dataOf(row); return { id: row.id, name: row.name || "Borrower", status: row.status || "Pending", phone: String(data.phone || ""), nationalId: String(data.nationalId || ""), kycStatus: String(data.kycStatus || "Pending"), village: String(data.village || ""), district: String(data.district || ""), region: String(data.region || ""), groupId: typeof data.groupId === "string" ? data.groupId : null, monthlyIncome: numeric(data.monthlyIncome), createdAt: row.created_at }; }
function displayLoan(row: Row) { const data = dataOf(row); return { id: row.id, number: String(data.loanNumber || row.id.slice(0, 8).toUpperCase()), borrowerId: String(data.borrowerId || ""), borrowerName: String(data.borrowerName || "Borrower"), productId: String(data.productId || ""), productName: String(data.productName || "Loan product"), principal: numeric(row.amount), totalDue: numeric(data.totalDue), outstanding: numeric(data.outstanding), disbursedOn: String(data.disbursedOn || ""), status: row.status || "Active", repaymentFrequency: String(data.repaymentFrequency || "monthly"), termMonths: numeric(data.termMonths), paymentMethod: String(data.paymentMethod || ""), mobileMoneyState: String(data.mobileMoneyState || "Not configured") }; }
function scoringRulesFromRow(row?: Row): CreditScoringRules { const data = dataOf(row); return microfinanceCreditScoringSettingsInput.parse({ ...DEFAULT_SCORING_RULES, ...data }); }
function escalationSettingsFromRow(row?: Row) {
  const data = dataOf(row); const scheduleCronTaskUid = typeof data.scheduleCronTaskUid === "string" && data.scheduleCronTaskUid ? data.scheduleCronTaskUid : null;
  const scheduleLocalTime = typeof data.scheduleLocalTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(data.scheduleLocalTime) ? data.scheduleLocalTime : "08:00";
  const roleRecipients = Array.isArray(data.roleRecipients)
    ? Array.from(new Set(data.roleRecipients.filter((role): role is typeof ESCALATION_RECIPIENT_ROLE_OPTIONS[number] => typeof role === "string" && (ESCALATION_RECIPIENT_ROLE_OPTIONS as readonly string[]).includes(role))))
    : [...DEFAULT_ESCALATION_ROLES];
  const deliveryEnabled = data.deliveryEnabled === true && Boolean(scheduleCronTaskUid);
  const [hour, minute] = scheduleLocalTime.split(":").map(Number); const utcHour = (hour + 21) % 24; const now = new Date(); const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, minute, 0)); if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return { id: row?.id || null, companyId: row?.company_id || "", recipientMode: data.recipientMode === "roles" || data.recipientMode === "managed" || data.recipientMode === "both" ? data.recipientMode : "roles", managedRecipients: Array.isArray(data.managedRecipients) ? normalizedRecipients(data.managedRecipients.filter((value): value is string => typeof value === "string")) : [], roleRecipients: roleRecipients.length ? roleRecipients : [...DEFAULT_ESCALATION_ROLES], scheduleLocalTime, timezone: ESCALATION_TIMEZONE, par30AlertThreshold: numeric(data.par30AlertThreshold || 10), overdueAmountAlertThreshold: numeric(data.overdueAmountAlertThreshold || 0), scheduleCronTaskUid, deliveryEnabled, scheduleState: deliveryEnabled ? `Active — daily at ${scheduleLocalTime} ${ESCALATION_TIMEZONE}` : "Inactive pending explicit time and activation confirmation", nextRunAt: deliveryEnabled ? next.toISOString() : null };
}

export function calculateMicrofinanceCreditScore(input: { rules: CreditScoringRules; kycStatus: string; monthlyIncome: number; projectedInstallment: number; hasRepaymentHistory: boolean; hasOverdueHistory: boolean; requiresGuarantor: boolean; guarantorVerified: boolean; requiresCollateral: boolean; collateralVerified: boolean }) {
  const { rules } = input; const ratio = input.monthlyIncome > 0 ? input.projectedInstallment / input.monthlyIncome * 100 : Number.POSITIVE_INFINITY;
  const kyc = input.kycStatus === "Verified" ? rules.kycWeight : 0;
  const affordability = ratio <= rules.maxDebtServiceRatio ? rules.affordabilityWeight : ratio <= rules.maxDebtServiceRatio * 1.25 ? Math.round(rules.affordabilityWeight / 2) : 0;
  const repaymentHistory = !input.hasRepaymentHistory ? Math.round(rules.repaymentHistoryWeight / 2) : input.hasOverdueHistory ? 0 : rules.repaymentHistoryWeight;
  const guarantor = !input.requiresGuarantor || input.guarantorVerified ? rules.guarantorWeight : 0;
  const collateral = !input.requiresCollateral || input.collateralVerified ? rules.collateralWeight : 0;
  const score = kyc + affordability + repaymentHistory + guarantor + collateral;
  const recommendation = score >= rules.approvalThreshold ? "Eligible for approval" : score >= rules.reviewThreshold ? "Manual review" : "Decline recommended";
  return { score, recommendation, debtServiceRatio: Number.isFinite(ratio) ? Number(ratio.toFixed(1)) : null, breakdown: { kyc, affordability, repaymentHistory, guarantor, collateral } };
}
function scheduleDates(disbursedOn: string, periods: number, frequency: z.infer<typeof loanFrequency>) {
  const base = new Date(`${disbursedOn}T00:00:00.000Z`); const dates: string[] = [];
  for (let index = 1; index <= periods; index += 1) {
    const next = new Date(base);
    if (frequency === "monthly") next.setUTCMonth(base.getUTCMonth() + index);
    else next.setUTCDate(base.getUTCDate() + index * (frequency === "weekly" ? 7 : 14));
    dates.push(next.toISOString().slice(0, 10));
  }
  return dates;
}
export function calculateMicrofinanceRepaymentTerms(principal: number, product: Record<string, unknown>, termMonths: number, frequency: z.infer<typeof loanFrequency>) {
  const annualRate = numeric(product.annualInterestRate);
  const interest = roundTzs(principal * annualRate / 100 * termMonths / 12);
  const fees = roundTzs(principal * (numeric(product.setupFeeRate) + numeric(product.insuranceFeeRate)) / 100);
  const totalDue = principal + interest + fees;
  const periods = frequency === "monthly" ? termMonths : frequency === "biweekly" ? termMonths * 2 : termMonths * 4;
  const installment = Math.floor(totalDue / periods);
  return { annualRate, interest, fees, totalDue, periods, installment, remainder: totalDue - installment * periods };
}
export function calculateMicrofinanceOverdueDays(dueDate: string, outstanding: number, now = Date.now()) { if (outstanding <= 0) return 0; const delta = now - new Date(`${dueDate}T23:59:59.999Z`).getTime(); return delta > 0 ? Math.floor(delta / 86_400_000) : 0; }

export async function listMicrofinanceDashboard(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceListInput>) {
  const actor = await profile(req); requirePermission(actor, PORTFOLIO_READ_ROLES, "view portfolio data");
  const [borrowers, groups, products, applications, loans, schedules, repayments, savings, guarantors, collateral, collections, cashSessions, commissions, notifications, scorecards] = await Promise.all([
    rows("mfi_clients", actor.company_id, input.limit), rows("mfi_groups", actor.company_id, input.limit), rows("mfi_loan_products", actor.company_id, input.limit), rows("mfi_loan_applications", actor.company_id, input.limit), rows("mfi_loans", actor.company_id, input.limit), rows("mfi_repayment_schedules", actor.company_id, input.limit * 4), rows("mfi_repayments", actor.company_id, input.limit), rows("mfi_savings", actor.company_id, input.limit), rows("mfi_guarantors", actor.company_id, input.limit), rows("mfi_collateral", actor.company_id, input.limit), rows("mfi_collections", actor.company_id, input.limit), rows("mfi_cash_sessions", actor.company_id, 20), rows("mfi_staff_commissions", actor.company_id, input.limit), rows("mfi_notifications", actor.company_id, input.limit), rows("mfi_credit_scorecards", actor.company_id, input.limit),
  ]);
  const activeLoans = loans.filter((item) => ["Active", "Overdue"].includes(item.status || ""));
  const portfolioOutstanding = activeLoans.reduce((sum, item) => sum + numeric(dataOf(item).outstanding), 0);
  const overdueSchedules = schedules.filter((item) => calculateMicrofinanceOverdueDays(String(dataOf(item).dueDate || ""), numeric(dataOf(item).outstanding)) > 0);
  const par30Schedules = overdueSchedules.filter((item) => calculateMicrofinanceOverdueDays(String(dataOf(item).dueDate || ""), numeric(dataOf(item).outstanding)) >= 30);
  const par30Amount = par30Schedules.reduce((sum, item) => sum + numeric(dataOf(item).outstanding), 0);
  const savingsBalance = savings.reduce((sum, item) => sum + (item.status === "Deposit" ? numeric(item.amount) : -numeric(item.amount)), 0);
  return {
    permissions: { canManage: can(actor, CREDIT_ROLES), canApprove: can(actor, new Set()), canDisburse: can(actor, TELLER_ROLES), canCollect: can(actor, COLLECTION_ROLES), canAudit: can(actor, AUDIT_ROLES) },
    currency: "TZS", timezone: "Africa/Dar_es_Salaam",
    metrics: { borrowerCount: borrowers.length, verifiedBorrowerCount: borrowers.filter((item) => dataOf(item).kycStatus === "Verified").length, activeLoanCount: activeLoans.length, portfolioOutstanding, overdueAmount: overdueSchedules.reduce((sum, item) => sum + numeric(dataOf(item).outstanding), 0), par30Amount, par30Ratio: portfolioOutstanding ? par30Amount / portfolioOutstanding * 100 : 0, savingsBalance, repaymentCollected: repayments.reduce((sum, item) => sum + numeric(item.amount), 0) },
    borrowers: borrowers.map(displayBorrower), groups: groups.map((item) => ({ id: item.id, name: item.name || "Group", status: item.status, memberCount: numeric(dataOf(item).memberCount), meetingDay: String(dataOf(item).meetingDay || "") })),
    products: products.map((item) => ({ id: item.id, name: item.name || "Loan product", status: item.status, ...dataOf(item) })),
    applications: applications.map((item) => ({ id: item.id, name: item.name || "Loan application", status: item.status, amount: numeric(item.amount), createdAt: item.created_at, ...dataOf(item) })),
    loans: loans.map(displayLoan), schedules: schedules.map((item) => { const data = dataOf(item); const daysPastDue = calculateMicrofinanceOverdueDays(String(data.dueDate || ""), numeric(data.outstanding)); const penaltyAccrued = daysPastDue > 0 ? roundTzs(numeric(data.outstanding) * numeric(data.penaltyRateMonthly) / 100 * Math.ceil(daysPastDue / 30)) : 0; return { id: item.id, status: item.status, amount: numeric(item.amount), createdAt: item.created_at, ...data, daysPastDue, penaltyAccrued }; }),
    repayments: repayments.map((item) => ({ id: item.id, name: item.name, amount: numeric(item.amount), status: item.status, createdAt: item.created_at, ...dataOf(item) })),
    savings: savings.map((item) => ({ id: item.id, name: item.name, amount: numeric(item.amount), status: item.status, createdAt: item.created_at, ...dataOf(item) })),
    guarantors: guarantors.map((item) => ({ id: item.id, name: item.name, status: item.status, amount: numeric(item.amount), createdAt: item.created_at, ...dataOf(item) })),
    collateral: collateral.map((item) => ({ id: item.id, name: item.name, status: item.status, amount: numeric(item.amount), createdAt: item.created_at, ...dataOf(item) })),
    collections: collections.map((item) => ({ id: item.id, name: item.name, status: item.status, createdAt: item.created_at, ...dataOf(item) })),
    cashSessions: cashSessions.map((item) => ({ id: item.id, name: item.name, status: item.status, amount: numeric(item.amount), createdAt: item.created_at, ...dataOf(item) })),
    commissions: commissions.map((item) => ({ id: item.id, name: item.name, status: item.status, amount: numeric(item.amount), createdAt: item.created_at, ...dataOf(item) })),
    notifications: notifications.map((item) => ({ id: item.id, name: item.name, status: item.status, createdAt: item.created_at, ...dataOf(item) })),
    scorecards: scorecards.map((item) => ({ id: item.id, name: item.name, status: item.status, score: numeric(item.amount), createdAt: item.created_at, ...dataOf(item) })),
  };
}

export async function getMicrofinanceCreditScoringSettings(req: CreateExpressContextOptions["req"]) {
  const actor = await profile(req); requirePermission(actor, CREDIT_ROLES, "view credit scoring configuration");
  const existing = await rows("mfi_credit_scoring_settings", actor.company_id, 1);
  return { settings: { id: existing[0]?.id || null, ...scoringRulesFromRow(existing[0]) }, canManage: can(actor, new Set()) };
}

export async function saveMicrofinanceCreditScoringSettings(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceCreditScoringSettingsInput>) {
  const actor = await profile(req); requirePermission(actor, new Set(), "manage credit scoring configuration");
  const totalWeight = input.kycWeight + input.affordabilityWeight + input.repaymentHistoryWeight + input.guarantorWeight + input.collateralWeight;
  if (totalWeight !== 100) throw new TRPCError({ code: "BAD_REQUEST", message: "Credit-scoring weights must total exactly 100 points." });
  if (input.reviewThreshold >= input.approvalThreshold) throw new TRPCError({ code: "BAD_REQUEST", message: "The manual-review threshold must be below the approval threshold." });
  const existing = await rows("mfi_credit_scoring_settings", actor.company_id, 1);
  const data = { ...input, updatedAt: new Date().toISOString(), updatedById: actor.id, updatedByName: actor.full_name || "Microfinance administrator" };
  const saved = existing[0] ? await patch("mfi_credit_scoring_settings", actor.company_id, existing[0].id, { status: "Configured", data }) : await insert("mfi_credit_scoring_settings", { company_id: actor.company_id, name: "Credit scoring configuration", status: "Configured", amount: null, notes: null, data });
  await audit(actor.company_id, actor, "Credit scoring configuration saved", "credit_scoring_settings", saved.id, { approvalThreshold: input.approvalThreshold, reviewThreshold: input.reviewThreshold });
  return { settings: { id: saved.id, ...input } };
}

export async function getMicrofinanceEscalationSettingsByTaskUid(taskUid: string) {
  if (!taskUid.trim()) return null;
  const items = await request<Row[]>("mfi_par_escalation_settings", new URLSearchParams({ select: "id,company_id,name,status,amount,notes,data,created_at,updated_at", "data->>scheduleCronTaskUid": `eq.${taskUid}`, limit: "1" }));
  const settings = escalationSettingsFromRow(items[0]);
  return settings.deliveryEnabled && settings.scheduleCronTaskUid === taskUid ? settings : null;
}

export async function resolveMicrofinanceEscalationRecipients(companyId: string, settings: Pick<ReturnType<typeof escalationSettingsFromRow>, "recipientMode" | "managedRecipients" | "roleRecipients">) {
  const recipients = new Set<string>();
  if (settings.recipientMode === "managed" || settings.recipientMode === "both") normalizedRecipients(settings.managedRecipients).forEach((email) => recipients.add(email));
  if (settings.recipientMode === "roles" || settings.recipientMode === "both") {
    const permitted = new Set(settings.roleRecipients.map(normalizedRole));
    const profiles = await request<Array<{ email?: string | null; role?: string | null; is_active?: boolean | null }>>("profiles", new URLSearchParams({ select: "email,role,is_active", company_id: `eq.${companyId}`, is_active: "eq.true", email: "not.is.null", limit: "200" }));
    profiles.forEach((item) => { const email = item.email?.trim().toLowerCase(); if (email && permitted.has(normalizedRole(String(item.role || ""))) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) recipients.add(email); });
  }
  return Array.from(recipients).sort();
}

export async function getMicrofinanceParCollectionsSummaryForCompany(companyId: string) {
  const [loans, schedules, collections] = await Promise.all([rows("mfi_loans", companyId, 500), rows("mfi_repayment_schedules", companyId, 2_000), rows("mfi_collections", companyId, 500)]);
  const activeLoans = loans.filter((item) => ["Active", "Overdue"].includes(item.status || "")); const portfolioOutstanding = activeLoans.reduce((sum, item) => sum + numeric(dataOf(item).outstanding), 0);
  const overdue = schedules.filter((item) => calculateMicrofinanceOverdueDays(String(dataOf(item).dueDate || ""), numeric(dataOf(item).outstanding)) > 0);
  const par30 = overdue.filter((item) => calculateMicrofinanceOverdueDays(String(dataOf(item).dueDate || ""), numeric(dataOf(item).outstanding)) >= 30);
  return { generatedAt: new Date().toISOString(), totals: { activeLoans: activeLoans.length, portfolioOutstanding, overdueAmount: overdue.reduce((sum, item) => sum + numeric(dataOf(item).outstanding), 0), par30Amount: par30.reduce((sum, item) => sum + numeric(dataOf(item).outstanding), 0), par30Ratio: portfolioOutstanding ? Number((par30.reduce((sum, item) => sum + numeric(dataOf(item).outstanding), 0) / portfolioOutstanding * 100).toFixed(2)) : 0, overdueInstallments: overdue.length, openCollectionActions: collections.filter((item) => item.status === "Open").length } };
}

export async function getMicrofinanceEscalationSettings(req: CreateExpressContextOptions["req"]) {
  const actor = await profile(req); requirePermission(actor, CREDIT_ROLES, "view portfolio escalation configuration");
  const existing = await rows("mfi_par_escalation_settings", actor.company_id, 1); const settings = escalationSettingsFromRow(existing[0]);
  return { settings, canManage: can(actor, new Set()) };
}

export async function saveMicrofinanceEscalationSettings(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceEscalationSettingsInput>, options: { userSession?: string } = {}) {
  const actor = await profile(req); requirePermission(actor, new Set(), "manage portfolio escalation configuration");
  const existing = await rows("mfi_par_escalation_settings", actor.company_id, 1); const prior = escalationSettingsFromRow(existing[0]); let scheduleCronTaskUid = prior.scheduleCronTaskUid;
  const [hour, minute] = input.scheduleLocalTime.split(":").map(Number); const cron = `0 ${minute} ${(hour + 21) % 24} * * *`;
  if (input.deliveryEnabled && !scheduleCronTaskUid) {
    if (!options.userSession) throw new TRPCError({ code: "UNAUTHORIZED", message: "An authenticated workspace session is required to activate daily portfolio escalation delivery." });
    const job = await createHeartbeatJob({ name: `microfinance-par-escalation-${actor.company_id}`, cron, path: "/api/scheduled/microfinanceParCollectionsEscalation", description: `Daily ${input.scheduleLocalTime} ${ESCALATION_TIMEZONE} PAR and collections escalation` }, options.userSession); scheduleCronTaskUid = job.taskUid;
  } else if (!input.deliveryEnabled && scheduleCronTaskUid) {
    if (!options.userSession) throw new TRPCError({ code: "UNAUTHORIZED", message: "An authenticated workspace session is required to deactivate daily portfolio escalation delivery." });
    await deleteHeartbeatJob(scheduleCronTaskUid, options.userSession); scheduleCronTaskUid = null;
  }
  const data = { recipientMode: input.recipientMode, roleRecipients: Array.from(new Set(input.roleRecipients)), managedRecipients: normalizedRecipients(input.managedRecipients), scheduleLocalTime: input.scheduleLocalTime, timezone: ESCALATION_TIMEZONE, par30AlertThreshold: input.par30AlertThreshold, overdueAmountAlertThreshold: input.overdueAmountAlertThreshold, deliveryEnabled: Boolean(input.deliveryEnabled && scheduleCronTaskUid), scheduleCronTaskUid, updatedAt: new Date().toISOString(), updatedById: actor.id, updatedByName: actor.full_name || "Microfinance administrator" };
  const saved = existing[0] ? await patch("mfi_par_escalation_settings", actor.company_id, existing[0].id, { status: data.deliveryEnabled ? "Configured — active" : "Configured — inactive", data }) : await insert("mfi_par_escalation_settings", { company_id: actor.company_id, name: "Daily PAR and collections escalation configuration", status: data.deliveryEnabled ? "Configured — active" : "Configured — inactive", amount: null, notes: null, data });
  await audit(actor.company_id, actor, "Portfolio escalation configuration saved", "par_escalation_settings", saved.id, { deliveryEnabled: data.deliveryEnabled, scheduleLocalTime: input.scheduleLocalTime });
  return { message: data.deliveryEnabled ? `Daily PAR and collections escalation is active at ${input.scheduleLocalTime} ${ESCALATION_TIMEZONE}.` : "Escalation configuration saved. Daily delivery remains inactive until an explicit activation is confirmed.", settings: escalationSettingsFromRow(saved) };
}

export async function listMicrofinanceEscalationHistory(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceListInput>) {
  const actor = await profile(req); requirePermission(actor, CREDIT_ROLES, "view portfolio escalation delivery history"); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Escalation delivery history is temporarily unavailable." });
  const items = await db.select({ createdAt: webhookDeliveries.createdAt, status: webhookDeliveries.status, severity: webhookDeliveries.severity, responseCode: webhookDeliveries.responseCode, eventSummary: webhookDeliveries.eventSummary }).from(webhookDeliveries).where(and(eq(webhookDeliveries.companyId, actor.company_id), eq(webhookDeliveries.action, ESCALATION_ACTION))).orderBy(desc(webhookDeliveries.createdAt)).limit(input.limit);
  return { rows: items.map((item) => { let summary: Record<string, unknown> = {}; try { summary = item.eventSummary ? JSON.parse(item.eventSummary) as Record<string, unknown> : {}; } catch { /* privacy-safe empty fallback */ } return { createdAt: item.createdAt.toISOString(), status: item.status, severity: item.severity, responseCode: item.responseCode, date: typeof summary.date === "string" ? summary.date : null, par30Ratio: typeof summary.par30Ratio === "number" ? summary.par30Ratio : 0, overdueAmount: typeof summary.overdueAmount === "number" ? summary.overdueAmount : 0, openCollectionActions: typeof summary.openCollectionActions === "number" ? summary.openCollectionActions : 0, recipientCount: typeof summary.recipientCount === "number" ? summary.recipientCount : 0, successCount: typeof summary.successCount === "number" ? summary.successCount : 0, failedCount: typeof summary.failedCount === "number" ? summary.failedCount : 0 }; }) };
}

export async function createMicrofinanceBorrower(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceBorrowerInput>) {
  const actor = await profile(req); requirePermission(actor, CREDIT_ROLES, "register borrowers");
  const duplicate = await request<Row[]>("mfi_clients", new URLSearchParams({ select: "id", company_id: `eq.${actor.company_id}`, "data->>nationalId": `eq.${input.nationalId}`, limit: "1" }));
  if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "A borrower with this national ID already exists in this tenant." });
  const name = `${input.firstName} ${input.lastName}`;
  const inserted = await insert("mfi_clients", { company_id: actor.company_id, name, status: "Active", amount: null, notes: null, data: { ...input, registeredAt: new Date().toISOString(), registeredById: actor.id, registeredByName: actor.full_name || "Microfinance staff" } });
  await audit(actor.company_id, actor, "Borrower registered", "borrower", inserted.id, { kycStatus: input.kycStatus });
  return displayBorrower(inserted);
}

export async function createMicrofinanceGroup(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceGroupInput>) {
  const actor = await profile(req); requirePermission(actor, CREDIT_ROLES, "manage borrower groups");
  const inserted = await insert("mfi_groups", { company_id: actor.company_id, name: input.name, status: "Active", amount: null, notes: null, data: { ...input, memberCount: 0, createdById: actor.id } });
  await audit(actor.company_id, actor, "Borrower group created", "group", inserted.id); return { id: inserted.id, name: inserted.name, status: inserted.status };
}

export async function createMicrofinanceProduct(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceProductInput>) {
  const actor = await profile(req); requirePermission(actor, new Set(), "manage loan products");
  if (input.maximumPrincipal < input.minimumPrincipal || input.termMaxMonths < input.termMinMonths) throw new TRPCError({ code: "BAD_REQUEST", message: "Loan product maximums must be at least their corresponding minimums." });
  const inserted = await insert("mfi_loan_products", { company_id: actor.company_id, name: input.name, status: "Active", amount: input.maximumPrincipal, notes: null, data: { ...input, createdById: actor.id } });
  await audit(actor.company_id, actor, "Loan product created", "loan_product", inserted.id, { code: input.code }); return { id: inserted.id, name: inserted.name, status: inserted.status, ...dataOf(inserted) };
}

export async function createMicrofinanceGuarantor(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceGuarantorInput>) {
  const actor = await profile(req); requirePermission(actor, CREDIT_ROLES, "record guarantors");
  if (!await row("mfi_clients", actor.company_id, input.borrowerId)) throw new TRPCError({ code: "NOT_FOUND", message: "The borrower is unavailable." });
  const inserted = await insert("mfi_guarantors", { company_id: actor.company_id, name: input.fullName, status: "Pending verification", amount: input.guaranteedAmount, notes: null, data: { ...input, recordedById: actor.id } });
  await audit(actor.company_id, actor, "Guarantor recorded", "guarantor", inserted.id, { borrowerId: input.borrowerId }); return { id: inserted.id, status: inserted.status };
}

export async function createMicrofinanceCollateral(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceCollateralInput>) {
  const actor = await profile(req); requirePermission(actor, CREDIT_ROLES, "record collateral");
  if (!await row("mfi_clients", actor.company_id, input.borrowerId)) throw new TRPCError({ code: "NOT_FOUND", message: "The borrower is unavailable." });
  const inserted = await insert("mfi_collateral", { company_id: actor.company_id, name: input.description, status: "Pledged", amount: input.estimatedValue, notes: null, data: { ...input, recordedById: actor.id } });
  await audit(actor.company_id, actor, "Collateral recorded", "collateral", inserted.id, { borrowerId: input.borrowerId }); return { id: inserted.id, status: inserted.status };
}

export async function submitMicrofinanceApplication(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceApplicationInput>) {
  const actor = await profile(req); requirePermission(actor, CREDIT_ROLES, "submit loan applications");
  const [borrower, product] = await Promise.all([row("mfi_clients", actor.company_id, input.borrowerId), row("mfi_loan_products", actor.company_id, input.productId)]);
  if (!borrower || !product || product.status !== "Active") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Choose an active borrower and loan product." });
  const productData = dataOf(product);
  if (input.principal < numeric(productData.minimumPrincipal) || input.principal > numeric(productData.maximumPrincipal) || input.termMonths < numeric(productData.termMinMonths) || input.termMonths > numeric(productData.termMaxMonths)) throw new TRPCError({ code: "BAD_REQUEST", message: "The requested amount or term is outside this product's approved limits." });
  const guarantors = input.guarantorIds.length ? await Promise.all(input.guarantorIds.map((id) => row("mfi_guarantors", actor.company_id, id))) : [];
  const collateral = input.collateralIds.length ? await Promise.all(input.collateralIds.map((id) => row("mfi_collateral", actor.company_id, id))) : [];
  if ((productData.requiresGuarantor === true && guarantors.some(Boolean) === false) || (productData.requiresCollateral === true && collateral.some(Boolean) === false)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This product requires the configured guarantor or collateral evidence." });
  const [scoringSettingsRows, historicalSchedules] = await Promise.all([
    rows("mfi_credit_scoring_settings", actor.company_id, 1),
    request<Row[]>("mfi_repayment_schedules", new URLSearchParams({ select: "id,company_id,name,status,amount,notes,data,created_at,updated_at", company_id: `eq.${actor.company_id}`, "data->>borrowerId": `eq.${borrower.id}`, limit: "500" })),
  ]);
  const terms = calculateMicrofinanceRepaymentTerms(input.principal, productData, input.termMonths, input.repaymentFrequency);
  const rules = scoringRulesFromRow(scoringSettingsRows[0]);
  const scorecard = calculateMicrofinanceCreditScore({
    rules, kycStatus: String(dataOf(borrower).kycStatus || "Pending"), monthlyIncome: numeric(dataOf(borrower).monthlyIncome), projectedInstallment: terms.installment + (terms.remainder ? 1 : 0),
    hasRepaymentHistory: historicalSchedules.length > 0, hasOverdueHistory: historicalSchedules.some((item) => calculateMicrofinanceOverdueDays(String(dataOf(item).dueDate || ""), numeric(dataOf(item).outstanding)) > 0),
    requiresGuarantor: productData.requiresGuarantor === true, guarantorVerified: guarantors.some((item) => item?.status === "Verified"), requiresCollateral: productData.requiresCollateral === true, collateralVerified: collateral.some((item) => item?.status === "Verified"),
  });
  const inserted = await insert("mfi_loan_applications", { company_id: actor.company_id, name: `Application · ${borrower.name || "Borrower"}`, status: "Submitted", amount: input.principal, notes: null, data: { ...input, borrowerName: borrower.name || "Borrower", productName: product.name || "Loan product", submittedAt: new Date().toISOString(), submittedById: actor.id, kycStatus: dataOf(borrower).kycStatus, creditScore: scorecard.score, creditRecommendation: scorecard.recommendation } });
  const scorecardRow = await insert("mfi_credit_scorecards", { company_id: actor.company_id, name: `Scorecard · ${borrower.name || "Borrower"}`, status: scorecard.recommendation, amount: scorecard.score, notes: null, data: { applicationId: inserted.id, borrowerId: borrower.id, borrowerName: borrower.name || "Borrower", productId: product.id, projectedInstallment: terms.installment, rules, ...scorecard, evaluatedAt: new Date().toISOString(), evaluatedById: actor.id } });
  await patch("mfi_loan_applications", actor.company_id, inserted.id, { data: { ...dataOf(inserted), scorecardId: scorecardRow.id } });
  await notify(actor.company_id, "Loan application awaiting credit decision", scorecard.recommendation === "Decline recommended" ? "Warning" : "Info", { applicationId: inserted.id, borrowerId: borrower.id, score: scorecard.score, recommendation: scorecard.recommendation }); await audit(actor.company_id, actor, "Loan application submitted", "application", inserted.id, { borrowerId: borrower.id, score: scorecard.score, recommendation: scorecard.recommendation });
  return { id: inserted.id, status: inserted.status, scorecard: { id: scorecardRow.id, score: scorecard.score, recommendation: scorecard.recommendation } };
}

export async function decideMicrofinanceApplication(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceDecisionInput>) {
  const actor = await profile(req); requirePermission(actor, new Set(), "approve or reject applications");
  const application = await row("mfi_loan_applications", actor.company_id, input.applicationId);
  if (!application || application.status !== "Submitted") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only submitted applications can receive a credit decision." });
  const data = dataOf(application); const approvedAmount = input.decision === "Approved" ? input.approvedAmount : 0;
  if (input.decision === "Approved" && (!approvedAmount || approvedAmount > numeric(application.amount))) throw new TRPCError({ code: "BAD_REQUEST", message: "Approved amount must be positive and cannot exceed the requested amount." });
  const status = input.decision === "Approved" ? "Approved" : "Rejected";
  const updated = await patch("mfi_loan_applications", actor.company_id, application.id, { status, data: { ...data, approvedAmount, decisionNote: input.decisionNote || null, decidedAt: new Date().toISOString(), decidedById: actor.id, decidedByName: actor.full_name || "Credit approver" } });
  await notify(actor.company_id, `Loan application ${status.toLowerCase()}`, input.decision === "Rejected" ? "Warning" : "Info", { applicationId: updated.id, borrowerId: data.borrowerId }); await audit(actor.company_id, actor, `Loan application ${status.toLowerCase()}`, "application", updated.id, { approvedAmount });
  return { id: updated.id, status: updated.status, approvedAmount };
}

export async function disburseMicrofinanceLoan(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceDisbursementInput>) {
  const actor = await profile(req); requirePermission(actor, TELLER_ROLES, "disburse loans");
  const application = await row("mfi_loan_applications", actor.company_id, input.applicationId);
  if (!application || application.status !== "Approved") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only approved applications can be disbursed." });
  const app = dataOf(application); const product = await row("mfi_loan_products", actor.company_id, String(app.productId || ""));
  if (!product || product.status !== "Active") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The approved loan product is no longer active." });
  if (input.paymentMethod === "cash") { if (!input.cashSessionId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "An open cash session is required for cash disbursement." }); const session = await row("mfi_cash_sessions", actor.company_id, input.cashSessionId); if (!session || session.status !== "Open") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The selected cash session is not open." }); }
  const principal = numeric(app.approvedAmount); const terms = calculateMicrofinanceRepaymentTerms(principal, dataOf(product), numeric(app.termMonths), app.repaymentFrequency as z.infer<typeof loanFrequency>);
  const loanNumber = `MFI-${input.disbursedOn.replaceAll("-", "")}-${application.id.slice(0, 6).toUpperCase()}`;
  const productData = dataOf(product); const loan = await insert("mfi_loans", { company_id: actor.company_id, name: loanNumber, status: "Active", amount: principal, notes: null, data: { loanNumber, applicationId: application.id, borrowerId: app.borrowerId, borrowerName: app.borrowerName, productId: product.id, productName: product.name, termMonths: app.termMonths, repaymentFrequency: app.repaymentFrequency, disbursedOn: input.disbursedOn, paymentMethod: input.paymentMethod, provider: input.provider || null, providerReference: input.providerReference || null, mobileMoneyState: input.paymentMethod === "mobile_money" ? "Manual confirmation recorded — provider connection not configured" : "Not applicable", outstanding: terms.totalDue, collectorCommissionRate: numeric(productData.collectorCommissionRate), penaltyRateMonthly: numeric(productData.penaltyRateMonthly), ...terms } });
  const dates = scheduleDates(input.disbursedOn, terms.periods, app.repaymentFrequency as z.infer<typeof loanFrequency>);
  for (let index = 0; index < terms.periods; index += 1) { const scheduledAmount = terms.installment + (index === terms.periods - 1 ? terms.remainder : 0); await insert("mfi_repayment_schedules", { company_id: actor.company_id, name: `${loanNumber} · installment ${index + 1}`, status: "Due", amount: scheduledAmount, notes: null, data: { loanId: loan.id, loanNumber, borrowerId: app.borrowerId, borrowerName: app.borrowerName, installmentNumber: index + 1, dueDate: dates[index], scheduledAmount, paidAmount: 0, outstanding: scheduledAmount, penaltyRateMonthly: numeric(productData.penaltyRateMonthly) } }); }
  await insert("mfi_cash_transactions", { company_id: actor.company_id, name: `Loan disbursement · ${loanNumber}`, status: "Posted", amount: principal, notes: null, data: { direction: "Outflow", cashSessionId: input.cashSessionId, loanId: loan.id, applicationId: application.id, paymentMethod: input.paymentMethod, provider: input.provider || null, providerReference: input.providerReference || null, transactedOn: input.disbursedOn } });
  await patch("mfi_loan_applications", actor.company_id, application.id, { status: "Disbursed", data: { ...app, loanId: loan.id, disbursedAt: new Date().toISOString(), disbursedById: actor.id } });
  await notify(actor.company_id, "Loan disbursed and repayment schedule created", "Info", { loanId: loan.id, borrowerId: app.borrowerId }); await audit(actor.company_id, actor, "Loan disbursed", "loan", loan.id, { applicationId: application.id, principal, paymentMethod: input.paymentMethod });
  return displayLoan(loan);
}

export async function recordMicrofinanceRepayment(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceRepaymentInput>) {
  const actor = await profile(req); requirePermission(actor, REPAYMENT_RECORDING_ROLES, "record repayments");
  const loan = await row("mfi_loans", actor.company_id, input.loanId); if (!loan || !["Active", "Overdue"].includes(loan.status || "")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This loan is not available for repayment." });
  const key = input.idempotencyKey || crypto.randomUUID();
  const existing = await request<Row[]>("mfi_repayments", new URLSearchParams({ select: "id,company_id,name,status,amount,notes,data,created_at,updated_at", company_id: `eq.${actor.company_id}`, "data->>idempotencyKey": `eq.${key}`, limit: "1" }));
  if (existing[0]) return { id: existing[0].id, status: "Already recorded", receiptNumber: dataOf(existing[0]).receiptNumber };
  if (input.paymentMethod === "cash") { if (!input.cashSessionId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "An open cash session is required for cash repayment." }); const session = await row("mfi_cash_sessions", actor.company_id, input.cashSessionId); if (!session || session.status !== "Open") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The selected cash session is not open." }); }
  let remaining = input.amount; const schedules = (await request<Row[]>("mfi_repayment_schedules", new URLSearchParams({ select: "id,company_id,name,status,amount,notes,data,created_at,updated_at", company_id: `eq.${actor.company_id}`, "data->>loanId": `eq.${loan.id}`, order: "created_at.asc", limit: "500" }))).sort((a, b) => String(dataOf(a).dueDate).localeCompare(String(dataOf(b).dueDate)));
  const allocations: Array<{ scheduleId: string; amount: number }> = [];
  for (const schedule of schedules) { const scheduleData = dataOf(schedule); const outstanding = numeric(scheduleData.outstanding); if (remaining <= 0 || outstanding <= 0) continue; const allocated = Math.min(remaining, outstanding); const nextOutstanding = roundTzs(outstanding - allocated); const nextPaid = roundTzs(numeric(scheduleData.paidAmount) + allocated); const nextStatus = nextOutstanding <= 0 ? "Paid" : nextPaid > 0 ? "Partial" : "Due"; await patch("mfi_repayment_schedules", actor.company_id, schedule.id, { status: nextStatus, data: { ...scheduleData, paidAmount: nextPaid, outstanding: nextOutstanding, lastPaymentOn: input.receivedOn } }); allocations.push({ scheduleId: schedule.id, amount: allocated }); remaining = roundTzs(remaining - allocated); }
  if (remaining > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "The repayment exceeds the outstanding scheduled balance." });
  const loanData = dataOf(loan); const outstanding = roundTzs(numeric(loanData.outstanding) - input.amount); const status = outstanding <= 0 ? "Closed" : "Active"; const receiptNumber = `RCT-${input.receivedOn.replaceAll("-", "")}-${loan.id.slice(0, 6).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  const repayment = await insert("mfi_repayments", { company_id: actor.company_id, name: receiptNumber, status: "Posted", amount: input.amount, notes: null, data: { loanId: loan.id, loanNumber: loanData.loanNumber, borrowerId: loanData.borrowerId, borrowerName: loanData.borrowerName, receiptNumber, receivedOn: input.receivedOn, paymentMethod: input.paymentMethod, provider: input.provider || null, providerReference: input.providerReference || null, cashSessionId: input.cashSessionId, idempotencyKey: key, allocations } });
  await patch("mfi_loans", actor.company_id, loan.id, { status, data: { ...loanData, outstanding, lastRepaymentOn: input.receivedOn } });
  await insert("mfi_cash_transactions", { company_id: actor.company_id, name: `Loan repayment · ${receiptNumber}`, status: "Posted", amount: input.amount, notes: null, data: { direction: "Inflow", cashSessionId: input.cashSessionId, repaymentId: repayment.id, loanId: loan.id, paymentMethod: input.paymentMethod, provider: input.provider || null, providerReference: input.providerReference || null, transactedOn: input.receivedOn } });
  const commissionRate = numeric(loanData.collectorCommissionRate); if (commissionRate > 0) await insert("mfi_staff_commissions", { company_id: actor.company_id, name: `Collection commission · ${receiptNumber}`, status: "Accrued", amount: roundTzs(input.amount * commissionRate / 100), notes: null, data: { repaymentId: repayment.id, staffId: actor.id, staffName: actor.full_name || "Collection staff", rate: commissionRate, basisAmount: input.amount } });
  await audit(actor.company_id, actor, "Loan repayment recorded", "repayment", repayment.id, { loanId: loan.id, amount: input.amount, receiptNumber }); if (status === "Closed") await notify(actor.company_id, "Loan fully repaid", "Info", { loanId: loan.id, borrowerId: loanData.borrowerId });
  return { id: repayment.id, status, receiptNumber, outstanding };
}

export async function recordMicrofinanceSavings(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceSavingsInput>) {
  const actor = await profile(req); requirePermission(actor, TELLER_ROLES, "record savings transactions");
  const borrower = await row("mfi_clients", actor.company_id, input.borrowerId); if (!borrower || borrower.status !== "Active") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only active borrowers can transact savings." });
  const historical = await request<Row[]>("mfi_savings", new URLSearchParams({ select: "id,company_id,name,status,amount,notes,data,created_at,updated_at", company_id: `eq.${actor.company_id}`, "data->>borrowerId": `eq.${borrower.id}`, limit: "500" }));
  const balance = historical.reduce((sum, item) => sum + (item.status === "Deposit" ? numeric(item.amount) : -numeric(item.amount)), 0);
  if (input.transactionType === "Withdrawal" && input.amount > balance) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Withdrawal exceeds the borrower’s confirmed savings balance." });
  const transaction = await insert("mfi_savings", { company_id: actor.company_id, name: `${input.transactionType} · ${borrower.name || "Borrower"}`, status: input.transactionType, amount: input.amount, notes: input.note || null, data: { borrowerId: borrower.id, borrowerName: borrower.name, transactedOn: input.transactedOn, paymentMethod: input.paymentMethod, providerReference: input.providerReference || null, cashSessionId: input.cashSessionId, recordedById: actor.id } });
  await insert("mfi_cash_transactions", { company_id: actor.company_id, name: `Savings ${input.transactionType.toLowerCase()} · ${transaction.id.slice(0, 8)}`, status: "Posted", amount: input.amount, notes: input.note || null, data: { direction: input.transactionType === "Deposit" ? "Inflow" : "Outflow", cashSessionId: input.cashSessionId, savingsTransactionId: transaction.id, paymentMethod: input.paymentMethod, providerReference: input.providerReference || null, transactedOn: input.transactedOn } });
  await audit(actor.company_id, actor, `Savings ${input.transactionType.toLowerCase()} recorded`, "savings", transaction.id, { borrowerId: borrower.id, amount: input.amount }); return { id: transaction.id, balance: input.transactionType === "Deposit" ? balance + input.amount : balance - input.amount };
}

export async function openMicrofinanceCashSession(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceCashOpenInput>) {
  const actor = await profile(req); requirePermission(actor, TELLER_ROLES, "open cash sessions");
  const active = await request<Row[]>("mfi_cash_sessions", new URLSearchParams({ select: "id", company_id: `eq.${actor.company_id}`, status: "eq.Open", "data->>tellerId": `eq.${actor.id}`, limit: "1" })); if (active.length) throw new TRPCError({ code: "CONFLICT", message: "This staff member already has an open cash session." });
  const inserted = await insert("mfi_cash_sessions", { company_id: actor.company_id, name: `Cash session · ${input.openedOn}`, status: "Open", amount: input.openingBalance, notes: input.note || null, data: { tellerId: actor.id, tellerName: actor.full_name || "Teller", openedOn: input.openedOn, openingBalance: input.openingBalance } }); await audit(actor.company_id, actor, "Cash session opened", "cash_session", inserted.id, { openingBalance: input.openingBalance }); return { id: inserted.id, status: inserted.status };
}

export async function closeMicrofinanceCashSession(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceCashCloseInput>) {
  const actor = await profile(req); requirePermission(actor, TELLER_ROLES, "close cash sessions"); const session = await row("mfi_cash_sessions", actor.company_id, input.cashSessionId); if (!session || session.status !== "Open") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only an open cash session can be closed." });
  const movements = await request<Row[]>("mfi_cash_transactions", new URLSearchParams({ select: "id,company_id,name,status,amount,notes,data,created_at,updated_at", company_id: `eq.${actor.company_id}`, "data->>cashSessionId": `eq.${session.id}`, limit: "1_000" })); const expectedBalance = numeric(dataOf(session).openingBalance) + movements.reduce((sum, item) => sum + (dataOf(item).direction === "Inflow" ? numeric(item.amount) : -numeric(item.amount)), 0); const variance = roundTzs(input.closingBalance - expectedBalance);
  const updated = await patch("mfi_cash_sessions", actor.company_id, session.id, { status: "Closed", notes: input.note || null, data: { ...dataOf(session), closedAt: new Date().toISOString(), closedById: actor.id, closingBalance: input.closingBalance, expectedBalance, variance } }); await audit(actor.company_id, actor, "Cash session closed", "cash_session", updated.id, { expectedBalance, closingBalance: input.closingBalance, variance }); if (variance !== 0) await notify(actor.company_id, "Cash-session variance requires review", "Warning", { cashSessionId: updated.id, variance }); return { id: updated.id, status: updated.status, expectedBalance, variance };
}

export async function createMicrofinanceCollection(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceCollectionInput>) {
  const actor = await profile(req); requirePermission(actor, COLLECTION_ROLES, "manage collections"); const loan = await row("mfi_loans", actor.company_id, input.loanId); if (!loan || !["Active", "Overdue"].includes(loan.status || "")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Choose an active or overdue loan for collection work." }); const loanData = dataOf(loan);
  const inserted = await insert("mfi_collections", { company_id: actor.company_id, name: `${input.action} · ${loanData.loanNumber || loan.id.slice(0, 8)}`, status: "Open", amount: numeric(loanData.outstanding), notes: input.note || null, data: { loanId: loan.id, borrowerId: loanData.borrowerId, borrowerName: loanData.borrowerName, action: input.action, dueOn: input.dueOn, assignedToId: actor.id, assignedToName: actor.full_name || "Collections staff" } }); await audit(actor.company_id, actor, "Collection action created", "collection", inserted.id, { loanId: loan.id, action: input.action }); return { id: inserted.id, status: inserted.status };
}

export async function listMicrofinanceAudit(req: CreateExpressContextOptions["req"], input: z.infer<typeof microfinanceListInput>) { const actor = await profile(req); requirePermission(actor, AUDIT_ROLES, "view microfinance audit history"); const items = await rows("mfi_audit_logs", actor.company_id, input.limit); return { rows: items.map((item) => ({ id: item.id, action: item.name, createdAt: item.created_at, ...dataOf(item) })) }; }
