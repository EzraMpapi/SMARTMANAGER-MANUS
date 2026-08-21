import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { ENV } from "./_core/env";
import { providerDeliveryStatusInput, recordProviderDeliveryStatus } from "./healthcareReminders";

export function verifyHealthcareSmsWebhookSignature(rawBody: Buffer, signature: string | undefined) {
  if (!ENV.healthcareSmsWebhookSecret || !signature) return false;
  const expected = createHmac("sha256", ENV.healthcareSmsWebhookSecret).update(rawBody).digest("hex");
  const supplied = signature.trim().replace(/^sha256=/i, "");
  const expectedBuffer = Buffer.from(expected, "hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function healthcareReminderDeliveryWebhookHandler(req: Request, res: Response) {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    if (!ENV.healthcareSmsWebhookSecret) return res.status(503).json({ error: "SMS delivery webhook is not configured." });
    if (!verifyHealthcareSmsWebhookSignature(rawBody, req.header("x-healthcare-sms-signature") || undefined)) return res.status(401).json({ error: "Invalid webhook signature." });
    const input = providerDeliveryStatusInput.parse(JSON.parse(rawBody.toString("utf8")));
    return res.status(200).json(await recordProviderDeliveryStatus(input));
  } catch {
    return res.status(400).json({ error: "Delivery status payload could not be processed." });
  }
}
