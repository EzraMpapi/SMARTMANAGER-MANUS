import React, { useEffect, useMemo, useState } from "react";
import { EnterpriseLoginView, ForgotPasswordView, ResetPasswordView, VerificationView } from "./EnterpriseAuthViews";
import { createAuthRequestError, toAuthUserMessage, validatePasswordLogin } from "../lib/authErrors";
import { authScreenFromSearch, oauthCallbackFromHash } from "../lib/authOnboarding";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const ACCESS_TOKEN_STORAGE_KEY = "bs_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "bs_refresh_token";
const SESSION_ACCESS_TOKEN_STORAGE_KEY = "bs_session_access_token";
const SESSION_REFRESH_TOKEN_STORAGE_KEY = "bs_session_refresh_token";
const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function authRequest(path, init = {}) {
  if (!configured) {
    const error = new Error("Authentication is not configured for this application.");
    error.code = "AUTH_CONFIGURATION_MISSING";
    throw error;
  }
  let response;
  try {
    response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, { ...init, headers: { apikey: SUPABASE_ANON_KEY, "content-type": "application/json", ...(init.headers || {}) } });
  } catch (_error) {
    const error = new Error("Network error"); error.code = "NETWORK_ERROR"; throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw createAuthRequestError(response.status, payload, "Authentication request failed.");
  return payload;
}

function persistAuthSession(result, remember = true) {
  if (!result?.access_token) return;
  const activeStorage = remember ? window.localStorage : window.sessionStorage;
  const inactiveStorage = remember ? window.sessionStorage : window.localStorage;
  const activeAccessKey = remember ? ACCESS_TOKEN_STORAGE_KEY : SESSION_ACCESS_TOKEN_STORAGE_KEY;
  const activeRefreshKey = remember ? REFRESH_TOKEN_STORAGE_KEY : SESSION_REFRESH_TOKEN_STORAGE_KEY;
  const inactiveAccessKey = remember ? SESSION_ACCESS_TOKEN_STORAGE_KEY : ACCESS_TOKEN_STORAGE_KEY;
  const inactiveRefreshKey = remember ? SESSION_REFRESH_TOKEN_STORAGE_KEY : REFRESH_TOKEN_STORAGE_KEY;
  inactiveStorage.removeItem(inactiveAccessKey);
  inactiveStorage.removeItem(inactiveRefreshKey);
  activeStorage.setItem(activeAccessKey, result.access_token);
  if (result.refresh_token) activeStorage.setItem(activeRefreshKey, result.refresh_token);
}

function withoutAuthView() {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  url.hash = "";
  return `${url.pathname}${url.search}`;
}

function resetRedirectUrl() {
  const url = new URL(window.location.href);
  url.search = "?auth=reset";
  url.hash = "";
  return url.toString();
}

export default function PublicAuthGateway() {
  const [view, setView] = useState(() => authScreenFromSearch(window.location.search));
  const [email, setEmail] = useState("");
  const [recoveryToken, setRecoveryToken] = useState(null);
  const [oauthError, setOauthError] = useState(null);
  const invitationPending = useMemo(() => new URLSearchParams(window.location.search).has("invite"), []);

  function navigate(next, contextEmail = "") {
    if (contextEmail) setEmail(contextEmail);
    setView(next);
    const url = new URL(window.location.href);
    url.hash = "";
    if (next === "login") url.searchParams.delete("auth"); else url.searchParams.set("auth", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  useEffect(() => {
    if (!window.location.hash) return;
    const callback = oauthCallbackFromHash(window.location.hash);
    if (callback.errorCode) {
      window.history.replaceState(null, "", withoutAuthView());
      setOauthError("Google authentication did not complete. Please try again or use another approved sign-in method.");
      return;
    }
    if (!callback.accessToken) return;
    if (authScreenFromSearch(window.location.search) === "reset") {
      setRecoveryToken(callback.accessToken);
      window.history.replaceState(null, "", `${window.location.pathname}?auth=reset`);
      return;
    }
    // OAuth callbacks land before the lightweight public route can see the
    // session in browser storage. Persist and immediately re-enter /app so
    // the existing tenant-aware bootstrap resolves profile → workspace.
    persistAuthSession({ access_token: callback.accessToken, refresh_token: callback.refreshToken });
    window.location.replace(withoutAuthView());
  }, []);

  async function signIn(workEmail, password, remember = true) {
    const validation = validatePasswordLogin(workEmail, password);
    if (validation) throw new Error(validation);
    const result = await authRequest("token?grant_type=password", { method: "POST", body: JSON.stringify({ email: workEmail, password }) });
    if (!result?.access_token || !result?.user?.id) {
      const error = new Error("The authentication server returned an incomplete session."); error.code = "AUTH_RESPONSE_INVALID"; throw error;
    }
    persistAuthSession(result, remember);
    window.location.assign(withoutAuthView());
  }

  async function requestRecovery(workEmail) {
    await authRequest("recover", { method: "POST", body: JSON.stringify({ email: workEmail, options: { redirectTo: resetRedirectUrl() } }) });
  }

  async function updatePassword(token, password) {
    if (!token) { const error = new Error("Recovery session missing."); error.code = "RECOVERY_SESSION_MISSING"; throw error; }
    await authRequest("user", { method: "PUT", headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) });
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY); window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  async function resendVerification(workEmail) {
    await authRequest("resend", { method: "POST", body: JSON.stringify({ type: "signup", email: workEmail }) });
  }

  function oauth(provider) {
    if (!configured) return;
    const redirectTo = new URL(window.location.href); redirectTo.searchParams.delete("auth");
    window.location.assign(`${SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirectTo.toString())}`);
  }

  if (view === "forgot") return <ForgotPasswordView onBack={() => navigate("login")} onRequest={requestRecovery} toMessage={toAuthUserMessage} />;
  if (view === "reset") return <ResetPasswordView recoveryToken={recoveryToken} onBack={() => navigate("login")} onUpdate={updatePassword} toMessage={toAuthUserMessage} />;
  if (view === "verify") return <VerificationView email={email} onBack={() => navigate("login")} onResend={resendVerification} toMessage={toAuthUserMessage} />;
  return <EnterpriseLoginView configured={configured} onSignIn={signIn} onSignup={() => navigate("signup")} onForgot={() => navigate("forgot")} onOAuth={oauth} toMessage={toAuthUserMessage} invitationPending={invitationPending} initialError={oauthError} />;
}
