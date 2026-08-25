import { useEffect, useState } from "react";
import { EnterpriseLoginView, PasswordRecoveryView, ResetPasswordView, EmailConfirmationView } from "./EnterpriseAuthViews";
import { toAuthUserMessage, validatePasswordLogin } from "../lib/authErrors";
import { authScreenFromSearch, oauthCallbackFromHash } from "../lib/authOnboarding";
import { passkeySignInUserMessage, signInWithAccountPasskey } from "../lib/accountPasskeys";
import { useAuthContext } from "../contexts/AuthContext";

const OAUTH_PROVIDERS = new Set(["google", "azure", "apple"]);

function oauthProviderFromSearch() {
  const provider = new URLSearchParams(window.location.search).get("oauth_provider");
  return OAUTH_PROVIDERS.has(provider) ? provider : "google";
}

function withoutAuthView() {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  url.searchParams.delete("oauth_provider");
  url.hash = "";
  return `${url.pathname}${url.search}`;
}

export default function PublicAuthGateway() {
  const auth = useAuthContext();
  const [view, setView] = useState(() => authScreenFromSearch(window.location.search));
  const [email, setEmail] = useState("");
  const [oauthError, setOauthError] = useState(null);
  const [oauthProvider, setOauthProvider] = useState(oauthProviderFromSearch);

  useEffect(() => {
    const callback = oauthCallbackFromHash(window.location.hash);
    if (!callback.errorCode) return;
    const provider = oauthProviderFromSearch();
    setOauthProvider(provider);
    setOauthError(`${provider === "azure" ? "Microsoft" : provider === "apple" ? "Apple" : "Google"} authentication did not complete. Please try again or use another approved sign-in method.`);
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  function navigate(next, contextEmail = "") {
    if (contextEmail) setEmail(contextEmail);
    setView(next);
    const url = new URL(window.location.href);
    url.hash = "";
    if (next === "login") url.searchParams.delete("auth"); else url.searchParams.set("auth", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  async function signIn(workEmail, password) {
    const validation = validatePasswordLogin(workEmail, password);
    if (validation) throw new Error(validation);
    const result = await auth.signIn(workEmail, password);
    if (!result?.session || !result?.user?.id) {
      const error = new Error("The authentication server returned an incomplete session.");
      error.code = "AUTH_RESPONSE_INVALID";
      throw error;
    }
    window.location.assign(withoutAuthView());
  }

  async function signInWithPasskey() {
    if (!auth.configured) throw Object.assign(new Error("Authentication is not configured for this application."), { code: "AUTH_CONFIGURATION_MISSING" });
    try {
      const result = await signInWithAccountPasskey({ supabaseUrl: auth.publicConfig.url, supabaseAnonKey: auth.publicConfig.anonKey });
      if (!result?.access_token || !result?.refresh_token) throw new Error("The passkey service returned an incomplete session.");
      await auth.adoptSession({ access_token: result.access_token, refresh_token: result.refresh_token });
      window.location.assign(withoutAuthView());
    } catch (passkeyError) {
      const error = new Error(passkeySignInUserMessage(passkeyError));
      error.code = passkeyError?.code;
      error.status = passkeyError?.status;
      throw error;
    }
  }

  async function oauth(provider) {
    setOauthError(null);
    setOauthProvider(provider);
    try {
      await auth.signInWithOAuth(provider);
    } catch (error) {
      setOauthError(toAuthUserMessage(error));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {view === "forgot" && (
        <PasswordRecoveryView
          onBack={() => navigate("login")}
          onRequest={async (workEmail) => {
            await auth.resetPassword(workEmail);
          }}
          toMessage={toAuthUserMessage}
        />
      )}
      {view === "reset" && (
        <ResetPasswordView
          recoveryToken={null}
          onBack={() => navigate("login")}
          onUpdate={async (_token, newPassword) => {
            await auth.updatePassword(newPassword);
          }}
          toMessage={toAuthUserMessage}
        />
      )}
      {view === "verify" && (
        <EmailConfirmationView
          email={email}
          onBack={() => navigate("login")}
          onResend={async (workEmail) => {
            await auth.resendConfirmation(workEmail);
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
          configured={auth.configured}
          initialError={oauthError}
          onClearOAuthError={() => setOauthError(null)}
          oauthProvider={oauthProvider}
          toMessage={toAuthUserMessage}
        />
      )}
    </div>
  );
}
