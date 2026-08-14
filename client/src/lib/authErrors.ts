export type AuthErrorLike = Error & { status?: number; code?: string; details?: unknown };

export function createAuthRequestError(status: number, payload: unknown, fallback: string): AuthErrorLike {
  const record = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
  const message = typeof record.error_description === "string"
    ? record.error_description
    : typeof record.msg === "string"
      ? record.msg
      : typeof record.message === "string"
        ? record.message
        : fallback;
  const error = new Error(message) as AuthErrorLike;
  error.status = status;
  error.code = typeof record.error_code === "string"
    ? record.error_code
    : typeof record.code === "string"
      ? record.code
      : undefined;
  return error;
}

export function validatePasswordLogin(email: string, password: string): string | null {
  if (!email.trim() || !password) return "Email and password are required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
  return null;
}

export function toAuthUserMessage(error: unknown): string {
  const authError = error as AuthErrorLike | undefined;
  const code = String(authError?.code || "").toLowerCase();
  const status = Number(authError?.status || 0);
  const message = String(authError?.message || "").trim();

  if (code === "invalid_credentials" || /invalid login credentials|invalid credentials/i.test(message)) return "Invalid email or password.";
  if (code === "email_not_confirmed" || /email.*not confirmed|confirm.*email/i.test(message)) return "Confirm your email address before signing in.";
  if (code === "auth_configuration_missing") return "Authentication is not configured for this application. Please contact an administrator.";
  if (code === "auth_response_invalid") return "The authentication server returned an unexpected response. Please try again.";
  if (status === 429 || code.includes("rate")) return "Too many sign-in attempts. Please wait a moment and try again.";
  if (status >= 500) return "The authentication server is temporarily unavailable. Please try again shortly.";
  if (code === "NETWORK_ERROR" || error instanceof TypeError || status === 0) return "Unable to connect to the authentication server. Please check your connection and try again.";
  return message && message.length <= 220 ? message : "Sign-in could not be completed. Please try again.";
}
