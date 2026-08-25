type HeaderRequest = {
  headers?: Record<string, string | string[] | undefined>;
};

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getBearerToken(req: HeaderRequest): string | null {
  const authorization = firstHeaderValue(req.headers?.authorization);
  const supabaseAuthorization = firstHeaderValue(req.headers?.["x-supabase-authorization"]);
  // Supabase is the active authentication authority for the modern app.
  // Prefer its dedicated header when both headers exist, because an older
  // Manus bearer token may be stale or use a different JWT algorithm. Keep
  // Authorization as the fallback for the legacy Manus OAuth path.
  const candidate = supabaseAuthorization || authorization;
  return candidate?.startsWith("Bearer ") ? candidate.slice(7).trim() || null : null;
}
