import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { resolveVerifiedProfile } from "./aiApprovals";
import { z } from "zod";

export type BankRequest = CreateExpressContextOptions["req"];

type BankSnapshot = {
  companyId: string;
  viewer: { id: string; name: string | null; role: string };
  institution: unknown[];
  branches: unknown[];
  accountTypes: unknown[];
  loanProducts: unknown[];
  customers: unknown[];
  customerDocuments: unknown[];
  beneficialOwners: unknown[];
  accounts: unknown[];
  beneficiaries: unknown[];
  transactions: unknown[];
  tellers: unknown[];
  cashMovements: unknown[];
  agents: unknown[];
  wallets: unknown[];
  paymentInstructions: unknown[];
  applications: unknown[];
  approvals: unknown[];
  guarantors: unknown[];
  collateral: unknown[];
  loans: unknown[];
  schedules: unknown[];
  repayments: unknown[];
  groups: unknown[];
  groupMembers: unknown[];
  shares: unknown[];
  standingOrders: unknown[];
  reconciliations: unknown[];
  amlAlerts: unknown[];
  notifications: unknown[];
  errors: Array<{ resource: string; message: string }>;
};

async function supabaseRequest(path: string, token: string, init: RequestInit = {}) {
  const { ENV } = await import("./_core/env");
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Supabase banking persistence is not configured." });
  }
  const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ENV.supabaseAnonKey,
      authorization: `Bearer ${token}`,
      accept: "application/json",
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new TRPCError({ code: response.status === 401 ? "UNAUTHORIZED" : response.status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: body?.message || body?.hint || "The banking operation could not be completed." });
  }
  return body;
}

async function readRows(token: string, resource: string, select: string, order?: string) {
  const params = new URLSearchParams({ select, limit: "100" });
  if (order) params.set("order", order);
  try {
    const rows = await supabaseRequest(`${resource}?${params.toString()}`, token);
    return { rows: Array.isArray(rows) ? rows : [], error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : `Unable to read ${resource}.` };
  }
}

async function callRpc<T = unknown>(token: string, name: string, args: Record<string, unknown>): Promise<T> {
  return await supabaseRequest(`rpc/${name}`, token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(args) }) as T;
}

export async function listBankMfiSnapshot(req: BankRequest): Promise<BankSnapshot> {
  const { profile, token } = await resolveVerifiedProfile(req);
  const resources: Array<[keyof BankSnapshot, string, string, string | undefined]> = [
    ["institution", "bank_institutions", "id,legal_name,trading_name,institution_type,licence_number,licence_status,country_code,currency,currency_exponent,timezone,fiscal_year_start_month,data,created_at,updated_at", "created_at.desc"],
    ["branches", "bank_branches", "id,code,name,region,district,address,phone,status,institution_id,created_at,updated_at", "name.asc"],
    ["accountTypes", "bank_account_types", "id,code,name,product_kind,currency,minimum_opening_balance,minimum_operating_balance,annual_interest_rate,withdrawal_fee,status,data", "name.asc"],
    ["loanProducts", "bank_loan_products", "id,code,name,product_kind,currency,minimum_amount,maximum_amount,minimum_term_months,maximum_term_months,annual_interest_rate,interest_method,processing_fee_rate,late_penalty_rate,collateral_required,guarantors_required,approval_threshold,status,data", "name.asc"],
    ["customers", "bank_customers", "id,customer_number,customer_kind,full_name,phone,email,date_of_birth,gender,occupation,address,national_id,tin,risk_rating,pep_status,source_of_funds,relationship_purpose,kyc_status,kyc_verified_at,kyc_expires_at,status,branch_id,created_at,updated_at", "created_at.desc"],
    ["customerDocuments", "bank_customer_documents", "id,customer_id,document_type,document_number,file_url,issued_at,expires_at,verification_status,verified_at,created_at,updated_at", "created_at.desc"],
    ["beneficialOwners", "bank_beneficial_owners", "id,customer_id,full_name,national_id,ownership_percent,verification_status,created_at,updated_at", "created_at.desc"],
    ["accounts", "bank_accounts", "id,account_number,customer_id,account_type_id,branch_id,currency,ledger_balance,available_balance,hold_amount,status,opened_at,closed_at,version,created_at,updated_at", "created_at.desc"],
    ["beneficiaries", "bank_account_beneficiaries", "id,customer_id,account_id,beneficiary_name,beneficiary_account_number,bank_name,phone,status,verified_at,created_at,updated_at", "created_at.desc"],
    ["transactions", "bank_transactions", "id,transaction_number,transaction_type,channel,source_account_id,destination_account_id,customer_id,amount,fee_amount,currency,status,idempotency_key,provider,provider_reference,narration,journal_batch_id,teller_id,posted_at,reversed_transaction_id,created_at,updated_at", "posted_at.desc"],
    ["tellers", "bank_tellers", "id,profile_id,branch_id,teller_code,name,status,opening_balance,closing_balance,opened_at,closed_at,version,data,created_at,updated_at", "name.asc"],
    ["cashMovements", "bank_cash_movements", "id,teller_id,branch_id,movement_type,amount,currency,status,transaction_id,approved_by,approved_at,idempotency_key,narration,created_by,created_at", "created_at.desc"],
    ["agents", "bank_agents", "id,agent_code,name,phone,national_id,branch_id,status,float_balance,commission_rate,data,created_at,updated_at", "name.asc"],
    ["wallets", "bank_wallets", "id,wallet_number,customer_id,provider,msisdn,balance,status,provider_customer_ref,data,created_at,updated_at", "created_at.desc"],
    ["paymentInstructions", "bank_payment_instructions", "id,instruction_number,payment_type,channel,source_account_id,destination_account_id,amount,currency,provider,msisdn,provider_reference,status,requested_at,confirmed_at,failure_reason,idempotency_key,data", "requested_at.desc"],
    ["applications", "bank_loan_applications", "id,application_number,customer_id,product_id,amount,term_months,purpose,status,credit_score,score_inputs,submitted_by,submitted_at,decision_by,decision_at,decision_note,branch_id,disbursement_account_id,data,created_at,updated_at", "created_at.desc"],
    ["approvals", "bank_loan_approvals", "id,application_id,step_number,approver_id,decision,note,decided_at", "decided_at.desc"],
    ["guarantors", "bank_guarantors", "id,application_id,customer_id,guarantee_amount,consent_status,consented_at,data,created_at", "created_at.desc"],
    ["collateral", "bank_collateral", "id,application_id,collateral_type,description,ownership_document,estimated_value,valuation_date,verification_status,data,created_at", "created_at.desc"],
    ["loans", "bank_loans", "id,loan_number,application_id,customer_id,product_id,principal,outstanding_principal,outstanding_interest,outstanding_fees,outstanding_penalties,annual_interest_rate,term_months,interest_method,status,disbursed_at,maturity_date,days_past_due,par_bucket,write_off_at,restructure_count,created_at,updated_at", "created_at.desc"],
    ["schedules", "bank_loan_schedules", "id,loan_id,installment_number,due_date,principal_due,interest_due,fee_due,penalty_due,principal_paid,interest_paid,fee_paid,penalty_paid,status,paid_at", "due_date.asc"],
    ["repayments", "bank_loan_repayments", "id,repayment_number,loan_id,account_id,amount,principal_amount,interest_amount,fee_amount,penalty_amount,channel,status,idempotency_key,transaction_id,posted_by,posted_at", "posted_at.desc"],
    ["groups", "bank_groups", "id,group_number,name,group_type,meeting_frequency,status,branch_id,data,created_at,updated_at", "name.asc"],
    ["groupMembers", "bank_group_members", "id,group_id,customer_id,role,shares_count,joined_at,status", "joined_at.desc"],
    ["shares", "bank_shares", "id,group_id,customer_id,shares_count,price_per_share,transaction_id,status,created_at", "created_at.desc"],
    ["standingOrders", "bank_standing_orders", "id,order_number,source_account_id,destination_account_id,destination_msisdn,amount,frequency,next_run_date,end_date,status,last_run_at,last_result,data,created_at,updated_at", "next_run_date.asc"],
    ["reconciliations", "bank_reconciliations", "id,reconciliation_number,account_id,period_start,period_end,statement_balance,ledger_balance,difference,status,reviewed_by,reviewed_at,notes,created_by,created_at,updated_at", "created_at.desc"],
    ["amlAlerts", "bank_aml_alerts", "id,alert_number,customer_id,transaction_id,rule_code,risk_level,status,rationale,assigned_to,mlro_decision,closed_at,data,created_at,updated_at", "created_at.desc"],
    ["notifications", "bank_notifications", "id,profile_id,customer_id,notification_type,title,body,channel,status,sent_at,data,created_at", "created_at.desc"],
  ];
  const results = await Promise.all(resources.map(async ([key, resource, select, order]) => [key, await readRows(token, resource, select, order)] as const));
  const snapshot = {} as BankSnapshot;
  const errors: Array<{ resource: string; message: string }> = [];
  for (const [key, result] of results) {
    snapshot[key] = result.rows as never;
    if (result.error) errors.push({ resource: String(key), message: result.error });
  }
  snapshot.companyId = profile.company_id;
  snapshot.viewer = { id: profile.id, name: profile.full_name, role: profile.role };
  snapshot.errors = errors;
  return snapshot;
}

export async function createAccountType(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_account_type", { p_payload: payload });
}
export async function createLoanProduct(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_loan_product", { p_payload: payload });
}
export async function setupInstitution(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_setup_institution", { p_payload: payload });
}
export async function registerCustomer(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_register_customer", { p_payload: payload });
}
export async function updateKyc(req: BankRequest, customerId: string, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_update_kyc", { p_customer_id: customerId, p_payload: payload });
}
export async function openAccount(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_open_account", { p_payload: payload });
}
export async function postTransaction(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_post_transaction", { p_payload: payload });
}
export async function submitLoanApplication(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_submit_loan_application", { p_payload: payload });
}
export async function scoreLoanApplication(req: BankRequest, applicationId: string, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_score_loan_application", { p_application_id: applicationId, p_payload: payload });
}
export async function decideLoanApplication(req: BankRequest, applicationId: string, decision: string, note?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_decide_loan_application", { p_application_id: applicationId, p_decision: decision, p_note: note ?? null });
}
export async function disburseLoan(req: BankRequest, applicationId: string, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_disburse_loan", { p_application_id: applicationId, p_payload: payload });
}
export async function recordRepayment(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_record_repayment", { p_payload: payload });
}

export type ScheduleInstallment = { installmentNumber: number; principalCents: number; interestCents: number; totalCents: number };

export function buildReducingBalanceSchedule(principalCents: number, annualRateBps: number, termMonths: number): ScheduleInstallment[] {
  if (!Number.isSafeInteger(principalCents) || principalCents <= 0) throw new Error("principalCents must be a positive safe integer");
  if (!Number.isSafeInteger(annualRateBps) || annualRateBps < 0) throw new Error("annualRateBps must be a non-negative safe integer");
  if (!Number.isSafeInteger(termMonths) || termMonths <= 0 || termMonths > 600) throw new Error("termMonths must be between 1 and 600");
  const monthlyRate = annualRateBps / 10000 / 12;
  const factor = monthlyRate === 0 ? 1 / termMonths : (monthlyRate * (1 + monthlyRate) ** termMonths) / ((1 + monthlyRate) ** termMonths - 1);
  const payment = Math.round(principalCents * factor);
  let balance = principalCents;
  return Array.from({ length: termMonths }, (_, index) => {
    const interestCents = Math.min(balance, Math.round(balance * monthlyRate));
    const principalDue = index === termMonths - 1 ? balance : Math.min(balance, Math.max(payment - interestCents, 0));
    balance -= principalDue;
    return { installmentNumber: index + 1, principalCents: principalDue, interestCents, totalCents: principalDue + interestCents };
  });
}

export function allocateRepaymentCents(amountCents: number, balances: { penaltyCents: number; feeCents: number; interestCents: number; principalCents: number }) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error("amountCents must be a positive safe integer");
  let remaining = amountCents;
  const penaltyCents = Math.min(remaining, Math.max(0, balances.penaltyCents)); remaining -= penaltyCents;
  const feeCents = Math.min(remaining, Math.max(0, balances.feeCents)); remaining -= feeCents;
  const interestCents = Math.min(remaining, Math.max(0, balances.interestCents)); remaining -= interestCents;
  const principalCents = Math.min(remaining, Math.max(0, balances.principalCents));
  return { penaltyCents, feeCents, interestCents, principalCents, unappliedCents: Math.max(0, remaining - principalCents) };
}

export async function addBeneficiary(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_add_beneficiary", { p_payload: payload });
}
export async function createPaymentInstruction(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_payment_instruction", { p_payload: payload });
}
export const standingOrderCreateInput = z.object({
  sourceAccountId: z.string().uuid(),
  destinationAccountId: z.string().uuid().nullable().optional(),
  destinationMsisdn: z.string().trim().min(1).nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  amount: z.number().finite().positive().max(10_000_000_000),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("TZS"),
  channel: z.enum(["INTERNAL_TRANSFER", "MOBILE_MONEY"]).default("INTERNAL_TRANSFER"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  nextRunDate: z.string().date(),
  endDate: z.string().date().nullable().optional(),
  scheduleDay: z.number().int().min(1).max(31).nullable().optional(),
  timezone: z.string().trim().min(1).max(100).default("Africa/Dar_es_Salaam"),
  narration: z.string().trim().min(1).max(500).default("Standing order"),
  name: z.string().trim().min(1).max(200).optional(),
  approvalRequired: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(10).default(3),
  failurePolicy: z.enum(["RETRY_THEN_PAUSE", "PAUSE_AFTER_MAX_RETRIES", "SKIP_AND_CONTINUE", "FAIL_CLOSED"]).default("PAUSE_AFTER_MAX_RETRIES"),
  data: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().uuid(),
}).superRefine((value, context) => {
  const hasAccount = Boolean(value.destinationAccountId);
  const hasMsisdn = Boolean(value.destinationMsisdn);
  if (value.channel === "INTERNAL_TRANSFER" && (!hasAccount || hasMsisdn)) {
    context.addIssue({ code: "custom", path: ["destinationAccountId"], message: "Internal transfers require exactly one account destination." });
  }
  if (value.channel === "MOBILE_MONEY" && (hasAccount || !hasMsisdn)) {
    context.addIssue({ code: "custom", path: ["destinationMsisdn"], message: "Mobile-money orders require exactly one MSISDN destination." });
  }
  if (value.endDate && value.endDate < value.nextRunDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the first run date." });
  }
  if (value.frequency === "WEEKLY" && (value.scheduleDay === null || value.scheduleDay === undefined || value.scheduleDay > 7)) {
    context.addIssue({ code: "custom", path: ["scheduleDay"], message: "Weekly schedule day must be ISO weekday 1 through 7." });
  }
});

const standingOrderUuid = z.string().uuid();
const standingOrderVersion = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const standingOrderIdempotencyKey = z.string().trim().min(12).max(200);

export type StandingOrderCreateInput = z.infer<typeof standingOrderCreateInput>;

export async function createStandingOrder(req: BankRequest, payload: Record<string, unknown>) {
  const input = standingOrderCreateInput.parse(payload);
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_standing_order", { p_payload: input });
}

export async function listStandingOrders(req: BankRequest, input: { status?: string; search?: string; limit?: number; offset?: number } = {}) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_list_standing_orders", {
    p_status: input.status ?? null,
    p_search: input.search ?? null,
    p_limit: Math.min(Math.max(input.limit ?? 100, 1), 100),
    p_offset: Math.max(input.offset ?? 0, 0),
  });
}

export async function getStandingOrder(req: BankRequest, orderId: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_get_standing_order", { p_order_id: standingOrderUuid.parse(orderId) });
}

export async function submitStandingOrder(req: BankRequest, orderId: string, expectedVersion: number, idempotencyKey?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_submit_standing_order", { p_order_id: standingOrderUuid.parse(orderId), p_expected_version: standingOrderVersion.parse(expectedVersion), p_idempotency_key: idempotencyKey ? standingOrderIdempotencyKey.parse(idempotencyKey) : null });
}

export async function approveStandingOrder(req: BankRequest, orderId: string, decision: string, note: string | undefined, expectedVersion: number, idempotencyKey?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_approve_standing_order", { p_order_id: standingOrderUuid.parse(orderId), p_decision: decision, p_note: note ?? null, p_expected_version: standingOrderVersion.parse(expectedVersion), p_idempotency_key: idempotencyKey ? standingOrderIdempotencyKey.parse(idempotencyKey) : null });
}

export async function activateStandingOrder(req: BankRequest, orderId: string, expectedVersion: number, idempotencyKey?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_activate_standing_order", { p_order_id: standingOrderUuid.parse(orderId), p_expected_version: standingOrderVersion.parse(expectedVersion), p_idempotency_key: idempotencyKey ? standingOrderIdempotencyKey.parse(idempotencyKey) : null });
}

export async function pauseStandingOrder(req: BankRequest, orderId: string, reason: string, expectedVersion: number, idempotencyKey?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_pause_standing_order", { p_order_id: standingOrderUuid.parse(orderId), p_reason: z.string().trim().min(1).max(1000).parse(reason), p_expected_version: standingOrderVersion.parse(expectedVersion), p_idempotency_key: idempotencyKey ? standingOrderIdempotencyKey.parse(idempotencyKey) : null });
}

export async function resumeStandingOrder(req: BankRequest, orderId: string, expectedVersion: number, idempotencyKey?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_resume_standing_order", { p_order_id: standingOrderUuid.parse(orderId), p_expected_version: standingOrderVersion.parse(expectedVersion), p_idempotency_key: idempotencyKey ? standingOrderIdempotencyKey.parse(idempotencyKey) : null });
}

export async function cancelStandingOrder(req: BankRequest, orderId: string, reason: string, expectedVersion: number, idempotencyKey?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_cancel_standing_order", { p_order_id: standingOrderUuid.parse(orderId), p_reason: z.string().trim().min(1).max(1000).parse(reason), p_expected_version: standingOrderVersion.parse(expectedVersion), p_idempotency_key: idempotencyKey ? standingOrderIdempotencyKey.parse(idempotencyKey) : null });
}

export async function confirmStandingOrderProviderPayment(req: BankRequest, runId: string, providerReference: string, providerStatus: string, providerEventId: string, idempotencyKey: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_confirm_standing_order_provider_payment", { p_run_id: standingOrderUuid.parse(runId), p_provider_reference: z.string().trim().min(1).max(200).parse(providerReference), p_provider_status: z.string().trim().min(1).max(100).parse(providerStatus), p_provider_event_id: z.string().trim().min(1).max(200).parse(providerEventId), p_idempotency_key: standingOrderIdempotencyKey.parse(idempotencyKey) });
}

export async function retryStandingOrderRun(req: BankRequest, runId: string, idempotencyKey: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_retry_standing_order_run", { p_run_id: standingOrderUuid.parse(runId), p_idempotency_key: standingOrderIdempotencyKey.parse(idempotencyKey) });
}
export async function createGroup(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_group", { p_payload: payload });
}
export async function addGroupMember(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_add_group_member", { p_payload: payload });
}
export async function createReconciliation(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_reconciliation", { p_payload: payload });
}
export async function createAmlAlert(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_aml_alert", { p_payload: payload });
}
export async function resolveAmlAlert(req: BankRequest, alertId: string, decision: string, note?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_resolve_aml_alert", { p_alert_id: alertId, p_decision: decision, p_note: note ?? null });
}
export async function writeOffLoan(req: BankRequest, loanId: string, note: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_write_off_loan", { p_loan_id: loanId, p_note: note });
}
export async function restructureLoan(req: BankRequest, loanId: string, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_restructure_loan", { p_loan_id: loanId, p_payload: payload });
}
export async function moveCash(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_move_cash", { p_payload: payload });
}
export async function runDailyControls(req: BankRequest) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_run_daily_controls", {});
}
export async function addGuarantor(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_add_guarantor", { p_payload: payload });
}
export async function addCollateral(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_add_collateral", { p_payload: payload });
}
export async function recordSharePurchase(req: BankRequest, payload: Record<string, unknown>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_record_share_purchase", { p_payload: payload });
}
export async function customerStatement(req: BankRequest, accountId: string, from?: string, to?: string) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_customer_statement", { p_account_id: accountId, p_from: from ?? null, p_to: to ?? null });
}
export async function runStandingOrders(req: BankRequest, input: { runDate?: string; orderId?: string; maxOrders?: number } = {}) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_run_standing_orders", {
    p_run_date: input.runDate ?? null,
    p_order_id: input.orderId ? standingOrderUuid.parse(input.orderId) : null,
    p_max_orders: Math.min(Math.max(input.maxOrders ?? 250, 1), 250),
  });
}
