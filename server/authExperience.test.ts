import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authViewSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const authGatewaySource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");
const authSessionStorageSource = readFileSync(new URL("../client/src/lib/authSessionStorage.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const trpcBootstrapSource = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("public authentication experience", () => {
  it("keeps the mobile Google sign-in control discoverable, disabled while busy, and connected to the configured provider flow", () => {
    expect(authViewSource).toContain("sm-auth-mobile-brand");
    expect(authViewSource).toContain('onClick={() => onOAuth("google")}');
    expect(authViewSource).toContain('type="button" disabled={busy}');
    expect(authGatewaySource).toContain('function oauth(provider)');
    expect(authGatewaySource).toContain('await auth.signInWithOAuth(provider)');
    expect(authGatewaySource).toContain('useAuthContext');
  });

  it("honours the Remember Me choice without treating a session-only login as a persistent device session", () => {
    expect(authViewSource).toContain("const [rememberMe, setRememberMe] = useState(true)");
    expect(authViewSource).toContain("await onSignIn(email.trim(), password, rememberMe)");
    expect(authGatewaySource).toContain('await auth.adoptSession({ access_token: result.access_token, refresh_token: result.refresh_token })');
    expect(authSessionStorageSource).toContain("function persistAuthSession(result, remember = true)");
    expect(authSessionStorageSource).toContain('const SESSION_ACCESS_TOKEN_STORAGE_KEY = "bs_session_access_token"');
    expect(authSessionStorageSource).toContain("const activeStorage = remember ? window.localStorage : window.sessionStorage");
    expect(appSource).toContain("<AuthProvider>");
    expect(trpcBootstrapSource).toContain("hasStoredSupabaseSession");
    expect(trpcBootstrapSource).toContain('headers["x-supabase-authorization"] = `Bearer ${supabaseToken}`');
    expect(dashboardSource).toContain("function getStoredAccessToken()");
    expect(readFileSync(new URL("../client/src/contexts/AuthContext.tsx", import.meta.url), "utf8")).toContain("onAuthStateChange");
  });

  it("gives visible, provider-specific recovery paths when Google, Microsoft, or Apple OAuth returns an error", () => {
    expect(authViewSource).toContain("Google sign-in was not completed");
    expect(authViewSource).toContain("Microsoft sign-in was not completed");
    expect(authViewSource).toContain("Apple sign-in was not completed");
    expect(authViewSource).toContain("function retryProvider()");
    expect(authViewSource).toContain("onOAuth(oauthProvider)");
    expect(authViewSource).toContain("function useEmailInstead()");
    expect(authGatewaySource).toContain("onClearOAuthError={() => setOauthError(null)}");
    expect(authGatewaySource).toContain("oauth_provider");
    expect(authGatewaySource).toContain('provider === "azure" ? "Microsoft" : provider === "apple" ? "Apple" : "Google"');
  });
});
