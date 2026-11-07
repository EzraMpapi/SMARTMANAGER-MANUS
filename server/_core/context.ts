import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { getBearerToken, getSupabaseBearerToken } from "./authHeaders";

type SupabaseUserResponse = {
  id?: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
  app_metadata?: { provider?: string };
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function authenticateSupabaseToken(token: string): Promise<User | null> {
  const supabaseUrl = ENV.supabaseUrl;
  const supabaseAnonKey = ENV.supabaseAnonKey;
  if (!supabaseUrl || !supabaseAnonKey || token === supabaseAnonKey) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const supabaseUser = await response.json() as SupabaseUserResponse;
    if (!supabaseUser.id) return null;
    return {
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
  } catch (_supabaseError) {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const supabaseToken = getSupabaseBearerToken(opts.req);
  if (supabaseToken) {
    return { req: opts.req, res: opts.res, user: await authenticateSupabaseToken(supabaseToken) };
  }

  try {
    return { req: opts.req, res: opts.res, user: await sdk.authenticateRequest(opts.req) };
  } catch (_legacyAuthError) {
    const token = getBearerToken(opts.req);
    return { req: opts.req, res: opts.res, user: token ? await authenticateSupabaseToken(token) : null };
  }
}
