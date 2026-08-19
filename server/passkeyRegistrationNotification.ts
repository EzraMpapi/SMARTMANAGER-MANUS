import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { workspaceEmailHtml } from "./transactionalEmail";

const ADMINISTRATOR_ROLES = new Set(["owner", "Owner", "Organization Owner", "CEO", "Super Administrator", "System Administrator"]);

type AuthUser = { id?: string; email?: string; user_metadata?: { full_name?: string; name?: string } };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
}

async function resolveAuthenticatedEmail(token: string): Promise<AuthUser & { email: string }> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Passkey notification verification is not configured." });
  const response = await fetch(`${ENV.supabaseUrl}/auth/v1/user`, { headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}` } });
  const user = await response.json().catch(() => null) as AuthUser | null;
  const email = user?.email;
  if (!response.ok || !user || !email) throw new TRPCError({ code: "UNAUTHORIZED", message: "The administrator email could not be verified for this passkey event." });
  return { ...user, email };
}

export async function notifyPasskeyRegistration(req: CreateExpressContextOptions["req"], input: { friendlyName?: string }) {
  const { profile, token } = await resolveVerifiedProfile(req);
  if (!ADMINISTRATOR_ROLES.has(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only an organization administrator can trigger passkey registration notifications." });
  const user = await resolveAuthenticatedEmail(token);
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !sender) return { delivered: false as const, reason: "delivery-not-configured" as const, companyId: profile.company_id };

  const email = user.email;
  const name = profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0] || "Administrator";
  const friendlyName = input.friendlyName?.trim().slice(0, 120) || "New passkey";
  const subject = "Smart Manager passkey registered";
  const body = `${name} registered a new administrator passkey (${friendlyName}) for the Smart Manager workspace on ${new Date().toLocaleString()}. If you did not perform this action, review the tenant security settings immediately.`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender,
      to: [email],
      subject,
      text: body,
      html: workspaceEmailHtml({ title: subject, preheader: "A new administrator passkey was registered", body }),
      headers: { "X-SmartManager-Event": "administrator.passkey.registered", "X-SmartManager-Company": profile.company_id },
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Passkey notification could not be delivered.${errorBody ? ` Provider response: ${escapeHtml(errorBody).slice(0, 180)}` : ""}` });
  }
  const delivery = await response.json().catch(() => ({})) as { id?: string };
  return { delivered: true as const, deliveryId: delivery.id || null, recipient: email, companyId: profile.company_id };
}
