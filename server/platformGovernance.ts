import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";

export const PLATFORM_ADMIN_ROLES = new Set(["Platform Administrator", "Global Administrator", "Super Administrator", "System Administrator"]);
const TABLE = "platform_governance_requests";
type Profile = { id: string; company_id: string; role?: string | null; full_name?: string | null; email?: string | null };
type GovernanceRow = { id: string; request_type: string; company_id?: string | null; requested_by: string; target_user_id?: string | null; payload?: Record<string, unknown>; status: string; decision_note?: string | null; decided_by?: string | null; decided_at?: string | null; created_at?: string; updated_at?: string };

function requireService() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Platform governance storage is not configured." });
  return { url: ENV.supabaseUrl.replace(/\/$/, ""), key: ENV.supabaseSecretKey };
}
async function serviceRequest(path: string, init: RequestInit = {}) {
  const { url, key } = requireService();
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", ...(init.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Platform governance could not reach the secure data store." });
  return body;
}
function isPlatformAdmin(profile: Profile) { return PLATFORM_ADMIN_ROLES.has(String(profile.role || "").trim()); }
function toView(row: GovernanceRow) { return { id: row.id, requestType: row.request_type, companyId: row.company_id, requestedBy: row.requested_by, targetUserId: row.target_user_id, payload: row.payload || {}, status: row.status, decisionNote: row.decision_note || "", decidedBy: row.decided_by, decidedAt: row.decided_at || null, createdAt: row.created_at || null, updatedAt: row.updated_at || null }; }

export async function createGovernanceRequestForProfile(profile: Profile, input: { requestType: "role_change" | "team_invitation" | "business_network"; targetUserId?: string; payload?: Record<string, unknown> }) {
  const duplicate = await serviceRequest(`${TABLE}?select=id,status&requested_by=eq.${encodeURIComponent(profile.id)}&request_type=eq.${input.requestType}&status=eq.pending&limit=1`) as GovernanceRow[];
  if (duplicate[0]) throw new TRPCError({ code: "CONFLICT", message: "A matching request is already awaiting Platform Administrator review." });
  const rows = await serviceRequest(TABLE, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ request_type: input.requestType, company_id: profile.company_id, requested_by: profile.id, target_user_id: input.targetUserId || null, payload: input.payload || {} }) }) as GovernanceRow[];
  return rows[0] ? toView(rows[0]) : null;
}

export async function createBusinessNetworkVerification(req: CreateExpressContextOptions["req"], input: { networkName?: string; domain?: string; evidence?: Record<string, unknown> }) {
  const { profile } = await resolveVerifiedProfile(req);
  const request = await createGovernanceRequestForProfile(profile, { requestType: "business_network", payload: { networkName: input.networkName?.trim().slice(0, 160) || null, domain: input.domain?.trim().toLowerCase().slice(0, 255) || null, evidence: input.evidence || {} } });
  return { request, message: "Business network verification was submitted to the Platform Administrator." };
}

export async function listPlatformGovernanceRequests(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  if (!isPlatformAdmin(profile)) throw new TRPCError({ code: "FORBIDDEN", message: "Only a Platform Administrator can review the governance queue." });
  const rows = await serviceRequest(`${TABLE}?select=id,request_type,company_id,requested_by,target_user_id,payload,status,decision_note,decided_by,decided_at,created_at,updated_at&order=created_at.desc&limit=100`) as GovernanceRow[];
  return { requests: rows.map(toView), role: profile.role };
}

export async function listMyPlatformGovernanceRequests(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  const rows = await serviceRequest(`${TABLE}?select=id,request_type,company_id,requested_by,target_user_id,payload,status,decision_note,decided_by,decided_at,created_at,updated_at&or=(requested_by.eq.${encodeURIComponent(profile.id)},target_user_id.eq.${encodeURIComponent(profile.id)})&order=created_at.desc&limit=50`) as GovernanceRow[];
  return { requests: rows.map(toView) };
}

export async function decidePlatformGovernanceRequest(req: CreateExpressContextOptions["req"], input: { requestId: string; decision: "approve" | "reject"; note?: string }) {
  const { profile } = await resolveVerifiedProfile(req);
  if (!isPlatformAdmin(profile)) throw new TRPCError({ code: "FORBIDDEN", message: "Only the Platform Administrator can approve governance requests." });
  const rows = await serviceRequest(`${TABLE}?select=*&id=eq.${encodeURIComponent(input.requestId)}&status=eq.pending&limit=1`) as GovernanceRow[];
  const row = rows[0];
  if (!row) throw new TRPCError({ code: "CONFLICT", message: "This governance request is no longer pending." });
  if (row.requested_by === profile.id || row.target_user_id === profile.id) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot approve your own governance request." });
  const status = input.decision === "approve" ? "approved" : "rejected";
  const note = input.note?.trim().slice(0, 500) || null;
  if (status === "approved" && row.request_type === "role_change") {
    const role = String(row.payload?.requestedRole || "").trim();
    if (!role || !row.target_user_id) throw new TRPCError({ code: "BAD_REQUEST", message: "Role-change request payload is incomplete." });
    await serviceRequest(`profiles?id=eq.${encodeURIComponent(row.target_user_id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ role, updated_at: new Date().toISOString() }) });
    await serviceRequest(`company_memberships?user_id=eq.${encodeURIComponent(row.target_user_id)}&company_id=eq.${encodeURIComponent(String(row.company_id))}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ role, updated_at: new Date().toISOString() }) });
  }
  if (status === "approved" && row.request_type === "business_network") {
    const network = row.payload || {};
    const existing = await serviceRequest(`business_network_verifications?company_id=eq.${encodeURIComponent(String(row.company_id))}&status=eq.pending&limit=1`) as Array<{ id: string }>;
    if (existing[0]) await serviceRequest(`business_network_verifications?id=eq.${encodeURIComponent(existing[0].id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "verified", network_name: network.networkName || null, domain: network.domain || null, evidence: network.evidence || {}, verified_by: profile.id, verified_at: new Date().toISOString(), decision_note: note, updated_at: new Date().toISOString() }) });
  }
  const updated = await serviceRequest(`${TABLE}?id=eq.${encodeURIComponent(row.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status, decision_note: note, decided_by: profile.id, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() }) }) as GovernanceRow[];
  return { request: updated[0] ? toView(updated[0]) : { ...toView(row), status, decisionNote: note || "" }, approver: profile };
}
