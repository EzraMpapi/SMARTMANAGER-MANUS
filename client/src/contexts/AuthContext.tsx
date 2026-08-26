import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type MutableRefObject, type ReactNode } from "react";
import type { AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";
import { clearStoredAuthSession, readStoredAuthSession } from "../lib/authSessionStorage";
import { loadPublicSupabaseConfig, type PublicSupabaseConfig } from "../lib/publicSupabaseConfig";
import { getSupabaseAuthClient, refreshSupabaseSession } from "../lib/supabaseAuthClient";
import { authReducer, AUTH_STATES, initialAuthState, isAuthLoading, type AuthIdentity, type AuthMachineState } from "../lib/authStateMachine";
import { buildAuthRedirectUri } from "../lib/authRedirect";

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

type IdentitySnapshotPayload = {
  authorized?: unknown;
  reason?: unknown;
  profile?: unknown;
  company?: unknown;
  membership?: unknown;
  workspace?: unknown;
  role?: unknown;
  permissions?: unknown;
};

type LoadedIdentitySnapshot = {
  authorized: boolean;
  reason: string | null;
  identity: AuthIdentity;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))) : [];
}

async function loadTenantIdentity(client: SupabaseClient): Promise<LoadedIdentitySnapshot> {
  const result = await client.rpc("auth_identity_snapshot");
  if (result.error) throw result.error;
  if (!isRecord(result.data)) throw new Error("The authenticated identity snapshot was empty or malformed.");

  const payload = result.data as IdentitySnapshotPayload;
  const identity: AuthIdentity = {
    profile: isRecord(payload.profile) ? payload.profile : null,
    company: isRecord(payload.company) ? payload.company : null,
    workspace: isRecord(payload.workspace) ? payload.workspace : null,
    membership: isRecord(payload.membership) ? payload.membership : null,
    role: typeof payload.role === "string" && payload.role.length > 0 ? payload.role : null,
    permissions: stringArray(payload.permissions),
  };

  return {
    authorized: payload.authorized === true,
    reason: typeof payload.reason === "string" && payload.reason.length > 0 ? payload.reason : null,
    identity,
  };
}

function isIdentityRpcAuthFailure(error: unknown) {
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown } | null;
  const status = Number(candidate?.status);
  const code = String(candidate?.code || "").toLowerCase();
  const message = String(candidate?.message || "").toLowerCase();
  return status === 401 || code === "pgrst301" || message.includes("jwt expired") || message.includes("invalid jwt") || message.includes("not authenticated");
}

async function hydrateIdentity(client: SupabaseClient, session: Session, dispatch: Dispatch<Parameters<typeof authReducer>[1]>, generation: MutableRefObject<number>) {
  const currentGeneration = ++generation.current;
  let effectiveSession = session;
  dispatch({ type: "SESSION_ESTABLISHED", session: effectiveSession, user: effectiveSession.user });
  dispatch({ type: "PROFILE_LOADING" });
  let snapshot: LoadedIdentitySnapshot;
  try {
    snapshot = await loadTenantIdentity(client);
  } catch (error) {
    if (!isIdentityRpcAuthFailure(error)) {
      if (currentGeneration === generation.current) dispatch({ type: "AUTH_ERROR", error, reason: "IDENTITY_SNAPSHOT_FAILED" });
      throw error;
    }
    const refreshed = await refreshSupabaseSession(client);
    if (refreshed.error || !refreshed.data.session) {
      if (currentGeneration === generation.current) dispatch({ type: "AUTH_ERROR", error: refreshed.error || error, reason: "SESSION_REFRESH_FAILED" });
      throw refreshed.error || error;
    }
    if (currentGeneration !== generation.current) return;
    effectiveSession = refreshed.data.session;
    dispatch({ type: "TOKEN_REFRESHED", session: effectiveSession, user: effectiveSession.user });
    try {
      snapshot = await loadTenantIdentity(client);
    } catch (retryError) {
      if (currentGeneration === generation.current) dispatch({ type: "AUTH_ERROR", error: retryError, reason: "IDENTITY_SNAPSHOT_FAILED" });
      throw retryError;
    }
  }
  if (currentGeneration !== generation.current) return;
  if (!snapshot.authorized) {
    dispatch({
      type: "INCOMPLETE_IDENTITY",
      session: effectiveSession,
      user: effectiveSession.user,
      profile: snapshot.identity.profile,
      reason: snapshot.reason || "IDENTITY_INCOMPLETE",
    });
    return;
  }
  dispatch({ type: "WORKSPACE_LOADING", profile: snapshot.identity.profile || {} });
  if (currentGeneration !== generation.current) return;
  dispatch({ type: "AUTHORIZED", session: effectiveSession, user: effectiveSession.user, identity: snapshot.identity });
}

function redirectUri(screen: "login" | "verify" | "reset", provider?: string) {
  if (typeof window === "undefined") return undefined;
  return buildAuthRedirectUri(window.location.href, import.meta.env.VITE_PUBLIC_APP_ORIGIN, screen, provider);
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
          if (event === "INITIAL_SESSION") return;
          if (event === "SIGNED_OUT" || !session) {
            generation.current += 1;
            dispatch({ type: "SIGNED_OUT" });
            return;
          }
          if (event === "TOKEN_REFRESHED") {
            dispatch({ type: "TOKEN_REFRESHED", session, user: session.user });
            return;
          }
          if (event === "PASSWORD_RECOVERY") {
            dispatch({ type: "PASSWORD_RECOVERY", session, user: session.user });
            return;
          }
          if (event === "USER_UPDATED") dispatch({ type: "USER_UPDATED", session, user: session.user });
          if (event === "SIGNED_IN" || event === "USER_UPDATED") {
            void hydrateIdentity(client, session, dispatch, generation).catch((error) => dispatch({ type: "AUTH_ERROR", error, reason: "IDENTITY_BOOTSTRAP_FAILED" }));
          }
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
    return result.data;
  }, [requireClient]);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const result = await requireClient().auth.signUp({ email, password, options: { data: metadata, emailRedirectTo: redirectUri("verify") } });
    if (result.error) throw result.error;
    return result.data;
  }, [requireClient]);

  const signOut = useCallback(async () => {
    const client = requireClient();
    let signOutError: unknown = null;
    try {
      const result = await client.auth.signOut();
      signOutError = result.error;
    } catch (error) {
      signOutError = error;
      try { await client.auth.signOut({ scope: "local" }); } catch { /* local state is cleared below */ }
    } finally {
      clearStoredAuthSession();
      dispatch({ type: "SIGNED_OUT" });
    }
    if (signOutError) throw signOutError;
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
    const redirectTo = redirectUri("login", provider);
    const result = await requireClient().auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (result.error) throw result.error;
  }, [requireClient]);

  const resendConfirmation = useCallback(async (email: string) => {
    const result = await requireClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectUri("verify") } });
    if (result.error) throw result.error;
  }, [requireClient]);

  const adoptSession = useCallback(async (nextSession: { access_token: string; refresh_token: string }, _remember = true) => {
    const result = await requireClient().auth.setSession(nextSession);
    if (result.error) throw result.error;
    if (!result.data.session) throw new Error("The authentication server returned an incomplete session.");
  }, [requireClient]);

  const refresh = useCallback(async () => {
    const client = requireClient();
    const result = await refreshSupabaseSession(client);
    if (result.error) throw result.error;
    if (result.data.session) await hydrateIdentity(client, result.data.session, dispatch, generation);
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
