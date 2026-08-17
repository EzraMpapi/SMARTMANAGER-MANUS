import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { getBirdWhatsAppProviderReadiness } from "./whatsappProvider";

const SUPPORT_ROLES = new Set([
  "Organization Owner",
  "CEO",
  "Super Administrator",
  "System Administrator",
  "Support Manager",
  "Support Agent",
]);
const SUPPORT_CONFIGURATION_ROLES = new Set([
  "Organization Owner",
  "CEO",
  "Super Administrator",
  "System Administrator",
  "Support Manager",
]);

const SUPPORT_STATUSES = new Set(["Open", "In Progress", "Waiting", "Resolved", "Closed"]);
const SUPPORT_PRIORITIES = new Set(["Low", "Medium", "High", "Urgent"]);
const SUPPORT_CHANNELS = new Set(["manual", "web", "email", "whatsapp", "phone"]);

type SupportProfile = { id: string; company_id: string; role: string; full_name: string | null };
type SupportTicketRow = { id: string; company_id: string; doc_number?: string | null; subject?: string | null; customer?: string | null; category?: string | null; assignee?: string | null; status?: string | null; priority?: string | null; assigned_profile_id?: string | null; team_id?: string | null; source_channel?: string | null; customer_reference?: string | null; due_at?: string | null; created_at?: string | null; updated_at?: string | null };

function requireSupportRole(profile: SupportProfile, configuration = false) {
  const roles = configuration ? SUPPORT_CONFIGURATION_ROLES : SUPPORT_ROLES;
  if (!roles.has(profile.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your verified workspace role cannot perform this support operation." });
  }
}

async function requestWithSession(path: string, token: string, init: RequestInit = {}) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Support operations are not configured for this workspace." });
  }
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
  if (!response.ok) {
    throw new TRPCError({ code: "FORBIDDEN", message: "The support operation could not be confirmed for this workspace." });
  }
  return body;
}

function supportNumber() {
  return `SUP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function recordActivity(token: string, profile: SupportProfile, ticketId: string, eventType: string, details: Record<string, unknown>) {
  const rows = await requestWithSession("support_ticket_activity", token, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      company_id: profile.company_id,
      ticket_id: ticketId,
      actor_profile_id: profile.id,
      event_type: eventType,
      details,
    }),
  });
  return rows?.[0] ?? null;
}

async function getTicket(token: string, ticketId: string) {
  const rows = await requestWithSession(`support_tickets?select=*&id=eq.${encodeURIComponent(ticketId)}&limit=1`, token) as SupportTicketRow[];
  const ticket = rows[0];
  if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "The support ticket is unavailable in this workspace." });
  return ticket;
}

export async function listSupportTickets(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requireSupportRole(profile);
  const rows = await requestWithSession("support_tickets?select=id,doc_number,subject,customer,category,priority,status,assignee,assigned_profile_id,team_id,source_channel,customer_reference,due_at,resolved_at,closed_at,created_at,updated_at&order=updated_at.desc&limit=100", token);
  return { tickets: rows as SupportTicketRow[], profile };
}

export async function getSupportWhatsAppProviderReadiness(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  requireSupportRole(profile);
  return { ...getBirdWhatsAppProviderReadiness(), profile };
}

export async function createSupportTicket(req: CreateExpressContextOptions["req"], input: { subject: string; customer: string; category?: string; priority?: string; sourceChannel?: string; customerReference?: string; initialMessage?: string; teamId?: string; dueAt?: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requireSupportRole(profile);
  const priority = input.priority || "Medium";
  const sourceChannel = input.sourceChannel || "manual";
  if (!SUPPORT_PRIORITIES.has(priority) || !SUPPORT_CHANNELS.has(sourceChannel)) throw new TRPCError({ code: "BAD_REQUEST", message: "Use a supported ticket priority and source channel." });

  const rows = await requestWithSession("support_tickets", token, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      company_id: profile.company_id,
      doc_number: supportNumber(),
      subject: input.subject.trim(),
      customer: input.customer.trim(),
      category: input.category?.trim() || "General",
      priority,
      status: "Open",
      source_channel: sourceChannel,
      customer_reference: input.customerReference?.trim() || null,
      team_id: input.teamId || null,
      due_at: input.dueAt || null,
      notes: input.initialMessage?.trim() || null,
    }),
  }) as SupportTicketRow[];
  const ticket = rows[0];
  if (!ticket?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The support ticket was not confirmed by the server." });
  const activity = await recordActivity(token, profile, ticket.id, "ticket_created", { sourceChannel, priority, initialMessagePresent: Boolean(input.initialMessage?.trim()) });
  return { ticket, activity, profile };
}

export async function updateSupportTicket(req: CreateExpressContextOptions["req"], input: { ticketId: string; status?: string; priority?: string; assignedProfileId?: string | null; teamId?: string | null; dueAt?: string | null }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const changingAssignment = Object.prototype.hasOwnProperty.call(input, "assignedProfileId") || Object.prototype.hasOwnProperty.call(input, "teamId") || Object.prototype.hasOwnProperty.call(input, "dueAt");
  requireSupportRole(profile, changingAssignment);
  const ticket = await getTicket(token, input.ticketId);
  const patch: Record<string, unknown> = {};
  if (input.status !== undefined) {
    if (!SUPPORT_STATUSES.has(input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Use a supported support-ticket status." });
    patch.status = input.status;
    if (input.status === "Resolved") patch.resolved_at = new Date().toISOString();
    if (input.status === "Closed") patch.closed_at = new Date().toISOString();
  }
  if (input.priority !== undefined) {
    if (!SUPPORT_PRIORITIES.has(input.priority)) throw new TRPCError({ code: "BAD_REQUEST", message: "Use a supported support-ticket priority." });
    patch.priority = input.priority;
  }
  if (Object.prototype.hasOwnProperty.call(input, "assignedProfileId")) patch.assigned_profile_id = input.assignedProfileId;
  if (Object.prototype.hasOwnProperty.call(input, "teamId")) patch.team_id = input.teamId;
  if (Object.prototype.hasOwnProperty.call(input, "dueAt")) patch.due_at = input.dueAt;
  if (!Object.keys(patch).length) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose at least one ticket field to update." });

  const rows = await requestWithSession(`support_tickets?id=eq.${encodeURIComponent(ticket.id)}`, token, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  }) as SupportTicketRow[];
  const updated = rows[0];
  if (!updated?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The ticket update was not confirmed by the server." });
  const activity = await recordActivity(token, profile, updated.id, "ticket_updated", { changed: Object.keys(patch) });
  return { ticket: updated, activity, profile };
}

export async function addSupportInternalNote(req: CreateExpressContextOptions["req"], input: { ticketId: string; body: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requireSupportRole(profile);
  const ticket = await getTicket(token, input.ticketId);
  const rows = await requestWithSession("support_ticket_notes", token, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ company_id: profile.company_id, ticket_id: ticket.id, author_profile_id: profile.id, body: input.body.trim(), kind: "internal_note" }),
  });
  const note = rows?.[0];
  if (!note?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The internal note was not confirmed by the server." });
  const activity = await recordActivity(token, profile, ticket.id, "internal_note_created", { noteId: note.id });
  return { note, activity, profile };
}

export async function listSupportTicketTimeline(req: CreateExpressContextOptions["req"], ticketId: string) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requireSupportRole(profile);
  const ticket = await getTicket(token, ticketId);
  const [messages, notes, activity] = await Promise.all([
    requestWithSession(`support_ticket_messages?select=id,body,sender_kind,sender_profile_id,channel,is_internal,delivery_status,provider_message_id,sent_at&ticket_id=eq.${encodeURIComponent(ticket.id)}&order=sent_at.asc&limit=200`, token),
    requestWithSession(`support_ticket_notes?select=id,body,author_profile_id,kind,created_at&ticket_id=eq.${encodeURIComponent(ticket.id)}&order=created_at.asc&limit=200`, token),
    requestWithSession(`support_ticket_activity?select=id,actor_profile_id,event_type,details,created_at&ticket_id=eq.${encodeURIComponent(ticket.id)}&order=created_at.asc&limit=200`, token),
  ]);
  return { ticket, messages, notes, activity, profile };
}
