export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getBuildPublicSupabaseConfig(): PublicSupabaseConfig {
  return {
    url: String(import.meta.env.VITE_SUPABASE_URL || "").trim(),
    anonKey: String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim(),
  };
}

export async function loadPublicSupabaseConfig(): Promise<PublicSupabaseConfig> {
  const buildConfig = getBuildPublicSupabaseConfig();
  if (buildConfig.url && buildConfig.anonKey) return buildConfig;

  try {
    const response = await fetch("/api/config/public", {
      headers: { accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) return buildConfig;
    const payload = await response.json().catch(() => null) as { url?: unknown; anonKey?: unknown } | null;
    const url = typeof payload?.url === "string" ? payload.url.trim() : "";
    const anonKey = typeof payload?.anonKey === "string" ? payload.anonKey.trim() : "";
    return url && anonKey ? { url, anonKey } : buildConfig;
  } catch {
    return buildConfig;
  }
}
