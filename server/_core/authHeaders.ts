type HeaderRequest = {
  headers?: Record<string, string | string[] | undefined>;
};

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getBearerToken(req: HeaderRequest): string | null {
  const authorization = firstHeaderValue(req.headers?.authorization);
  const supabaseAuthorization = firstHeaderValue(req.headers?.["x-supabase-authorization"]);
  const candidate = authorization || supabaseAuthorization;
  return candidate?.startsWith("Bearer ") ? candidate.slice(7).trim() || null : null;
}
