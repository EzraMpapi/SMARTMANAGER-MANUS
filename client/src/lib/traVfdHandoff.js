export const OFFICIAL_TRA_TAXPAYER_PORTAL = "https://taxpayerportal.tra.go.tz/";
export const OFFICIAL_TRA_RECEIPT_VERIFICATION = "https://verify.tra.go.tz/";

export const TRA_VFD_STATUSES = [
  "AWAITING_HANDOFF",
  "SUBMITTED_EXTERNALLY",
  "VERIFICATION_CAPTURED",
  "READY_TO_PRINT",
];

export function normalizeTraReceiptUrl(value = "") {
  const candidate = String(value).trim();
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.hostname !== "verify.tra.go.tz") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeTraVerificationCode(value = "") {
  return String(value).trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 120);
}

export function resolveTraVfdStatus(evidence = {}) {
  const receiptUrl = normalizeTraReceiptUrl(evidence.receiptUrl);
  if (receiptUrl) return "READY_TO_PRINT";
  if (normalizeTraVerificationCode(evidence.verificationCode)) return "VERIFICATION_CAPTURED";
  if (evidence.submittedExternallyAt) return "SUBMITTED_EXTERNALLY";
  return "AWAITING_HANDOFF";
}

export function buildTraVfdEvidence(input = {}) {
  const receiptUrl = normalizeTraReceiptUrl(input.receiptUrl);
  const verificationCode = normalizeTraVerificationCode(input.verificationCode);
  const submittedExternallyAt = input.submittedExternallyAt || null;
  return {
    status: resolveTraVfdStatus({ receiptUrl, verificationCode, submittedExternallyAt }),
    receiptUrl: receiptUrl || null,
    verificationCode: verificationCode || null,
    submittedExternallyAt,
    updatedAt: new Date().toISOString(),
    source: "operator_confirmed_external_tra_portal",
  };
}
