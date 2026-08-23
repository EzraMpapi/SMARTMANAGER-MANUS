import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type MutableRefObject, type ReactNode } from "react";
import type { AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";
import { clearStoredAuthSession, readStoredAuthSession } from "../lib/authSessionStorage";
import { loadPublicSupabaseConfig, type PublicSupabaseConfig } from "../lib/publicSupabaseConfig";
import { getSupabaseAuthClient } from "../lib/supabaseAuthClient";
import { authReducer, AUTH_STATES, emptyIdentity, initialAuthState, isAuthLoading, type AuthIdentity, type AuthMachineState } from "../lib/authStateMachine";

type AuthContextValue = AuthMachineState & {
  configured: boolean;
  publicConfig: PublicSupabaseConfig;
  loading: boolean;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  signIn: (email: string, password: string) => Promise<{ session: Session | null; user: User | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ session: Session | null; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signInWithOAuth: (provider: "google" | "azure" | "apple") => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  adoptSession: (session: { access_token: string; refresh_token: string }, remember?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authError(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; code?: unknown };
    return { message: typeof candidate.message === "string" && candidate.message ? candidate.message : fallback, code: typeof candidate.code === "string" ? candidate.code : undefined };
  }
  return { message: fallback };
}

function firstRow<T>(result: { data: T[] | null; error: { message?: string } | null }) {
  if (result.error) throw result.error;
  return result.data?.[0] || null;
}

async function loadTenantIdentity(client: SupabaseClient, session: Session, profile: Record<string, unknown>): Promise<AuthIdentity> {
  const userId = session.user.id;
  const companyId = typeof profile.company_id === "string" ? profile.company_id : null;
  if (!companyId) throw new Error("Your authenticated profile is not assigned to a workspace.");

  const companyResult = await client.from("companies").select("*").eq("id", companyId).limit(1);
  const company = firstRow(companyResult);
  if (!company) throw new Error("The assigned workspace is not available to this verified account.");

  const membershipResult = await client.from("company_memberships").select("*").eq("user_id", userId).eq("company_id", companyId).limit(1);
  const membership = membershipResult.error ? null : membershipResult.data?.[0] || null;

  const workspaceResult = await client.from("workspaces").select("*").eq("company_id", companyId).order("created_at", { ascending: true }).limit(1);
  const workspace = workspaceResult.error ? null : workspaceResult.data?.[0] || null;

  const role = typeof profile.role === "string" && profile.role ? profile.role : null;
  const permissions: string[] = [];
  if (role) {
    const roleResult = await client.from("workforce_roles").select("id,code,name").eq("company_id", companyId).eq("status", "Active").or(`name.eq.${role},code.eq.${role.toLowerCase()}`).limit(5);
    const roleIds = (roleResult.error ? [] : roleResult.data || []).map((item) => item.id).filter(Boolean);
    if (roleIds.length) {
      const grantResult = await client.from("workforce_role_permissions").select("effect,status,workforce_permissions(code)").eq("company_id", companyId).eq("status", "Active").in("role_id", roleIds);
      if (!grantResult.error) {
        for (const grant of grantResult.data || []) {
          const permission = Array.isArray(grant.workforce_permissions) ? grant.workforce_permissions[0] : grant.workforce_permissions;
          if (grant.effect !== "Deny" && typeof permission?.code === "string") permissions.push(permission.code);
        }
      }
    }
  }

  return { profile, company, workspace, membership, role, permissions: Array.from(new Set(permissions)) };
}

async function hydrateIdentity(client: SupabaseClient, session: Session, dispatch: Dispatch<Parameters<typeof authReducer>[1]>, generation: MutableRefObject<number>) {
  const currentGeneration = ++generation.current;
  dispatch({ type: "SESSION_ESTABLISHED", session, user: session.user });
  dispatch({ type: "PROFILE_LOADING" });
  const profileResult = await client.from("profiles").select("*").eq("id", session.user.id).limit(1);
  if (currentGeneration !== generation.current) return;
  if (profileResult.error) throw profileResult.error;
  const profile = profileResult.data?.[0] || null;
  if (!profile) {
    dispatch({ type: "INCOMPLETE_IDENTITY", session, user: session.user, profile: null, reason: "PROFILE_MISSING" });
    return;
  }
  dispatch({ type: "WORKSPACE_LOADING", profile });
  try {
    const identity = await loadTenantIdentity(client, session, profile);
    if (currentGeneration !== generation.current) return;
    dispatch({ type: "AUTHORIZED", session, user: session.user, identity });
  } catch (error) {
    if (currentGeneration !== generation.current) return;
    dispatch({ type: "INCOMPLETE_IDENTITY", session, user: session.user, profile, reason: authError(error, "Workspace authorization is not available.").message });
  }
}

function redirectUri(screen: string) {
  if (typeof window === "undefined") return undefined;
  const url = new URL(window.location.href);
  url.pathname = "/app";
  url.search = `?auth=${encodeURIComponent(screen)}`;
  url.hash = "";
  return url.toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useReducer((_current: PublicSupabaseConfig, next: PublicSupabaseConfig) => next, { url: String(import.meta.env.VITE_SUPABASE_URL || "").trim(), anonKey: String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim() });
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const generation = useRef(0);
  const clientRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const start = async () => {
      const nextConfig = await loadPublicSupabaseConfig();
      if (!active) return;
      setConfig(nextConfig);
      if (!nextConfig.url || !nextConfig.anonKey) {
        dispatch({ type: "AUTH_ERROR", error: { code: "AUTH_CONFIGURATION_MISSING", message: "Authentication is not configured for this application." }, reason: "AUTH_CONFIGURATION_MISSING" });
        return;
      }
      const client = getSupabaseAuthClient(nextConfig);
      if (!client) return;
      clientRef.current = client;
      const subscription = client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        window.setTimeout(() => {
          if (!active) return;
          if (event === "SIGNED_OUT" || !session) {
            generation.current += 1;
            dispatch({ type: "SIGNED_OUT" });
            return;
          }
          if (event === "TOKEN_REFRESHED") dispatch({ type: "TOKEN_REFRESHED", session, user: session.user });
          if (event === "USER_UPDATED") dispatch({ type: "USER_UPDATED", session, user: session.user });
          if (event === "PASSWORD_RECOVERY") dispatch({ type: "PASSWORD_RECOVERY", session, user: session.user });
          void hydrateIdentity(client, session, dispatch, generation).catch((error) => dispatch({ type: "AUTH_ERROR", error, reason: "IDENTITY_BOOTSTRAP_FAILED" }));
        }, 0);
      });
      unsubscribe = () => subscription.data.subscription.unsubscribe();

      const legacy = readStoredAuthSession();
      if (legacy) {
        const imported = await client.auth.setSession({ access_token: legacy.access_token, refresh_token: legacy.refresh_token });
        if (imported.error) clearStoredAuthSession();
        else clearStoredAuthSession();
      }
      const current = await client.auth.getSession();
      if (!active) return;
      if (current.error) {
        dispatch({ type: "AUTH_ERROR", error: current.error, reason: "SESSION_INITIALIZATION_FAILED" });
        return;
      }
      if (!current.data.session) dispatch({ type: "SIGNED_OUT" });
      else await hydrateIdentity(client, current.data.session, dispatch, generation);
    };
    void start().catch((error) => { if (active) dispatch({ type: "AUTH_ERROR", error, reason: "AUTH_INITIALIZATION_FAILED" }); });
    return () => { active = false; generation.current += 1; unsubscribe?.(); };
  }, []);

  const requireClient = useCallback(() => {
    const client = clientRef.current;
    if (!client) throw Object.assign(new Error("Authentication is not configured for this application."), { code: "AUTH_CONFIGURATION_MISSING" });
    return client;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await requireClient().auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    if (result.data.session) await hydrateIdentity(requireClient(), result.data.session, dispatch, generation);
    return result.data;
  }, [requireClient]);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const result = await requireClient().auth.signUp({ email, password, options: { data: metadata, emailRedirectTo: redirectUri("verify") } });
    if (result.error) throw result.error;
    if (result.data.session) await hydrateIdentity(requireClient(), result.data.session, dispatch, generation);
    return result.data;
  }, [requireClient]);

  const signOut = useCallback(async () => {
    const result = await requireClient().auth.signOut();
    clearStoredAuthSession();
    if (result.error) throw result.error;
    dispatch({ type: "SIGNED_OUT" });
  }, [requireClient]);

  const resetPassword = useCallback(async (email: string) => {
    const result = await requireClient().auth.resetPasswordForEmail(email, { redirectTo: redirectUri("reset") });
    if (result.error) throw result.error;
  }, [requireClient]);

  const updatePassword = useCallback(async (password: string) => {
    const result = await requireClient().auth.updateUser({ password });
    if (result.error) throw result.error;
  }, [requireClient]);

  const signInWithOAuth = useCallback(async (provider: "google" | "azure" | "apple") => {
    const callback = redirectUri("login");
    const redirectTo = callback ? new URL(callback) : null;
    if (redirectTo) redirectTo.searchParams.set("oauth_provider", provider);
    const result = await requireClient().auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo?.toString() } });
    if (result.error) throw result.error;
  }, [requireClient]);

  const resendConfirmation = useCallback(async (email: string) => {
    const result = await requireClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectUri("verify") } });
    if (result.error) throw result.error;
  }, [requireClient]);

  const adoptSession = useCallback(async (nextSession: { access_token: string; refresh_token: string }, remember = true) => {
    const result = await requireClient().auth.setSession(nextSession);
    if (result.error) throw result.error;
    if (result.data.session) await hydrateIdentity(requireClient(), result.data.session, dispatch, generation);
  }, [requireClient]);

  const refresh = useCallback(async () => {
    const result = await requireClient().auth.getSession();
    if (result.error) throw result.error;
    if (result.data.session) await hydrateIdentity(requireClient(), result.data.session, dispatch, generation);
    else dispatch({ type: "SIGNED_OUT" });
  }, [requireClient]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    configured: Boolean(config.url && config.anonKey),
    publicConfig: config,
    loading: isAuthLoading(state.status),
    isAuthenticated: Boolean(state.session && state.user),
    isAuthorized: state.status === AUTH_STATES.AUTHORIZED,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithOAuth,
    resendConfirmation,
    adoptSession,
    refresh,
  }), [adoptSession, config.anonKey, config.url, refresh, resendConfirmation, resetPassword, signIn, signInWithOAuth, signOut, signUp, state, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuthContext must be used inside AuthProvider");
  return value;
}

export { AuthContext };
