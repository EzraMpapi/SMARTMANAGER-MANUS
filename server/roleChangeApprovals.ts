import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { approvalData, resolveVerifiedProfile } from "./aiApprovals";

const APPROVAL_TABLE = "approval_signatures";
const APPROVER_ROLES = new Set(["owner", "Owner", "Organization Owner", "CEO", "Super Administrator", "System Administrator"]);
type ApprovalRow = { id: string; status?: string; notes?: string | null; data?: unknown };
type WorkspaceProfileRow = { id: string; company_id: string; role?: string | null; full_name?: string | null };

async function notifyWorkspaceAdministrators(profile: WorkspaceProfileRow, approval: ApprovalRow | undefined, requestedRole: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey || !approval?.id) {
    return { delivered: false, reason: "Administrator notification storage is not configured." };
  }
  try {
    const headers = { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
    const profilesResponse = await fetch(`${ENV.supabaseUrl}/rest/v1/profiles?select=id,company_id,role,full_name&company_id=eq.${encodeURIComponent(profile.company_id)}&limit=100`, { headers });
    const profiles = await profilesResponse.json().catch(() => null) as WorkspaceProfileRow[] | null;
    if (!profilesResponse.ok || !Array.isArray(profiles)) return { delivered: false, reason: "Administrator profiles could not be resolved." };
    const recipients = profiles.filter((candidate) => candidate.id !== profile.id && APPROVER_ROLES.has(String(candidate.role || "")));
    if (recipients.length === 0) return { delivered: true, recipientCount: 0 };
    const requestedBy = profile.full_name || "A workspace member";
    const notifications = recipients.map((recipient) => ({
      company_id: profile.company_id,
      name: "New role-change approval request",
      status: "Unread",
      notes: `${requestedBy} requested the ${requestedRole} role. Review is required before access changes.`,
      data: {
        kind: "role_change_notification",
        notificationType: "role_change_approval",
        recipientUserId: recipient.id,
        companyId: profile.company_id,
        approvalId: approval.id,
        targetUserId: profile.id,
        requestedBy,
        currentRole: profile.role || "Unknown",
        requestedRole,
        requestedAt: new Date().toISOString(),
      },
    }));
    const notificationResponse = await fetch(`${ENV.supabaseUrl}/rest/v1/notification_log`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(notifications) });
    if (!notificationResponse.ok) return { delivered: false, reason: "Administrator notification records could not be persisted." };

    // Optional email / Slack escalation gated strictly behind verified credentials
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL,
            to: recipients.map((r) => r.full_name ? `${r.full_name} <admin@workspace>` : "admin@workspace"),
            subject: `[Smart Manager] Role Change Requested: ${requestedRole}`,
            html: `<p><strong>${requestedBy}</strong> requested the <strong>${requestedRole}</strong> role. Please review this request in the Smart Manager ERP executive dashboard.</p>`,
          }),
        });
      } catch {
        // Fail-closed escalation failure does not block in-app approval persistence
      }
    }

    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `*Smart Manager Role Approval Alert*\n• Requester: ${requestedBy}\n• Requested Role: ${requestedRole}\n• Status: Pending Review`,
          }),
        });
      } catch {
        // Fail-closed Slack failure does not block in-app approval persistence
      }
    }

    return { delivered: true, recipientCount: recipients.length };
  } catch (_error) {
    return { delivered: false, reason: "Administrator notification delivery was unavailable." };
  }
}

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
  const notification = await notifyWorkspaceAdministrators(profile, rows[0], requestedRole);
  return { approval: rows[0], requester: profile, notification };
}

export async function listRoleChangeApprovals(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const rows = await requestWithSession(`${APPROVAL_TABLE}?select=id,name,status,notes,data,created_at&data-%3E%3Ekind=eq.role_change_approval&order=created_at.desc&limit=50`, token) as (ApprovalRow & { name?: string; created_at?: string })[];
  const approvals = rows.map((row) => ({ id: row.id, name: row.name || "Role change", status: row.status || "Pending Review", notes: row.notes || "", data: approvalData(row), createdAt: row.created_at || null }));
  const canReview = APPROVER_ROLES.has(String(profile.role || ""));
  return { approvals: canReview ? approvals : approvals.filter((approval) => approval.data.targetUserId === profile.id), profile };
}

export async function dismissNotification(req: CreateExpressContextOptions["req"], input: { notificationId: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const updated = await requestWithSession(`notification_log?id=eq.${encodeURIComponent(input.notificationId)}`, token, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "Dismissed" }) }) as { id: string }[];
  return { success: true, notificationId: updated[0]?.id || input.notificationId };
}

export async function markNotificationRead(req: CreateExpressContextOptions["req"], input: { notificationId: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const updated = await requestWithSession(`notification_log?id=eq.${encodeURIComponent(input.notificationId)}`, token, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "Read" }) }) as { id: string }[];
  return { success: true, notificationId: updated[0]?.id || input.notificationId };
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
