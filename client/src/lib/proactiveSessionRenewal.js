const DEFAULT_RENEWAL_DELAY_MS = 25 * 60 * 1000;
const MIN_RENEWAL_DELAY_MS = 5 * 1000;
const RENEW_BEFORE_EXPIRY_MS = 2 * 60 * 1000;

function decodeBase64UrlJson(value) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    return JSON.parse(atob(base64));
  } catch (_error) {
    return null;
  }
}

export function getAccessTokenExpiryMs(accessToken) {
  if (typeof accessToken !== "string") return null;
  const encodedPayload = accessToken.split(".")[1];
  if (!encodedPayload) return null;
  const payload = decodeBase64UrlJson(encodedPayload);
  const exp = Number(payload?.exp);
  return Number.isFinite(exp) && exp > 0 ? exp * 1000 : null;
}

export function getProactiveSessionRenewalDelay(accessToken, now = Date.now()) {
  const expiryMs = getAccessTokenExpiryMs(accessToken);
  if (!expiryMs) return DEFAULT_RENEWAL_DELAY_MS;
  return Math.max(MIN_RENEWAL_DELAY_MS, expiryMs - now - RENEW_BEFORE_EXPIRY_MS);
}

export function isTerminalSessionRefreshError(error) {
  const status = Number(error?.status);
  const message = String(error?.message || "").toLowerCase();
  return [400, 401, 403].includes(status) || message.includes("invalid_grant") || message.includes("refresh token");
}

export const sessionRenewalTiming = {
  defaultDelayMs: DEFAULT_RENEWAL_DELAY_MS,
  minimumDelayMs: MIN_RENEWAL_DELAY_MS,
  renewBeforeExpiryMs: RENEW_BEFORE_EXPIRY_MS,
};
