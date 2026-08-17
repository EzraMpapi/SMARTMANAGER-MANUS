import { TRPCError } from "@trpc/server";

export const BIRD_WHATSAPP_OUTBOUND_STATUSES = [
  "draft",
  "queued",
  "sending",
  "accepted",
  "sent",
  "delivered",
  "read",
  "failed",
  "via-link",
] as const;

export type BirdWhatsAppOutboundStatus = (typeof BIRD_WHATSAPP_OUTBOUND_STATUSES)[number];

type BirdEnvironment = {
  BIRD_API_KEY?: string;
  BIRD_WEBHOOK_SIGNING_SECRET?: string;
  BIRD_WORKSPACE_ID?: string;
  BIRD_WHATSAPP_CHANNEL_ID?: string;
  BIRD_WHATSAPP_DELIVERY_ENABLED?: string;
};

const REQUIRED_BIRD_CONFIGURATION: Array<keyof BirdEnvironment> = [
  "BIRD_API_KEY",
  "BIRD_WEBHOOK_SIGNING_SECRET",
  "BIRD_WORKSPACE_ID",
  "BIRD_WHATSAPP_CHANNEL_ID",
];

const ALLOWED_TRANSITIONS: Record<BirdWhatsAppOutboundStatus, BirdWhatsAppOutboundStatus[]> = {
  draft: ["queued", "failed", "via-link"],
  queued: ["sending", "failed"],
  sending: ["accepted", "failed"],
  accepted: ["sent", "failed"],
  sent: ["delivered", "failed"],
  delivered: ["read", "failed"],
  read: [],
  failed: [],
  "via-link": [],
};

function missingConfiguration(environment: BirdEnvironment) {
  return REQUIRED_BIRD_CONFIGURATION.filter((key) => !environment[key]?.trim());
}

/**
 * Returns safe, non-secret configuration metadata. This is intentionally the
 * only Bird configuration returned to a browser-facing procedure.
 */
export function getBirdWhatsAppProviderReadiness(environment: BirdEnvironment = process.env as BirdEnvironment): {
  configured: boolean;
  deliveryEnabled: boolean;
  missingConfiguration: Array<keyof BirdEnvironment>;
  message: string;
} {
  const missing = missingConfiguration(environment);
  const configured = missing.length === 0;
  const deliveryEnabled = configured && environment.BIRD_WHATSAPP_DELIVERY_ENABLED === "true";

  if (!configured) {
    return {
      configured: false,
      deliveryEnabled: false,
      missingConfiguration: missing,
      message: "Bird WhatsApp delivery is inactive. Configure the server-only API key, webhook signing secret, workspace ID, and channel ID before activation.",
    };
  }

  if (!deliveryEnabled) {
    return {
      configured: true,
      deliveryEnabled: false,
      missingConfiguration: [],
      message: "Bird WhatsApp credentials are present, but automated delivery remains disabled until an administrator explicitly enables the verified provider boundary.",
    };
  }

  return {
    configured: true,
    deliveryEnabled: true,
    missingConfiguration: [],
    message: "Bird WhatsApp delivery is enabled. Accepted, sent, delivered, and read states remain provider-confirmed only.",
  };
}

/**
 * Guard for the future server-only transport implementation. No caller may
 * send directly unless secrets and the explicit delivery flag are present.
 */
export function requireBirdWhatsAppOutboundProvider(environment: BirdEnvironment = process.env as BirdEnvironment) {
  const readiness = getBirdWhatsAppProviderReadiness(environment);
  if (!readiness.deliveryEnabled) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: readiness.message,
    });
  }
  return readiness;
}

/**
 * Prevents UI or webhook code from claiming a lifecycle state that has not
 * been confirmed by the appropriate provider stage. A Bird HTTP 202 advances
 * only to `accepted`; later states require verified provider events.
 */
export function assertBirdWhatsAppStatusTransition(from: BirdWhatsAppOutboundStatus, to: BirdWhatsAppOutboundStatus) {
  if (!BIRD_WHATSAPP_OUTBOUND_STATUSES.includes(from) || !BIRD_WHATSAPP_OUTBOUND_STATUSES.includes(to)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Use a supported WhatsApp delivery state." });
  }
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new TRPCError({ code: "CONFLICT", message: `A WhatsApp message cannot move from ${from} to ${to} without a confirmed provider event.` });
  }
  return to;
}
