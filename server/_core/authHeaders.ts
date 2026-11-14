type HeaderRequest = {
  headers?: Record<string, string | string[] | undefined>;
};

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function bearerFrom(value: string | string[] | undefined): string | null {
  const candidate = firstHeaderValue(value);
  return candidate?.startsWith("Bearer ") ? candidate.slice(7).trim() || null : null;
}

export function getSupabaseBearerToken(req: HeaderRequest): string | null {
  return bearerFrom(req.headers?.["x-supabase-authorization"]);
}

export function getBearerToken(req: HeaderRequest): string | null {
  // Supabase is the active authentication authority for the modern app.
  // Prefer its dedicated header when both headers exist, because an older
  // Manus bearer token may be stale or use a different JWT algorithm. Keep
  // Authorization as the fallback for the legacy Manus OAuth path.
  return getSupabaseBearerToken(req) || bearerFrom(req.headers?.authorization);
}
