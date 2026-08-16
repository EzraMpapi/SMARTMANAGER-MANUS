import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { approvalData, resolveVerifiedProfile } from "./aiApprovals";

const APPROVAL_TABLE = "approval_signatures";
const APPROVER_ROLES = new Set(["Organization Owner", "CEO", "Super Administrator", "System Administrator"]);
type ApprovalRow = { id: string; status?: string; notes?: string | null; data?: unknown };

async function requestWithSession(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/${path}`, { ...init, headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new TRPCError({ code: "FORBIDDEN", message: "The role-change request could not be verified for this workspace." });
  return body;
}

async function updateProfileAsServer(profileId: string, role: string) {
  if (!ENV.supabaseSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Secure role approval is not configured for this workspace." });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(profileId)}`, { method: "PATCH", headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ role }) });
  if (!response.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The approved role change could not be applied. The request remains pending for review." });
}

export async function requestRoleChangeApproval(req: CreateExpressContextOptions["req"], input: { requestedRole: string; reason?: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const requestedRole = input.requestedRole.trim();
  if (!requestedRole || requestedRole.length > 80) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid requested role." });
  if (requestedRole === profile.role) throw new TRPCError({ code: "BAD_REQUEST", message: "Your requested role is already active." });
  const data = { kind: "role_change_approval", targetUserId: profile.id, requestedBy: { userId: profile.id, role: profile.role, name: profile.full_name || "Workspace user" }, currentRole: profile.role, requestedRole, requestedAt: new Date().toISOString(), requiredRoles: Array.from(APPROVER_ROLES) };
  const rows = await requestWithSession(APPROVAL_TABLE, token, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: `Role change: ${profile.role} → ${requestedRole}`, status: "Pending Review", notes: (input.reason || "Role change requested by the authenticated user.").slice(0, 500), data }) }) as ApprovalRow[];
  return { approval: rows[0], requester: profile };
}

export async function listRoleChangeApprovals(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const rows = await requestWithSession(`${APPROVAL_TABLE}?select=id,name,status,notes,data,created_at&data-%3E%3Ekind=eq.role_change_approval&order=created_at.desc&limit=50`, token) as (ApprovalRow & { name?: string; created_at?: string })[];
  return { approvals: rows.map((row) => ({ id: row.id, name: row.name || "Role change", status: row.status || "Pending Review", notes: row.notes || "", data: approvalData(row), createdAt: row.created_at || null })), profile };
}

export async function decideRoleChangeApproval(req: CreateExpressContextOptions["req"], input: { approvalId: string; decision: "approve" | "reject"; note?: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  if (!APPROVER_ROLES.has(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Your verified workspace role cannot decide role changes." });
  const rows = await requestWithSession(`${APPROVAL_TABLE}?select=*&id=eq.${encodeURIComponent(input.approvalId)}&limit=1`, token) as ApprovalRow[];
  const approval = rows[0]; const data = approvalData(approval);
  if (!approval || data.kind !== "role_change_approval" || approval.status !== "Pending Review") throw new TRPCError({ code: "CONFLICT", message: "This role-change request is no longer awaiting review." });
  if (data.targetUserId === profile.id) throw new TRPCError({ code: "FORBIDDEN", message: "An administrator cannot approve their own role change." });
  const status = input.decision === "approve" ? "Approved" : "Rejected";
  if (input.decision === "approve") await updateProfileAsServer(String(data.targetUserId), String(data.requestedRole));
  const nextData = { ...data, decision: { status, note: input.note?.slice(0, 500) || "", decidedAt: new Date().toISOString(), decidedBy: { userId: profile.id, role: profile.role, name: profile.full_name || "Workspace administrator" } } };
  const updated = await requestWithSession(`${APPROVAL_TABLE}?id=eq.${encodeURIComponent(approval.id)}`, token, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status, notes: input.note?.slice(0, 500) || approval.notes || "", data: nextData }) }) as ApprovalRow[];
  return { approval: updated[0], approver: profile, requestedRole: String(data.requestedRole), targetUserId: String(data.targetUserId) };
}
