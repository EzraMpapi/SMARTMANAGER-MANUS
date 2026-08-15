import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

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
              user = {
                id: 1,
                openId: `sup_${supabaseUser.id}`,
                name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email || "Supabase User",
                email: supabaseUser.email ?? null,
                loginMethod: supabaseUser.app_metadata?.provider || "supabase",
                role: "user",
                createdAt: new Date(),
                updatedAt: new Date(),
                lastSignedIn: new Date(),
              } as User;
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
