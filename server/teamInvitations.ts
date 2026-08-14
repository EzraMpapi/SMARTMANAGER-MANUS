import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { teamInvitations, type TeamInvitation } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { sendTransactionalEmail } from "./transactionalEmail";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITATION_MANAGER_ROLES = new Set(["Organization Owner", "CEO", "Super Administrator", "System Administrator", "HR Manager"]);
const INVITABLE_ROLES = new Set(["Finance Manager", "HR Manager", "Sales Manager", "Sales Representative", "Warehouse Staff", "Accountant", "Viewer"]);

type InviteInput = { fullName: string; email: string; role: string };

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

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Team invitations are temporarily unavailable." });
  return db;
}

function serializeInvitation(row: TeamInvitation) {
  return {
    id: row.invitationId,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    emailSentAt: row.emailSentAt?.toISOString() ?? null,
    deliveryError: row.deliveryError ?? null,
  };
}

async function sendInvitationEmail({ to, fullName, role, companyName, inviteUrl }: { to: string; fullName: string; role: string; companyName: string; inviteUrl: string }) {
  const text = `Hello ${fullName},\n\nYou have been invited to join ${companyName} as ${role} in Smart Manager. Accept your invitation: ${inviteUrl}\n\nThis secure invitation expires in seven days. Sign in or create an account with ${to} to continue.`;
  const delivered = await sendTransactionalEmail({ to: [to], subject: `You’re invited to ${companyName} on Smart Manager`, text, html: `<p>Hello ${escapeHtml(fullName)},</p><p>You have been invited to join <strong>${escapeHtml(companyName)}</strong> as a <strong>${escapeHtml(role)}</strong> in Smart Manager.</p><p><a href="${escapeHtml(inviteUrl)}">Accept your invitation</a></p><p>This secure invitation expires in seven days. Sign in or create an account with <strong>${escapeHtml(to)}</strong> to continue.</p>`, category: "invitation" });
  return delivered.deliveryId;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character] || character));
}

async function companyNameForInvitation(companyId: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Server-side company lookup is not configured.");
  const params = new URLSearchParams({ select: "name", id: `eq.${companyId}`, limit: "1" });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/companies?${params.toString()}`, { headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}` } });
  const rows = await response.json().catch(() => []) as Array<{ name?: string }>;
  if (!response.ok || !rows[0]?.name) throw new Error("Workspace details could not be verified.");
  return rows[0].name;
}

async function deliver(db: Awaited<ReturnType<typeof requireDb>>, row: TeamInvitation, token: string, req: CreateExpressContextOptions["req"]) {
  try {
    const companyName = await companyNameForInvitation(row.companyId);
    const deliveryMessageId = await sendInvitationEmail({
      to: row.email,
      fullName: row.fullName,
      role: row.role,
      companyName,
      inviteUrl: `${invitationOrigin(req)}/app?invite=${encodeURIComponent(token)}`,
    });
    await db.update(teamInvitations).set({ status: "pending", deliveryMessageId, deliveryError: null, emailSentAt: new Date() }).where(eq(teamInvitations.id, row.id));
    return { delivered: true as const, deliveryError: null };
  } catch (error) {
    const deliveryError = error instanceof Error ? error.message.slice(0, 500) : "Invitation delivery failed.";
    await db.update(teamInvitations).set({ status: "delivery_failed", deliveryError }).where(eq(teamInvitations.id, row.id));
    return { delivered: false as const, deliveryError };
  }
}

export async function createTeamInvitation(req: CreateExpressContextOptions["req"], input: InviteInput) {
  const { profile } = await resolveVerifiedProfile(req);
  requireInviteManager(profile.role);
  const invite = validateInvite(input);
  const db = await requireDb();
  const token = newInvitationToken();
  const now = new Date();
  const [result] = await db.insert(teamInvitations).values({
    invitationId: `inv_${randomBytes(12).toString("hex")}`,
    companyId: profile.company_id,
    email: invite.email,
    fullName: invite.fullName,
    role: invite.role,
    tokenHash: hashInvitationToken(token),
    status: "pending",
    invitedByProfileId: profile.id,
    invitedByRole: profile.role,
    expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
  });
  const invitationId = Number((result as { insertId?: number }).insertId);
  const created = (await db.select().from(teamInvitations).where(eq(teamInvitations.id, invitationId)).limit(1))[0];
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The invitation could not be created." });
  const delivery = await deliver(db, created, token, req);
  return { invitation: serializeInvitation({ ...created, status: delivery.delivered ? "pending" : "delivery_failed", deliveryError: delivery.deliveryError, emailSentAt: delivery.delivered ? new Date() : null }), ...delivery };
}

export async function listTeamInvitations(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  requireInviteManager(profile.role);
  const db = await requireDb();
  const rows = await db.select().from(teamInvitations).where(eq(teamInvitations.companyId, profile.company_id)).orderBy(desc(teamInvitations.createdAt));
  const now = Date.now();
  await Promise.all(rows.filter((row) => row.status === "pending" && isInvitationExpired(row.expiresAt, now)).map((row) => db.update(teamInvitations).set({ status: "expired" }).where(eq(teamInvitations.id, row.id))));
  return rows.map((row) => serializeInvitation({ ...row, status: row.status === "pending" && isInvitationExpired(row.expiresAt, now) ? "expired" : row.status }));
}

async function ownedInvitation(db: Awaited<ReturnType<typeof requireDb>>, invitationId: string, companyId: string) {
  const row = (await db.select().from(teamInvitations).where(and(eq(teamInvitations.invitationId, invitationId), eq(teamInvitations.companyId, companyId))).limit(1))[0];
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Team invitation not found." });
  return row;
}

export async function resendTeamInvitation(req: CreateExpressContextOptions["req"], invitationId: string) {
  const { profile } = await resolveVerifiedProfile(req);
  requireInviteManager(profile.role);
  const db = await requireDb();
  const row = await ownedInvitation(db, invitationId, profile.company_id);
  if (row.status === "accepted" || row.status === "revoked") throw new TRPCError({ code: "CONFLICT", message: "This invitation can no longer be resent." });
  const token = newInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  await db.update(teamInvitations).set({ tokenHash: hashInvitationToken(token), status: "pending", expiresAt, deliveryError: null, revokedAt: null }).where(eq(teamInvitations.id, row.id));
  const refreshed = { ...row, tokenHash: hashInvitationToken(token), status: "pending" as const, expiresAt, deliveryError: null, revokedAt: null };
  const delivery = await deliver(db, refreshed, token, req);
  return { invitation: serializeInvitation({ ...refreshed, status: delivery.delivered ? "pending" : "delivery_failed", deliveryError: delivery.deliveryError, emailSentAt: delivery.delivered ? new Date() : null }), ...delivery };
}

export async function revokeTeamInvitation(req: CreateExpressContextOptions["req"], invitationId: string) {
  const { profile } = await resolveVerifiedProfile(req);
  requireInviteManager(profile.role);
  const db = await requireDb();
  const row = await ownedInvitation(db, invitationId, profile.company_id);
  if (row.status === "accepted") throw new TRPCError({ code: "CONFLICT", message: "Accepted invitations cannot be revoked." });
  await db.update(teamInvitations).set({ status: "revoked", revokedAt: new Date() }).where(eq(teamInvitations.id, row.id));
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
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Invitation acceptance is not configured." });
  const currentResponse = await fetch(`${ENV.supabaseUrl}/rest/v1/profiles?select=id,company_id&id=eq.${encodeURIComponent(profileId)}&limit=1`, {
    headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}` },
  });
  const current = await currentResponse.json().catch(() => []) as Array<{ id?: string; company_id?: string | null }>;
  if (!currentResponse.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The invitation recipient profile could not be verified." });
  if (current[0]?.company_id && current[0].company_id !== companyId) throw new TRPCError({ code: "CONFLICT", message: "Your profile already belongs to another workspace." });
  const method = current[0]?.id ? "PATCH" : "POST";
  const path = current[0]?.id ? `profiles?id=eq.${encodeURIComponent(profileId)}` : "profiles";
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ ...(current[0]?.id ? {} : { id: profileId, full_name: fullName }), company_id: companyId, role }),
  });
  const rows = await response.json().catch(() => []) as Array<{ id?: string }>;
  if (!response.ok || !rows[0]?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The workspace could not be assigned to your profile." });
}

export async function acceptTeamInvitation(req: CreateExpressContextOptions["req"], tokenValue: string) {
  const candidate = req.headers["x-supabase-authorization"] || req.headers.authorization;
  const rawToken = Array.isArray(candidate) ? candidate[0] : candidate;
  const token = rawToken?.startsWith("Bearer ") ? rawToken.slice(7) : "";
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to accept this invitation." });
  const db = await requireDb();
  const row = (await db.select().from(teamInvitations).where(eq(teamInvitations.tokenHash, hashInvitationToken(tokenValue))).limit(1))[0];
  if (!row || row.status !== "pending" || isInvitationExpired(row.expiresAt)) throw new TRPCError({ code: "NOT_FOUND", message: "This invitation is invalid or has expired." });
  const identity = await authenticatedIdentity(token);
  if (identity.email !== row.email) throw new TRPCError({ code: "FORBIDDEN", message: "Sign in with the email address that received this invitation." });
  await attachProfileToInvitation(identity.id, row.companyId, row.role, row.fullName);
  await db.update(teamInvitations).set({ status: "accepted", acceptedByProfileId: identity.id }).where(eq(teamInvitations.id, row.id));
  return { companyId: row.companyId, role: row.role, fullName: row.fullName };
}
