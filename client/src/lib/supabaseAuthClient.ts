import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PublicSupabaseConfig } from "./publicSupabaseConfig";

let client: SupabaseClient | null = null;
let clientKey = "";

export function getSupabaseAuthClient(config: PublicSupabaseConfig) {
  if (!config.url || !config.anonKey) return null;
  const nextKey = `${config.url}|${config.anonKey}`;
  if (!client || clientKey !== nextKey) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: "smart-manager-auth",
      },
    });
    clientKey = nextKey;
  }
  return client;
}

export function resetSupabaseAuthClient() {
  client = null;
  clientKey = "";
}
