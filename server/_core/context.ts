import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type ContextUser = User & { companyId?: string };

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: ContextUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: ContextUser | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    const authHeader = opts.req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
      if (token && supabaseUrl && supabaseAnonKey && token !== supabaseAnonKey) {
        try {
          const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { apikey: supabaseAnonKey, authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const supabaseUser = await response.json() as { id?: string; email?: string; user_metadata?: { full_name?: string; name?: string }; app_metadata?: { provider?: string } };
            if (supabaseUser.id) {
              const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=company_id,role&id=eq.${encodeURIComponent(supabaseUser.id)}&limit=1`, {
                headers: { apikey: supabaseAnonKey, authorization: `Bearer ${token}` },
              });
              const profileRows = profileResponse.ok
                ? await profileResponse.json() as Array<{ company_id?: string; role?: string }>
                : [];
              const profile = profileRows[0];
              const profileRole = String(profile?.role || "").toLowerCase();
              user = {
                id: 1,
                openId: `sup_${supabaseUser.id}`,
                name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email || "Supabase User",
                email: supabaseUser.email ?? null,
                loginMethod: supabaseUser.app_metadata?.provider || "supabase",
                role: profileRole === "owner" || profileRole === "admin" || profileRole === "super_admin" ? "admin" : "user",
                createdAt: new Date(),
                updatedAt: new Date(),
                lastSignedIn: new Date(),
                companyId: profile?.company_id,
              } as ContextUser;
            }
          }
        } catch (_supabaseError) {
          user = null;
        }
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
