import { createHash } from "node:crypto";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import { parseEmailRecipients, sendTransactionalEmail, workspaceEmailHtml } from "./transactionalEmail";

const FEEDBACK_CATEGORIES = ["bug", "feature", "ui", "general"] as const;
const feedbackWindowMs = 10 * 60 * 1000;
const feedbackWindowLimit = 3;
const recentSubmissions = new Map<string, number[]>();

export const publicFeedbackInput = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z.string().trim().min(10, "Please provide at least 10 characters of feedback.").max(3_000, "Feedback must be 3,000 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address.").max(320).optional().or(z.literal("")),
  name: z.string().trim().max(120, "Name must be 120 characters or fewer.").optional().or(z.literal("")),
  pagePath: z.string().trim().max(240).optional().or(z.literal("")),
  website: z.string().max(200).optional(),
});

type PublicFeedbackInput = z.infer<typeof publicFeedbackInput>;

function requestIdentity(req: CreateExpressContextOptions["req"]) {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const raw = typeof forwardedValue === "string" ? forwardedValue.split(",")[0]?.trim() : req.ip || req.socket.remoteAddress || "unknown";
  return raw || "unknown";
}

function throttleKey(req: CreateExpressContextOptions["req"]) {
  return createHash("sha256").update(requestIdentity(req)).digest("hex");
}

function enforceSubmissionLimit(req: CreateExpressContextOptions["req"]) {
  const now = Date.now();
  const key = throttleKey(req);
  const prior = (recentSubmissions.get(key) || []).filter((timestamp) => now - timestamp < feedbackWindowMs);
  if (prior.length >= feedbackWindowLimit) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many feedback submissions from this connection. Please try again later." });
  }
  recentSubmissions.set(key, [...prior, now]);
  if (recentSubmissions.size > 2_000) {
    recentSubmissions.forEach((timestamps, entryKey) => {
      if (!timestamps.some((timestamp) => now - timestamp < feedbackWindowMs)) recentSubmissions.delete(entryKey);
    });
  }
}

async function insertWebsiteFeedback(payload: Record<string, unknown>) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Feedback storage is not configured on the server." });
  }
  const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/website_feedback_submissions`, {
    method: "POST",
    headers: {
      accept: "application/json",
      apikey: ENV.supabaseSecretKey,
      authorization: `Bearer ${ENV.supabaseSecretKey}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await response.text().catch(() => undefined);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The feedback could not be saved. Please try again." });
  }
}

export async function submitPublicFeedback(req: CreateExpressContextOptions["req"], input: PublicFeedbackInput) {
  if (input.website?.trim()) {
    return { accepted: true } as const;
  }
  enforceSubmissionLimit(req);
  await insertWebsiteFeedback({
    category: input.category,
    message: input.message.trim(),
    name: input.name?.trim() || null,
    email: input.email?.trim() || null,
    page_path: input.pagePath?.trim() || "/",
    source: "public_website",
  });
  return { accepted: true } as const;
}


const FEEDBACK_ADMIN_ROLES = new Set(["super administrator", "platform administrator"]);
const FEEDBACK_STATUSES = ["new", "reviewing", "resolved", "dismissed"] as const;

export const websiteFeedbackReplyInput = z.object({
  feedbackId: z.string().uuid(),
  reply: z.string().trim().min(1, "Write a reply before saving.").max(3_000, "Reply must be 3,000 characters or fewer."),
  status: z.enum(FEEDBACK_STATUSES),
});

type FeedbackAdminRequest = CreateExpressContextOptions["req"];

async function requireFeedbackAdmin(req: FeedbackAdminRequest) {
  const { resolveVerifiedProfile } = await import("./aiApprovals");
  const resolved = await resolveVerifiedProfile(req);
  if (!FEEDBACK_ADMIN_ROLES.has(resolved.profile.role.trim().toLowerCase())) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Global Admin access is required to manage website feedback." });
  }
  return resolved;
}

async function requestWithServiceRole(path: string, init: RequestInit = {}) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Feedback administration is not configured on the server." });
  }
  const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      apikey: ENV.supabaseSecretKey,
      authorization: `Bearer ${ENV.supabaseSecretKey}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The feedback administration request could not be completed." });
  }
  return body;
}

export async function listWebsiteFeedback(req: FeedbackAdminRequest) {
  await requireFeedbackAdmin(req);
  const rows = await requestWithServiceRole("website_feedback_submissions?select=id,category,message,name,email,page_path,source,status,admin_reply,reviewed_at,reviewed_by,replied_at,replied_by,email_notification_status,email_notification_id,email_notification_sent_at,created_at&order=created_at.desc&limit=200") as unknown;
  return { feedback: Array.isArray(rows) ? rows : [] };
}

async function notifyFeedbackRecipient(feedback: Record<string, unknown>, reply: string) {
  const rawEmail = typeof feedback.email === "string" ? feedback.email.trim() : "";
  if (!rawEmail) return { status: "not_requested" as const };
  let recipients: string[];
  try {
    recipients = parseEmailRecipients(rawEmail, "recipient", 1);
  } catch {
    return { status: "failed" as const };
  }
  if (!ENV.feedbackReplyEmailNotifications || !ENV.resendApiKey.trim() || !ENV.resendFromEmail.trim()) {
    return { status: "disabled" as const };
  }
  const feedbackId = String(feedback.id || "");
  const recipientName = typeof feedback.name === "string" && feedback.name.trim() ? feedback.name.trim() : "there";
  const safeMessage = typeof feedback.message === "string" ? feedback.message : "";
  const subject = "Your Smart Manager feedback has been reviewed";
  const body = `Hello ${recipientName},\n\nThank you for sharing feedback with Smart Manager. Our team has reviewed your message and recorded the following response:\n\n${reply}\n\nYour original feedback was:\n${safeMessage}\n\nSmart Manager Team`;
  try {
    const delivery = await sendTransactionalEmail({
      to: recipients,
      subject,
      text: body,
      html: workspaceEmailHtml({ title: subject, preheader: "A response to your Smart Manager feedback", body }),
      category: "notification",
      providerDeliveryPurpose: "website_feedback_reply",
      idempotencyKey: `feedback-reply:${feedbackId}:${createHash("sha256").update(reply).digest("hex").slice(0, 16)}`,
    });
    return { status: "sent" as const, deliveryId: delivery.deliveryId, sentAt: delivery.acceptedAt };
  } catch {
    return { status: "failed" as const };
  }
}

export async function replyToWebsiteFeedback(req: FeedbackAdminRequest, input: z.infer<typeof websiteFeedbackReplyInput>) {
  const { profile } = await requireFeedbackAdmin(req);
  const encodedId = encodeURIComponent(input.feedbackId);
  const rows = await requestWithServiceRole(`website_feedback_submissions?id=eq.${encodedId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      admin_reply: input.reply.trim(),
      status: input.status,
      replied_at: new Date().toISOString(),
      replied_by: profile.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
    }),
  }) as unknown;
  const feedback = Array.isArray(rows) ? rows[0] : null;
  if (!feedback || typeof feedback !== "object" || !(feedback as { id?: unknown }).id) {
    throw new TRPCError({ code: "NOT_FOUND", message: "That feedback record could not be found." });
  }
  const emailNotification = await notifyFeedbackRecipient(feedback as Record<string, unknown>, input.reply.trim());
  await requestWithServiceRole(`website_feedback_submissions?id=eq.${encodedId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      email_notification_status: emailNotification.status,
      email_notification_id: "deliveryId" in emailNotification ? emailNotification.deliveryId : null,
      email_notification_sent_at: "sentAt" in emailNotification ? emailNotification.sentAt : null,
    }),
  });
  const { recordGlobalAdminAction } = await import("./globalAdmin");
  await recordGlobalAdminAction(req, {
    action: "REPLY_TO_WEBSITE_FEEDBACK",
    targetType: "website_feedback_submission",
    targetId: input.feedbackId,
    reason: "Global Admin recorded a reply and updated the website feedback status.",
    confirmationText: `CONFIRM:REPLY_TO_WEBSITE_FEEDBACK:${input.feedbackId}`,
    details: { status: input.status, replyLength: input.reply.trim().length, emailNotificationStatus: emailNotification.status },
  });
  return { feedback: { ...feedback as Record<string, unknown>, email_notification_status: emailNotification.status, email_notification_id: "deliveryId" in emailNotification ? emailNotification.deliveryId : null, email_notification_sent_at: "sentAt" in emailNotification ? emailNotification.sentAt : null }, emailNotification };
}
