import { TRPCError } from "@trpc/server";

const TRPC_HTTP_STATUS: Record<string, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

export function httpStatusFromError(error: unknown, fallback = 500) {
  const explicitStatus = (error as { status?: unknown } | null)?.status;
  if (typeof explicitStatus === "number" && explicitStatus >= 400 && explicitStatus <= 599) return explicitStatus;
  if (error instanceof TRPCError) return TRPC_HTTP_STATUS[error.code] ?? fallback;
  return fallback;
}
