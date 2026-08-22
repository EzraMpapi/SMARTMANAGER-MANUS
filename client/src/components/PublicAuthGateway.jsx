import React, { useState, useEffect } from "react";
import { EnterpriseLoginView, PasswordRecoveryView, ResetPasswordView, EmailConfirmationView } from "./EnterpriseAuthViews";
import { createAuthRequestError, toAuthUserMessage, validatePasswordLogin } from "../lib/authErrors";
import { authScreenFromSearch, oauthCallbackFromHash } from "../lib/authOnboarding";
import { passkeySignInUserMessage, signInWithAccountPasskey } from "../lib/accountPasskeys";
import { persistAuthSession } from "../lib/authSessionStorage";
import { getBuildPublicSupabaseConfig, loadPublicSupabaseConfig } from "../lib/publicSupabaseConfig";

const OAUTH_PROVIDERS = new Set(["google", "azure", "apple"]);

function oauthProviderFromSearch() {
  const provider = new URLSearchParams(window.location.search).get("oauth_provider");
  return OAUTH_PROVIDERS.has(provider) ? provider : "google";
}

async function authRequest(config, path, init = {}) {
  if (!config?.url || !config?.anonKey) {
    const error = new Error("Authentication is not configured for this application.");
    error.code = "AUTH_CONFIGURATION_MISSING";
    throw error;
  }
  let response;
  try {
    response = await fetch(`${config.url}/auth/v1/${path}`, { ...init, headers: { apikey: config.anonKey, "content-type": "application/json", ...(init.headers || {}) } });
  } catch (_error) {
    const error = new Error("Network error"); error.code = "NETWORK_ERROR"; throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw createAuthRequestError(response.status, payload, "Authentication request failed.");
  return payload;
}

function withoutAuthView() {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  url.searchParams.delete("oauth_provider");
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
  const [oauthProvider, setOauthProvider] = useState(oauthProviderFromSearch);
  const [supabaseConfig, setSupabaseConfig] = useState(getBuildPublicSupabaseConfig);
  const configured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  useEffect(() => {
    if (configured) return;
    let active = true;
    loadPublicSupabaseConfig().then((nextConfig) => {
      if (active && (nextConfig.url !== supabaseConfig.url || nextConfig.anonKey !== supabaseConfig.anonKey)) {
        setSupabaseConfig(nextConfig);
      }
    });
    return () => { active = false; };
  }, [configured, supabaseConfig.anonKey, supabaseConfig.url]);

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
      const provider = oauthProviderFromSearch();
      setOauthProvider(provider);
      window.history.replaceState(null, "", withoutAuthView());
      setOauthError(`${provider === "azure" ? "Microsoft" : provider === "apple" ? "Apple" : "Google"} authentication did not complete. Please try again or use another approved sign-in method.`);
      return;
    }
    if (!callback.accessToken) return;
    if (authScreenFromSearch(window.location.search) === "reset") {
      setRecoveryToken(callback.accessToken);
      window.history.replaceState(null, "", `${window.location.pathname}?auth=reset`);
      return;
    }
    persistAuthSession({ access_token: callback.accessToken, refresh_token: callback.refreshToken });
    window.location.replace(withoutAuthView());
  }, []);

  async function oauth(provider) {
    if (!configured) {
      setOauthError("Authentication is not configured for this application.");
      return;
    }
    const redirectTo = new URL(window.location.href);
    redirectTo.searchParams.set("oauth_provider", provider);
    redirectTo.hash = "";
    try {
      window.location.assign(`${supabaseConfig.url}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirectTo.toString())}`);
    } catch (oauthError) {
      setOauthError(toAuthUserMessage(oauthError));
    }
  }

  async function signIn(workEmail, password, remember = true) {
    const validation = validatePasswordLogin(workEmail, password);
    if (validation) throw new Error(validation);
    const result = await authRequest(supabaseConfig, "token?grant_type=password", { method: "POST", body: JSON.stringify({ email: workEmail, password }) });
    if (!result?.access_token || !result?.user?.id) {
      const error = new Error("The authentication server returned an incomplete session."); error.code = "AUTH_RESPONSE_INVALID"; throw error;
    }
    persistAuthSession(result, remember);
    window.location.assign(withoutAuthView());
  }

  async function signInWithPasskey(remember = true) {
    if (!configured) {
      const error = new Error("Authentication is not configured for this application.");
      error.code = "AUTH_CONFIGURATION_MISSING";
      throw error;
    }
    try {
      const result = await signInWithAccountPasskey({ supabaseUrl: supabaseConfig.url, supabaseAnonKey: supabaseConfig.anonKey });
      persistAuthSession(result, remember);
      window.location.assign(withoutAuthView());
    } catch (passkeyError) {
      const error = new Error(passkeySignInUserMessage(passkeyError));
      error.code = passkeyError?.code;
      error.status = passkeyError?.status;
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {view === "forgot" && (
        <PasswordRecoveryView
          onBack={() => navigate("login")}
          onRequest={async (workEmail) => {
            await authRequest(supabaseConfig, "recover", { method: "POST", body: JSON.stringify({ email: workEmail, redirect_to: resetRedirectUrl() }) });
          }}
          toMessage={toAuthUserMessage}
        />
      )}
      {view === "reset" && (
        <ResetPasswordView
          recoveryToken={recoveryToken}
          onBack={() => navigate("login")}
          onUpdate={async (token, newPassword) => {
            if (!token) {
              const error = new Error("Your password reset session is missing or expired.");
              error.code = "RECOVERY_SESSION_MISSING";
              throw error;
            }
            await authRequest(supabaseConfig, "user", { method: "PUT", headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ password: newPassword }) });
          }}
          toMessage={toAuthUserMessage}
        />
      )}
      {view === "verify" && (
        <EmailConfirmationView
          email={email}
          onBack={() => navigate("login")}
          onResend={async (workEmail) => {
            await authRequest(supabaseConfig, "resend", { method: "POST", body: JSON.stringify({ email: workEmail, type: "signup" }) });
          }}
          toMessage={toAuthUserMessage}
        />
      )}
      {view === "login" && (
        <EnterpriseLoginView
          onSignIn={signIn}
          onPasskey={signInWithPasskey}
          onOAuth={oauth}
          onForgot={() => navigate("forgot")}
          onSignup={() => {
            window.location.href = "/app?auth=signup";
          }}
          configured={configured}
          initialError={oauthError}
          onClearOAuthError={() => setOauthError(null)}
          oauthProvider={oauthProvider}
          toMessage={toAuthUserMessage}
        />
      )}
    </div>
  );
}
