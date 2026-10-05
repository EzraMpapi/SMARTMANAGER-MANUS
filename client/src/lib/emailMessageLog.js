const EMAIL_STATUSES = new Set(["draft", "queued", "sending", "sent", "delivered", "failed", "cancelled"]);
const DELIVERY_EVENTS = new Set(["queued", "sending", "sent", "delivered", "bounced", "complained", "opened", "clicked", "failed"]);

export function normalizeEmailRecipients(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function previewEmailBody(body, maxLength = 240) {
  const normalized = String(body || "").replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

export function normalizeAttachmentMetadata(attachments = []) {
  return (Array.isArray(attachments) ? attachments : []).map((file) => ({
    name: file?.name || "attachment",
    mimeType: file?.type || file?.mimeType || "application/octet-stream",
    size: Number.isFinite(file?.size) ? file.size : null,
  }));
}

export function buildEmailMessageLogPayload({
  companyId,
  communicationId = null,
  senderEmail = "smatimeneja@gmail.com",
  to = [],
  cc = [],
  bcc = [],
  subject = "",
  bodyText = "",
  bodyHtml = null,
  attachments = [],
  status = "queued",
  provider = "gmail",
  providerMessageId = null,
  threadId = null,
  createdBy = null,
  metadata = {},
} = {}) {
  const safeStatus = EMAIL_STATUSES.has(status) ? status : "queued";
  const recipients = normalizeEmailRecipients(to);
  const copiedRecipients = normalizeEmailRecipients(cc);
  const blindRecipients = normalizeEmailRecipients(bcc);
  const now = new Date().toISOString();

  return {
    company_id: companyId,
    communication_id: communicationId,
    provider,
    provider_message_id: providerMessageId,
    thread_id: threadId,
    sender_email: senderEmail,
    to_recipients: recipients,
    cc_recipients: copiedRecipients,
    bcc_recipients: blindRecipients,
    subject: String(subject || "").trim(),
    body_text: String(bodyText || ""),
    body_html: bodyHtml || null,
    body_preview: previewEmailBody(bodyText),
    attachment_metadata: normalizeAttachmentMetadata(attachments),
    status: safeStatus,
    metadata,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };
}

export function buildEmailDeliveryEventPayload({
  companyId,
  emailMessageId,
  eventType,
  provider = "gmail",
  providerEventId = null,
  providerMessageId = null,
  eventStatus = null,
  errorCode = null,
  errorMessage = null,
  payload = {},
  occurredAt = new Date().toISOString(),
} = {}) {
  if (!DELIVERY_EVENTS.has(eventType)) throw new Error(`Unsupported email delivery event: ${eventType}`);
  return {
    company_id: companyId,
    email_message_id: emailMessageId,
    provider,
    provider_event_id: providerEventId,
    provider_message_id: providerMessageId,
    event_type: eventType,
    event_status: eventStatus,
    error_code: errorCode,
    error_message: errorMessage,
    payload,
    occurred_at: occurredAt,
    received_at: new Date().toISOString(),
  };
}

export function emailStatusForDeliveryEvent(eventType) {
  if (["queued", "sending", "sent", "delivered"].includes(eventType)) return eventType;
  if (["bounced", "complained", "failed"].includes(eventType)) return "failed";
  return null;
}

export { EMAIL_STATUSES, DELIVERY_EVENTS };
