const DEFAULT_CANONICAL_ORIGIN = "https://bserp-dashbo-xgm6fauw.manus.space";

// These aliases were used by older Smart Manager deployments. They must not be
// used as an OAuth return target because they can point at retired deployments.
const LEGACY_PRODUCTION_HOSTS = new Set([
  "menejajanja.vercel.app",
  "menejajanja-ezra-mpapi.vercel.app",
  "menejajanja-git-main-ezra-mpapi.vercel.app",
  "smartmanager-manus.vercel.app",
]);

function safeOrigin(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getCanonicalAuthOrigin(configuredOrigin?: string) {
  return safeOrigin(configuredOrigin) || DEFAULT_CANONICAL_ORIGIN;
}

/**
 * Builds the only redirect target used by password recovery, email confirmation,
 * and external OAuth. Legacy production aliases are redirected to the current
 * canonical app before the provider flow starts, preventing a successful Google
 * login from returning to a retired hostname.
 */
export function buildAuthRedirectUri(currentHref: string, configuredOrigin: string | undefined, screen: "login" | "verify" | "reset", provider?: string) {
  const current = new URL(currentHref);
  const fallbackOrigin = getCanonicalAuthOrigin(configuredOrigin);
  const origin = LEGACY_PRODUCTION_HOSTS.has(current.hostname.toLowerCase()) ? fallbackOrigin : current.origin;
  const target = new URL("/app", origin);
  target.searchParams.set("auth", screen);
  if (provider) target.searchParams.set("oauth_provider", provider);
  return target.toString();
}

export function isLegacyProductionHost(hostname: string) {
  return LEGACY_PRODUCTION_HOSTS.has(hostname.trim().toLowerCase());
}

export { DEFAULT_CANONICAL_ORIGIN };
