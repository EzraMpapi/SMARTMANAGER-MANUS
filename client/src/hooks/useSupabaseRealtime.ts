import { useEffect } from "react";
import { getSupabaseAuthClient } from "../lib/supabaseAuthClient";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = getSupabaseAuthClient({ url: supabaseUrl, anonKey: supabaseAnonKey });

export function useSupabaseRealtime(tableName: string, onUpdate: () => void) {
  useEffect(() => {
    if (!supabase || !tableName) return;

    try {
      const channel = supabase
        .channel(`public:${tableName}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: tableName },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("Supabase Realtime subscription fallback active:", err);
    }
  }, [tableName, onUpdate]);
}
