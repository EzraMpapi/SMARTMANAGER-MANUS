export function sanitizeErrorMessage(message: unknown): string {
  if (typeof message !== "string") return "Unknown error";
  return message
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/password['"]?\s*[:=]\s*['"]?[^'"\s]+['"]?/gi, "password: [REDACTED]")
    .replace(/[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
}

export interface RuntimeTelemetryPayload {
  message: string;
  stack: string;
  componentStack: string;
  timestamp: number;
  href: string;
}

export function reportRuntimeError(error: unknown, errorInfo?: { componentStack?: string | null }): void {
  if (typeof window === "undefined") return;
  const rawMsg = error instanceof Error ? error.message : String(error);
  const rawStack = error instanceof Error ? error.stack || "" : "";
  const sanitizedMessage = sanitizeErrorMessage(rawMsg);
  const telemetryPayload: RuntimeTelemetryPayload = {
    message: sanitizedMessage,
    stack: sanitizeErrorMessage(rawStack),
    componentStack: sanitizeErrorMessage(errorInfo?.componentStack || ""),
    timestamp: Date.now(),
    href: window.location.href,
  };

  try {
    const existing = JSON.parse(window.localStorage.getItem("bs_runtime_error_telemetry") || "[]");
    const updated = [telemetryPayload, ...(Array.isArray(existing) ? existing : [])].slice(0, 25);
    window.localStorage.setItem("bs_runtime_error_telemetry", JSON.stringify(updated));
  } catch (_e) {
    // Storage quota or privacy mode restriction handled gracefully
  }

  if (import.meta.env.DEV) {
    console.info("[RuntimeTelemetry] Recorded safe error log:", sanitizedMessage);
  }
}
