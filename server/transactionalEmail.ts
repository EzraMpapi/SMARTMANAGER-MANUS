import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";

type Attachment = { filename: string; content: Buffer | string; contentType?: string };
type SendInput = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
  category: "manual" | "invitation" | "report" | "notification";
};

const EMAIL_SENDER_ROLES = new Set(["Organization Owner", "CEO", "Super Administrator", "System Administrator", "Sales Manager", "Sales Representative", "Finance Manager", "HR Manager", "Customer Support"]);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
}

export function parseEmailRecipients(value: string | undefined, label: string, max = 20) {
  if (!value?.trim()) return [];
  const addresses = value.split(/[;,]/).map((entry) => {
    const match = entry.trim().match(/<([^>]+)>$/);
    return (match?.[1] || entry).trim().toLowerCase();
  }).filter(Boolean);
  if (addresses.length > max || addresses.some((address) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Enter up to ${max} valid ${label} email address${max === 1 ? "" : "es"}.` });
  }
  return Array.from(new Set(addresses));
}

export function workspaceEmailHtml({ title, preheader, body }: { title: string; preheader: string; body: string }) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  const safeBody = escapeHtml(body).replace(/\r?\n/g, "<br />");
  return `<!doctype html><html><body style="margin:0;background:#f4f7f6;font-family:Inter,Arial,sans-serif;color:#172033"><span style="display:none!important;opacity:0;color:transparent;height:0;width:0">${safePreheader}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px;background:#f4f7f6"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden"><tr><td style="background:#0b2d22;padding:22px 28px;color:#ffffff"><strong style="font-size:18px">Smart Manager</strong><span style="display:block;margin-top:4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a7f3d0">Enterprise ERP</span></td></tr><tr><td style="padding:30px 28px"><h1 style="margin:0 0 14px;font-size:23px;line-height:1.25;color:#111827">${safeTitle}</h1><p style="margin:0;font-size:15px;line-height:1.7;color:#475569">${safeBody}</p></td></tr><tr><td style="padding:18px 28px;border-top:1px solid #e5e7eb;font-size:11px;line-height:1.5;color:#94a3b8">This message was sent by an authorised Smart Manager workspace user. Do not share sensitive credentials by email.</td></tr></table></td></tr></table></body></html>`;
}

export async function sendTransactionalEmail(input: SendInput) {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace email delivery is not configured." });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${ENV.resendApiKey}` },
    body: JSON.stringify({
      from: ENV.resendFromEmail,
      to: input.to,
      ...(input.cc?.length ? { cc: input.cc } : {}),
      ...(input.bcc?.length ? { bcc: input.bcc } : {}),
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: [{ name: "category", value: input.category }],
      ...(input.attachments?.length ? { attachments: input.attachments.map((attachment) => ({ filename: attachment.filename, content: Buffer.isBuffer(attachment.content) ? attachment.content.toString("base64") : attachment.content, content_type: attachment.contentType })) } : {}),
    }),
  });
  const body = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok || !body.id) {
    console.warn("[TransactionalEmail] Provider rejected delivery", { status: response.status, category: input.category });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The email provider could not accept this message. No email was sent; please try again." });
  }
  return { deliveryId: body.id, acceptedAt: new Date().toISOString() };
}

export async function sendWorkspaceEmail(req: CreateExpressContextOptions["req"], input: { to: string; cc?: string; bcc?: string; subject: string; body: string }) {
  const { profile } = await resolveVerifiedProfile(req);
  if (!EMAIL_SENDER_ROLES.has(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Your workspace role cannot send company emails." });
  const to = parseEmailRecipients(input.to, "recipient");
  if (!to.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Add at least one recipient email address." });
  const cc = parseEmailRecipients(input.cc, "CC");
  const bcc = parseEmailRecipients(input.bcc, "BCC");
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject || subject.length > 160 || !body || body.length > 12_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a subject up to 160 characters and a message up to 12,000 characters." });
  const delivery = await sendTransactionalEmail({ to, cc, bcc, subject, text: body, html: workspaceEmailHtml({ title: subject, preheader: "Message from your Smart Manager workspace", body }), category: "manual" });
  return { ...delivery, recipientCount: to.length + cc.length + bcc.length, companyId: profile.company_id };
}
