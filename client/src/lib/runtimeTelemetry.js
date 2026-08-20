export function sanitizeErrorMessage(message) {
  if (typeof message !== "string") return "Unknown error";
  return message
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/password['"]?\s*[:=]\s*['"]?[^'"\s]+['"]?/gi, "password: [REDACTED]")
    .replace(/[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
}

export function reportRuntimeError(error, errorInfo = {}) {
  if (typeof window === "undefined") return;
  const sanitizedMessage = sanitizeErrorMessage(error?.message || String(error));
  const telemetryPayload = {
    message: sanitizedMessage,
    stack: sanitizeErrorMessage(error?.stack || ""),
    componentStack: sanitizeErrorMessage(errorInfo?.componentStack || ""),
    timestamp: Date.now(),
    href: window.location.href,
  };

  try {
    const existing = JSON.parse(window.localStorage.getItem("bs_runtime_error_telemetry") || "[]");
    const updated = [telemetryPayload, ...existing].slice(0, 25);
    window.localStorage.setItem("bs_runtime_error_telemetry", JSON.stringify(updated));
  } catch (_e) {
    // Storage quota or privacy mode restriction handled gracefully
  }

  if (import.meta.env.DEV) {
    console.info("[RuntimeTelemetry] Recorded safe error log:", sanitizedMessage);
  }
}

// Session recovery events intentionally contain only a coarse outcome,
// source, and timestamp—never tokens, identities, tenant details, URLs,
// raw errors, or request data.
export function reportSessionRefreshOutcome(outcome, source) {
  if (typeof window === "undefined") return;
  const event = { type: "session_refresh", outcome, source, timestamp: Date.now() };
  try {
    const existing = JSON.parse(window.localStorage.getItem("bs_session_refresh_telemetry") || "[]");
    const safeEvents = Array.isArray(existing) ? existing.filter((item) => item && item.type === "session_refresh" && typeof item.outcome === "string" && typeof item.source === "string" && typeof item.timestamp === "number") : [];
    window.localStorage.setItem("bs_session_refresh_telemetry", JSON.stringify([event, ...safeEvents].slice(0, 25)));
  } catch (_storageError) {
    // Private mode and storage quota failures must never block sign-in recovery.
  }
}
