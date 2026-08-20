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
  touchContext?: {
    type?: string;
    targetTagName?: string;
    pointerType?: string;
  };
}

export function reportRuntimeError(
  error: unknown,
  errorInfo?: { componentStack?: string | null },
  touchEvent?: TouchEvent | PointerEvent | MouseEvent
): void {
  if (typeof window === "undefined") return;
  const rawMsg = error instanceof Error ? error.message : String(error);
  const rawStack = error instanceof Error ? error.stack || "" : "";
  const sanitizedMessage = sanitizeErrorMessage(rawMsg);

  let touchContext: RuntimeTelemetryPayload["touchContext"] = undefined;
  if (touchEvent) {
    const target = touchEvent.target as HTMLElement | null;
    touchContext = {
      type: touchEvent.type,
      targetTagName: target?.tagName || "UNKNOWN",
      pointerType: (touchEvent as PointerEvent).pointerType || (touchEvent instanceof TouchEvent ? "touch" : "mouse"),
    };
  }

  const telemetryPayload: RuntimeTelemetryPayload = {
    message: sanitizedMessage,
    stack: sanitizeErrorMessage(rawStack),
    componentStack: sanitizeErrorMessage(errorInfo?.componentStack || ""),
    timestamp: Date.now(),
    href: window.location.href,
    touchContext,
  };

  try {
    const existing = JSON.parse(window.localStorage.getItem("bs_runtime_error_telemetry") || "[]");
    const updated = [telemetryPayload, ...(Array.isArray(existing) ? existing : [])].slice(0, 25);
    window.localStorage.setItem("bs_runtime_error_telemetry", JSON.stringify(updated));
  } catch (_e) {
    // Storage quota or privacy mode restriction handled gracefully
  }

  if (import.meta.env.DEV) {
    console.info("[RuntimeTelemetry] Recorded safe error log with touch context:", sanitizedMessage, touchContext);
  }
}

export type SessionRefreshOutcome = "success" | "retryable_failure" | "terminal_failure";
export type SessionRefreshSource = "launch_bootstrap" | "workspace_rpc" | "proactive";

// This compact local event stream deliberately excludes tokens, email
// addresses, account IDs, tenant IDs, URLs, raw errors, and request bodies.
// It is intended only for operational trend diagnostics in the browser.
export function reportSessionRefreshOutcome(outcome: SessionRefreshOutcome, source: SessionRefreshSource): void {
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
