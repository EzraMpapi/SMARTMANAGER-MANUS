import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";

const APPROVAL_TABLE = "approval_signatures";
const EXPIRY_MS = 24 * 60 * 60 * 1000;

type VerifiedProfile = { id: string; company_id: string; role: string; full_name: string | null };
type ApprovalRow = { id: string; name?: string; status?: string; notes?: string | null; data?: unknown };

const ACTION_RULES: Record<string, { label: string; module: string; roles: string[] }> = {
  create_lead: { label: "Create CRM lead", module: "crm", roles: ["Sales Manager", "Organization Owner", "CEO", "Super Administrator"] },
  adjust_stock: { label: "Adjust inventory stock", module: "inventory", roles: ["Warehouse Manager", "Organization Owner", "CEO", "Super Administrator"] },
  mark_invoice_paid: { label: "Mark invoice paid", module: "finance", roles: ["Finance Manager", "CFO", "Organization Owner", "CEO", "Super Administrator"] },
  record_expense: { label: "Record expense", module: "finance", roles: ["Finance Manager", "CFO", "Organization Owner", "CEO", "Super Administrator"] },
  approve_leave: { label: "Approve leave request", module: "hr", roles: ["HR Manager", "Organization Owner", "CEO", "Super Administrator"] },
  create_invoice: { label: "Create sales invoice", module: "sales", roles: ["Sales Manager", "Finance Manager", "CFO", "Organization Owner", "CEO", "Super Administrator"] },
  create_quotation: { label: "Create sales quotation", module: "sales", roles: ["Sales Manager", "Organization Owner", "CEO", "Super Administrator"] },
  create_workflow: { label: "Create scheduled workflow", module: "workflows", roles: ["Organization Owner", "CEO", "Super Administrator"] },
};

function accessToken(req: CreateExpressContextOptions["req"]) {
  const candidate = req.headers["x-supabase-authorization"] || req.headers.authorization;
  const raw = Array.isArray(candidate) ? candidate[0] : candidate;
  return raw?.startsWith("Bearer ") ? raw.slice(7) : null;
}

async function supabaseRequest(path: string, token: string, init: RequestInit = {}) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Supabase approval verification is not configured." });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ENV.supabaseAnonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new TRPCError({ code: "FORBIDDEN", message: "The approval record could not be verified for this authenticated workspace." });
  return body;
}

export async function resolveVerifiedProfile(req: CreateExpressContextOptions["req"]): Promise<{ profile: VerifiedProfile; token: string }> {
  const token = accessToken(req);
  if (!token || !ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "UNAUTHORIZED", message: "A current workspace session is required for AI approval." });
  const identity = await fetch(`${ENV.supabaseUrl}/auth/v1/user`, { headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}` } });
  const user = await identity.json().catch(() => null) as { id?: string } | null;
  if (!identity.ok || !user?.id) throw new TRPCError({ code: "UNAUTHORIZED", message: "The workspace session could not be verified." });
  const rows = await supabaseRequest(`profiles?select=id,company_id,role,full_name&id=eq.${encodeURIComponent(user.id)}&limit=1`, token) as VerifiedProfile[];
  const profile = rows[0];
  if (!profile?.company_id || !profile.role) throw new TRPCError({ code: "FORBIDDEN", message: "Your workspace role is not configured for AI approval." });
  return { profile, token };
}

export function actionRule(operation: string) {
  const rule = ACTION_RULES[operation];
  if (!rule) throw new TRPCError({ code: "BAD_REQUEST", message: "This AI recommendation is not an approvable business action." });
  return rule;
}

export function approvalData(row: ApprovalRow) {
  return row.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data as Record<string, unknown> : {};
}

export async function requestActionApproval(req: CreateExpressContextOptions["req"], input: { operation: string; input: Record<string, unknown>; rationale: string; requesterMessage: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const rule = actionRule(input.operation);
  const now = new Date();
  const data = {
    kind: "ai_action_approval",
    operation: input.operation,
    input: input.input,
    rationale: input.rationale,
    requesterMessage: input.requesterMessage,
    requestedBy: { userId: profile.id, name: profile.full_name || "Workspace user", role: profile.role },
    requiredRoles: rule.roles,
    requestedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + EXPIRY_MS).toISOString(),
  };
  const rows = await supabaseRequest(APPROVAL_TABLE, token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: `AI action: ${rule.label}`, status: "Pending Review", notes: input.rationale.slice(0, 500), data }) }) as ApprovalRow[];
  return { approval: rows[0], rule, requester: profile };
}

export async function decideActionApproval(req: CreateExpressContextOptions["req"], input: { approvalId: string; decision: "approve" | "reject"; note?: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const rows = await supabaseRequest(`${APPROVAL_TABLE}?select=*&id=eq.${encodeURIComponent(input.approvalId)}&limit=1`, token) as ApprovalRow[];
  const approval = rows[0];
  const data = approvalData(approval);
  const rule = actionRule(typeof data.operation === "string" ? data.operation : "");
  if (data.kind !== "ai_action_approval" || approval.status !== "Pending Review") throw new TRPCError({ code: "CONFLICT", message: "This recommendation is no longer awaiting review." });
  if (typeof data.expiresAt === "string" && Date.parse(data.expiresAt) < Date.now()) throw new TRPCError({ code: "CONFLICT", message: "This recommendation has expired and must be generated again." });
  if (!rule.roles.includes(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: `Your ${profile.role} role cannot authorize this ${rule.label.toLowerCase()} action.` });
  const status = input.decision === "approve" ? "Approved" : "Rejected";
  const nextData = { ...data, decision: { status, note: input.note?.slice(0, 500) || "", decidedAt: new Date().toISOString(), decidedBy: { userId: profile.id, name: profile.full_name || "Workspace user", role: profile.role } } };
  const updated = await supabaseRequest(`${APPROVAL_TABLE}?id=eq.${encodeURIComponent(approval.id)}`, token, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status, notes: input.note?.slice(0, 500) || approval.notes || "", data: nextData }) }) as ApprovalRow[];
  return { approval: updated[0], rule, approver: profile };
}
