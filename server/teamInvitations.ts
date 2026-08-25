import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { getBearerToken } from "./_core/authHeaders";
import { sendTransactionalEmail } from "./transactionalEmail";

const INVITATION_TABLE = "team_invitations";
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITATION_MANAGER_ROLES = new Set(["Organization Owner", "CEO", "Super Administrator", "System Administrator", "HR Manager"]);
const INVITABLE_ROLES = new Set(["Finance Manager", "HR Manager", "Sales Manager", "Sales Representative", "Warehouse Staff", "Accountant", "Viewer"]);

type InvitationStatus = "pending" | "accepted" | "revoked" | "expired" | "delivery_failed";
type InviteInput = { fullName: string; email: string; role: string };

type TeamInvitation = {
  id: string;
  invitation_id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: string;
  token_hash: string;
  status: InvitationStatus;
  invited_by_profile_id: string;
  invited_by_role: string;
  expires_at: string;
  accepted_by_profile_id: string | null;
  delivery_message_id: string | null;
  delivery_error: string | null;
  email_sent_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

type InvitationPatch = Partial<Pick<TeamInvitation, "status" | "token_hash" | "expires_at" | "delivery_message_id" | "delivery_error" | "email_sent_at" | "revoked_at" | "accepted_by_profile_id">>;

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function isInvitationExpired(expiresAt: Date | string, now = Date.now()) {
  return new Date(expiresAt).getTime() <= now;
}

export function invitationOrigin(req: CreateExpressContextOptions["req"]) {
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || "https";
  if (!host) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The invitation link could not be prepared." });
  return `${protocol}://${host}`;
}

function requireInviteManager(role: string) {
  if (!INVITATION_MANAGER_ROLES.has(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Your workspace role cannot manage team invitations." });
}

function validateInvite(input: InviteInput) {
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 2 || fullName.length > 120) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter the teammate’s full name." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid team email address." });
  if (!INVITABLE_ROLES.has(input.role)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid workspace role." });
  return { fullName, email, role: input.role };
}

function requireSupabaseService() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Team invitation storage is not configured on the server." });
  }
  return { url: ENV.supabaseUrl.replace(/\/$/, ""), key: ENV.supabaseSecretKey };
}

async function supabaseServiceRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = requireSupabaseService();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null) as T;
  if (!response.ok) {
    console.error("[TeamInvitations] Supabase request failed", { status: response.status, path });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Team invitation storage could not be reached." });
  }
  return body;
}

function invitationSelect() {
  return "id,invitation_id,company_id,email,full_name,role,token_hash,status,invited_by_profile_id,invited_by_role,expires_at,accepted_by_profile_id,delivery_message_id,delivery_error,email_sent_at,revoked_at,created_at,updated_at";
}

function asInvitation(value: unknown) {
  return value as TeamInvitation;
}

function serializeInvitation(row: TeamInvitation) {
  return {
    id: row.invitation_id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    expiresAt: new Date(row.expires_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    emailSentAt: row.email_sent_at ? new Date(row.email_sent_at).toISOString() : null,
    deliveryError: row.delivery_error ?? null,
  };
}

async function updateInvitation(id: string, patch: InvitationPatch) {
  const rows = await supabaseServiceRequest<TeamInvitation[]>(`${INVITATION_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  return rows[0] ? asInvitation(rows[0]) : null;
}

async function sendInvitationEmail({ to, fullName, role, companyName, inviteUrl }: { to: string; fullName: string; role: string; companyName: string; inviteUrl: string }) {
  const text = `Hello ${fullName},\n\nYou have been invited to join ${companyName} as ${role} in Smart Manager. Accept your invitation: ${inviteUrl}\n\nThis secure invitation expires in seven days. Sign in or create an account with ${to} to continue.`;
  const delivered = await sendTransactionalEmail({ to: [to], subject: `You’re invited to ${companyName} on Smart Manager`, text, html: `<p>Hello ${escapeHtml(fullName)},</p><p>You have been invited to join <strong>${escapeHtml(companyName)}</strong> as ${escapeHtml(role)} in Smart Manager.</p><p><a href="${escapeHtml(inviteUrl)}">Accept your invitation</a></p><p>This secure invitation expires in seven days. Sign in or create an account with <strong>${escapeHtml(to)}</strong> to continue.</p>`, category: "invitation" });
  return delivered.deliveryId;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character] || character));
}

async function companyNameForInvitation(companyId: string) {
  const { url, key } = requireSupabaseService();
  const params = new URLSearchParams({ select: "name", id: `eq.${companyId}`, limit: "1" });
  const response = await fetch(`${url}/rest/v1/companies?${params.toString()}`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  const rows = await response.json().catch(() => []) as Array<{ name?: string }>;
  if (!response.ok || !rows[0]?.name) throw new Error("Workspace details could not be verified.");
  return rows[0].name;
}

async function deliver(row: TeamInvitation, token: string, req: CreateExpressContextOptions["req"]) {
  try {
    const companyName = await companyNameForInvitation(row.company_id);
    const deliveryMessageId = await sendInvitationEmail({
      to: row.email,
      fullName: row.full_name,
      role: row.role,
      companyName,
      inviteUrl: `${invitationOrigin(req)}/app?invite=${encodeURIComponent(token)}`,
    });
    await updateInvitation(row.id, { status: "pending", delivery_message_id: deliveryMessageId, delivery_error: null, email_sent_at: new Date().toISOString() });
    return { delivered: true as const, deliveryError: null };
  } catch (error) {
    const deliveryError = error instanceof Error ? error.message.slice(0, 500) : "Invitation delivery failed.";
    await updateInvitation(row.id, { status: "delivery_failed", delivery_error: deliveryError });
    return { delivered: false as const, deliveryError };
  }
}

export async function createTeamInvitation(req: CreateExpressContextOptions["req"], input: InviteInput) {
  const { profile } = await resolveVerifiedProfile(req);
  requireInviteManager(profile.role);
  const invite = validateInvite(input);
  const token = newInvitationToken();
  const now = new Date();
  const rows = await supabaseServiceRequest<TeamInvitation[]>(INVITATION_TABLE, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      invitation_id: `inv_${randomBytes(12).toString("hex")}`,
      company_id: profile.company_id,
      email: invite.email,
      full_name: invite.fullName,
      role: invite.role,
      token_hash: hashInvitationToken(token),
      status: "pending",
      invited_by_profile_id: profile.id,
      invited_by_role: profile.role,
      expires_at: new Date(now.getTime() + INVITATION_TTL_MS).toISOString(),
    }),
  });
  const created = rows[0] ? asInvitation(rows[0]) : null;
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The invitation could not be created." });
  const delivery = await deliver(created, token, req);
  const finalInvitation = { ...created, status: delivery.delivered ? "pending" as const : "delivery_failed" as const, delivery_error: delivery.deliveryError, email_sent_at: delivery.delivered ? new Date().toISOString() : null };
  return { invitation: serializeInvitation(finalInvitation), ...delivery };
}

export async function listTeamInvitations(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  requireInviteManager(profile.role);
  const rows = (await supabaseServiceRequest<TeamInvitation[]>(`${INVITATION_TABLE}?select=${invitationSelect()}&company_id=eq.${encodeURIComponent(profile.company_id)}&order=created_at.desc&limit=500`)).map(asInvitation);
  const now = Date.now();
  await Promise.all(rows.filter((row) => row.status === "pending" && isInvitationExpired(row.expires_at, now)).map((row) => updateInvitation(row.id, { status: "expired" })));
  return rows.map((row) => serializeInvitation({ ...row, status: row.status === "pending" && isInvitationExpired(row.expires_at, now) ? "expired" : row.status }));
}

async function ownedInvitation(invitationId: string, companyId: string) {
  const rows = await supabaseServiceRequest<TeamInvitation[]>(`${INVITATION_TABLE}?select=${invitationSelect()}&invitation_id=eq.${encodeURIComponent(invitationId)}&company_id=eq.${encodeURIComponent(companyId)}&limit=1`);
  const row = rows[0] ? asInvitation(rows[0]) : null;
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Team invitation not found." });
  return row;
}

export async function resendTeamInvitation(req: CreateExpressContextOptions["req"], invitationId: string) {
  const { profile } = await resolveVerifiedProfile(req);
  requireInviteManager(profile.role);
  const row = await ownedInvitation(invitationId, profile.company_id);
  if (row.status === "accepted" || row.status === "revoked") throw new TRPCError({ code: "CONFLICT", message: "This invitation can no longer be resent." });
  const token = newInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString();
  await updateInvitation(row.id, { token_hash: hashInvitationToken(token), status: "pending", expires_at: expiresAt, delivery_error: null, revoked_at: null, email_sent_at: null });
  const refreshed = { ...row, token_hash: hashInvitationToken(token), status: "pending" as const, expires_at: expiresAt, delivery_error: null, revoked_at: null, email_sent_at: null };
  const delivery = await deliver(refreshed, token, req);
  return { invitation: serializeInvitation({ ...refreshed, status: delivery.delivered ? "pending" as const : "delivery_failed" as const, delivery_error: delivery.deliveryError, email_sent_at: delivery.delivered ? new Date().toISOString() : null }), ...delivery };
}

export async function revokeTeamInvitation(req: CreateExpressContextOptions["req"], invitationId: string) {
  const { profile } = await resolveVerifiedProfile(req);
  requireInviteManager(profile.role);
  const row = await ownedInvitation(invitationId, profile.company_id);
  if (row.status === "accepted") throw new TRPCError({ code: "CONFLICT", message: "Accepted invitations cannot be revoked." });
  await updateInvitation(row.id, { status: "revoked", revoked_at: new Date().toISOString() });
  return { success: true as const };
}

async function authenticatedIdentity(token: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Supabase verification is not configured." });
  const response = await fetch(`${ENV.supabaseUrl}/auth/v1/user`, { headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}` } });
  const identity = await response.json().catch(() => null) as { id?: string; email?: string } | null;
  if (!response.ok || !identity?.id || !identity.email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in with your invited email address to accept this invitation." });
  return { id: identity.id, email: identity.email.trim().toLowerCase() };
}

async function attachProfileToInvitation(profileId: string, companyId: string, role: string, fullName: string) {
  const { url, key } = requireSupabaseService();
  const currentResponse = await fetch(`${url}/rest/v1/profiles?select=id,company_id&id=eq.${encodeURIComponent(profileId)}&limit=1`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  const current = await currentResponse.json().catch(() => []) as Array<{ id?: string; company_id?: string | null }>;
  if (!currentResponse.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The invitation recipient profile could not be verified." });
  if (current[0]?.company_id && current[0].company_id !== companyId) throw new TRPCError({ code: "CONFLICT", message: "Your profile already belongs to another workspace." });
  const method = current[0]?.id ? "PATCH" : "POST";
  const path = current[0]?.id ? `profiles?id=eq.${encodeURIComponent(profileId)}` : "profiles";
  const response = await fetch(`${url}/rest/v1/${path}`, { method, headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ ...(current[0]?.id ? {} : { id: profileId, full_name: fullName }), company_id: companyId, role }) });
  const rows = await response.json().catch(() => []) as Array<{ id?: string }>;
  if (!response.ok || !rows[0]?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The workspace could not be assigned to your profile." });
}

export async function acceptTeamInvitation(req: CreateExpressContextOptions["req"], tokenValue: string) {
  const token = getBearerToken(req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to accept this invitation." });
  const rows = await supabaseServiceRequest<TeamInvitation[]>(`${INVITATION_TABLE}?select=${invitationSelect()}&token_hash=eq.${encodeURIComponent(hashInvitationToken(tokenValue))}&limit=1`);
  const row = rows[0] ? asInvitation(rows[0]) : null;
  if (!row || row.status !== "pending" || isInvitationExpired(row.expires_at)) throw new TRPCError({ code: "NOT_FOUND", message: "This invitation is invalid or has expired." });
  const identity = await authenticatedIdentity(token);
  if (identity.email !== row.email) throw new TRPCError({ code: "FORBIDDEN", message: "Sign in with the email address that received this invitation." });
  await attachProfileToInvitation(identity.id, row.company_id, row.role, row.full_name);
  await updateInvitation(row.id, { status: "accepted", accepted_by_profile_id: identity.id });
  return { companyId: row.company_id, role: row.role, fullName: row.full_name };
}
