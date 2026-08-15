import React, { useEffect, useMemo, useState } from "react";
import { EnterpriseLoginView, ForgotPasswordView, ResetPasswordView, VerificationView } from "./EnterpriseAuthViews";
import { createAuthRequestError, toAuthUserMessage, validatePasswordLogin } from "../lib/authErrors";
import { authScreenFromSearch, oauthCallbackFromHash } from "../lib/authOnboarding";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const ACCESS_TOKEN_STORAGE_KEY = "bs_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "bs_refresh_token";
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

function persistAuthSession(result) {
  if (!result?.access_token) return;
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, result.access_token);
  if (result.refresh_token) window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, result.refresh_token);
}

function withoutAuthView() {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
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
    let disposed = false;

    function completeOAuthCallback() {
      const implicitCallback = oauthCallbackFromHash(window.location.hash);
      if (implicitCallback.errorCode) {
        window.history.replaceState(null, "", withoutAuthView());
        if (!disposed) setOauthError("Google authentication did not complete. Please try again or use another approved sign-in method.");
        return;
      }
      if (!implicitCallback.accessToken) return;
      if (authScreenFromSearch(window.location.search) === "reset") {
        setRecoveryToken(implicitCallback.accessToken);
        window.history.replaceState(null, "", `${window.location.pathname}?auth=reset`);
        return;
      }
      // Production hosting preserves fragment callbacks but strips query
      // parameters before the app loads, so retain Supabase implicit flow.
      persistAuthSession({ access_token: implicitCallback.accessToken, refresh_token: implicitCallback.refreshToken });
      window.location.replace(withoutAuthView());
    }

    completeOAuthCallback();
    return () => { disposed = true; };
  }, []);

  async function signIn(workEmail, password) {
    const validation = validatePasswordLogin(workEmail, password);
    if (validation) throw new Error(validation);
    const result = await authRequest("token?grant_type=password", { method: "POST", body: JSON.stringify({ email: workEmail, password }) });
    if (!result?.access_token || !result?.user?.id) {
      const error = new Error("The authentication server returned an incomplete session."); error.code = "AUTH_RESPONSE_INVALID"; throw error;
    }
    persistAuthSession(result);
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
    try {
      const redirectTo = new URL(window.location.href);
      ["auth", "code", "state", "error", "error_description"].forEach((key) => redirectTo.searchParams.delete(key));
      redirectTo.hash = "";
      const params = new URLSearchParams({ provider, redirect_to: redirectTo.toString() });
      window.location.assign(`${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`);
    } catch (error) {
      setOauthError(error?.message || "Google sign-in could not start. Please try again.");
    }
  }

  if (view === "forgot") return <ForgotPasswordView onBack={() => navigate("login")} onRequest={requestRecovery} toMessage={toAuthUserMessage} />;
  if (view === "reset") return <ResetPasswordView recoveryToken={recoveryToken} onBack={() => navigate("login")} onUpdate={updatePassword} toMessage={toAuthUserMessage} />;
  if (view === "verify") return <VerificationView email={email} onBack={() => navigate("login")} onResend={resendVerification} toMessage={toAuthUserMessage} />;
  return <EnterpriseLoginView configured={configured} onSignIn={signIn} onSignup={() => navigate("signup")} onForgot={() => navigate("forgot")} onOAuth={oauth} toMessage={toAuthUserMessage} invitationPending={invitationPending} initialError={oauthError} />;
}
