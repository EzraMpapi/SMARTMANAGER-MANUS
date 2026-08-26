import { createHash } from "node:crypto";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";

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
