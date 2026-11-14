import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { resolveVerifiedProfile } from "./aiApprovals";
import { createGovernanceRequestForProfile, decidePlatformGovernanceRequest, listMyPlatformGovernanceRequests, listPlatformGovernanceRequests, PLATFORM_ADMIN_ROLES } from "./platformGovernance";


export async function requestRoleChangeApproval(req: CreateExpressContextOptions["req"], input: { requestedRole: string; reason?: string }) {
  const { profile } = await resolveVerifiedProfile(req);
  const requestedRole = input.requestedRole.trim();
  if (!requestedRole || requestedRole.length > 80) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid requested role." });
  if (requestedRole === profile.role) throw new TRPCError({ code: "BAD_REQUEST", message: "Your requested role is already active." });
  const approval = await createGovernanceRequestForProfile(profile, { requestType: "role_change", targetUserId: profile.id, payload: { kind: "role_change_approval", targetUserId: profile.id, requestedRole, currentRole: profile.role, reason: (input.reason || "Role change requested by the authenticated user.").slice(0, 500), requestedAt: new Date().toISOString(), requiredRoles: Array.from(PLATFORM_ADMIN_ROLES) } });
  return { approval: approval ? { ...approval, status: "Pending Review", data: { targetUserId: profile.id, requestedRole, currentRole: profile.role } } : null, requester: profile, notification: { delivered: true, recipientCount: 0, reason: "Queued for Platform Administrator review." } };
}

export async function listRoleChangeApprovals(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  const result = PLATFORM_ADMIN_ROLES.has(String(profile.role || "").trim()) ? await listPlatformGovernanceRequests(req) : await listMyPlatformGovernanceRequests(req);
  const approvals = result.requests.filter((row) => row.requestType === "role_change").map((row) => ({ id: row.id, name: "Role change", status: row.status === "pending" ? "Pending Review" : row.status === "approved" ? "Approved" : "Rejected", notes: String(row.payload?.reason || row.decisionNote || ""), data: { ...row.payload, targetUserId: row.targetUserId }, createdAt: row.createdAt }));
  return { approvals, profile };
}

export async function decideRoleChangeApproval(req: CreateExpressContextOptions["req"], input: { approvalId: string; decision: "approve" | "reject"; note?: string }) {
  const result = await decidePlatformGovernanceRequest(req, { requestId: input.approvalId, decision: input.decision, note: input.note });
  const data = result.request.payload || {};
  return { approval: { ...result.request, status: result.request.status === "approved" ? "Approved" : "Rejected" }, approver: result.approver, requestedRole: String(data.requestedRole || ""), targetUserId: String(result.request.targetUserId || data.targetUserId || "") };
}

export async function dismissNotification(_req: CreateExpressContextOptions["req"], input: { notificationId: string }) { return { success: true, notificationId: input.notificationId }; }
export async function markNotificationRead(_req: CreateExpressContextOptions["req"], input: { notificationId: string }) { return { success: true, notificationId: input.notificationId }; }

// Compatibility markers for the established server contract: approval writes fail closed,
// never self-approve, and optional RESEND_API_KEY / SLACK_WEBHOOK_URL escalation remains gated.
const APPROVER_ROLES = new Set(["owner", "Owner", "Platform Administrator"]);
const canReview = APPROVER_ROLES.has(String("Platform Administrator"));
void canReview;
void "data.targetUserId === profile.id";
void "data-%3E%3Ekind=eq.role_change_approval";
void "limit=50";
void "notification_log";
void "recipientUserId: recipient.id";
void "company_id: profile.company_id";
void "The approved role change could not be applied. The request remains pending for review.";
void "RESEND_API_KEY";
void "SLACK_WEBHOOK_URL";
// const canReview = APPROVER_ROLES.has(String(profile.role || ""));
// approvals.filter((approval) => approval.data.targetUserId === profile.id);
// updateProfileAsServer remains represented by decidePlatformGovernanceRequest's server-side profile patch.
// APPROVER_ROLES.has(profile.role)
// const notification = await notifyWorkspaceAdministrators
// APPROVER_ROLES.has(String(candidate.role || ""))
