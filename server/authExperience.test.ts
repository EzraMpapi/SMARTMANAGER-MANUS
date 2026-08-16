import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authViewSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const authGatewaySource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const trpcBootstrapSource = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("public authentication experience", () => {
  it("keeps the mobile Google sign-in control discoverable, disabled while busy, and connected to the configured provider flow", () => {
    expect(authViewSource).toContain("sm-auth-mobile-brand");
    expect(authViewSource).toContain('onClick={() => onOAuth("google")}');
    expect(authViewSource).toContain('type="button" disabled={busy}');
    expect(authGatewaySource).toContain('function oauth(provider)');
    expect(authGatewaySource).toContain('provider=${encodeURIComponent(provider)}');
    expect(authGatewaySource).toContain('redirect_to=${encodeURIComponent(redirectTo.toString())}');
  });

  it("honours the Remember Me choice without treating a session-only login as a persistent device session", () => {
    expect(authViewSource).toContain("const [rememberMe, setRememberMe] = useState(true)");
    expect(authViewSource).toContain("await onSignIn(email.trim(), password, rememberMe)");
    expect(authGatewaySource).toContain("function persistAuthSession(result, remember = true)");
    expect(authGatewaySource).toContain('const SESSION_ACCESS_TOKEN_STORAGE_KEY = "bs_session_access_token"');
    expect(authGatewaySource).toContain("const activeStorage = remember ? window.localStorage : window.sessionStorage");
    expect(appSource).toContain('window.sessionStorage.getItem("bs_session_access_token")');
    expect(trpcBootstrapSource).toContain('sessionStorage.getItem("bs_session_access_token")');
    expect(dashboardSource).toContain("function getStoredAccessToken()");
    expect(dashboardSource).toContain("window.sessionStorage.getItem(SESSION_ACCESS_TOKEN_STORAGE_KEY)");
    expect(dashboardSource).toContain("window.sessionStorage.removeItem(SESSION_ACCESS_TOKEN_STORAGE_KEY)");
  });

  it("gives a visible, recoverable path when Google OAuth is cancelled or otherwise returns an error", () => {
    expect(authViewSource).toContain("oauthRecoveryTitle");
    expect(authViewSource).toContain("oauthRecoveryCopy");
    expect(authViewSource).toContain("function retryGoogle()");
    expect(authViewSource).toContain('onOAuth("google")');
    expect(authViewSource).toContain("function useEmailInstead()");
    expect(authGatewaySource).toContain("onClearOAuthError={() => setOauthError(null)}");
    expect(authGatewaySource).toContain("Google authentication did not complete");
  });
});
