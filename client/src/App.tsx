import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useState, type ComponentType, type ReactNode } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { BrandLogo } from "./components/BrandLogo";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { DashboardPreferencesProvider } from "./contexts/DashboardPreferencesContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { AUTH_STATES } from "./lib/authStateMachine";
import Home from "./pages/Home";

type LazyModule = { default: ComponentType<any> };

function lazyWithRecovery(load: () => Promise<LazyModule>, key: string) {
  return lazy(async () => {
    const retryKey = `smart-manager-lazy-retry:${key}`;
    try {
      const module = await load();
      try { window.sessionStorage.removeItem(retryKey); } catch {}
      return module;
    } catch (error) {
      let alreadyRetried = false;
      try { alreadyRetried = window.sessionStorage.getItem(retryKey) === "1"; } catch {}
      if (!alreadyRetried && typeof window !== "undefined") {
        try { window.sessionStorage.setItem(retryKey, "1"); } catch {}
        window.location.reload();
        return new Promise(() => {});
      }
      try { window.sessionStorage.removeItem(retryKey); } catch {}
      throw error;
    }
  });
}

const PublicAuthGateway = lazyWithRecovery(
  // @ts-expect-error The lightweight public auth gateway intentionally remains JavaScript.
  () => import("./components/PublicAuthGateway"),
  "public-auth-gateway",
);
const BusinessSphereDashboard = lazyWithRecovery(
  // @ts-expect-error The preserved single-file dashboard intentionally remains JavaScript.
  () => import("./BusinessSphereDashboard"),
  "business-sphere-dashboard",
);
const PatientSmsConsentSettings = lazyWithRecovery(
  // @ts-expect-error The patient preference experience is intentionally authored in JavaScript.
  () => import("./components/PatientSmsConsentSettings"),
  "patient-sms-consent-settings",
);

function DashboardRouteFallback() {
  return <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6" role="status" aria-live="polite">
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-2xl">
      <BrandLogo variant="compact" priority className="mx-auto h-11 w-11 animate-pulse ring-1 ring-emerald-300/30" />
      <h1 className="mt-4 text-base font-semibold">Preparing Smart Manager</h1>
      <p className="mt-1 text-sm text-slate-400">Loading your secure business workspace.</p>
    </div>
  </main>;
}

function AuthenticationUnavailable({ onRetry }: { onRetry?: () => Promise<void> }) {
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try { await onRetry(); } finally { setRetrying(false); }
  };
  return <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-red-400/20 bg-slate-900 p-7 text-center shadow-2xl" role="alert">
      <h1 className="text-lg font-semibold">Secure authentication is unavailable</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">This workspace cannot verify the account identity required for tenant-scoped access. Retry secure recovery before signing out; no unverified workspace data is displayed.</p>
      {onRetry && <button type="button" onClick={() => void retry()} disabled={retrying} className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">{retrying ? "Recovering secure workspace…" : "Retry secure workspace recovery"}</button>}
    </section>
  </main>;
}

function IdentitySetupRequired({ reason, onRetry }: { reason?: string | null; onRetry?: () => Promise<void> }) {
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try { await onRetry(); } finally { setRetrying(false); }
  };
  return <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-amber-300/20 bg-slate-900 p-7 text-center shadow-2xl" role="alert">
      <h1 className="text-lg font-semibold">Secure workspace setup required</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">Your Supabase session is valid, but the application could not verify the profile and workspace identity required for tenant-scoped access.</p>
      {reason && <p className="mt-3 text-xs text-slate-500">Reference: {reason}</p>}
      {onRetry && <button type="button" onClick={() => void retry()} disabled={retrying} className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">{retrying ? "Checking secure workspace…" : "Retry secure workspace access"}</button>}
    </section>
  </main>;
}

function requestedAuthScreen() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("auth") || "";
}

function isPublicAuthScreen() {
  return ["login", "forgot", "reset", "verify"].includes(requestedAuthScreen());
}

function ProtectedSurface({ children }: { children: ReactNode }) {
  const auth = useAuthContext();
  const authScreen = requestedAuthScreen();
  const requestedSignup = authScreen === "signup";

  // The isolated browser journey intentionally exercises only the local signup
  // completion surface. It is compiled solely with `--mode e2e` and never
  // creates a Supabase client, requests credentials, or exposes a real tenant.
  if (requestedSignup && import.meta.env.MODE === "e2e") return <Suspense fallback={<DashboardRouteFallback />}><BusinessSphereDashboard /></Suspense>;
  if (auth.loading) return <DashboardRouteFallback />;
  if (auth.status === "AUTH_ERROR") return <AuthenticationUnavailable onRetry={auth.session ? auth.refresh : undefined} />;
  if (auth.status === "UNAUTHORIZED") return <IdentitySetupRequired reason={typeof auth.reason === "string" ? auth.reason : null} onRetry={auth.session ? auth.refresh : undefined} />;
  if (authScreen === "forgot" || authScreen === "reset" || (isPublicAuthScreen() && !auth.isAuthenticated)) return <Suspense fallback={<DashboardRouteFallback />}><PublicAuthGateway /></Suspense>;
  if (!auth.configured && !auth.isAuthenticated) {
    return <AuthenticationUnavailable />;
  }
  if (!auth.isAuthenticated) {
    if (requestedSignup) return <Suspense fallback={<DashboardRouteFallback />}><BusinessSphereDashboard /></Suspense>;
    return <Suspense fallback={<DashboardRouteFallback />}><PublicAuthGateway /></Suspense>;
  }
  return <>{children}</>;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/app">{() => <ProtectedSurface><Suspense fallback={<DashboardRouteFallback />}><BusinessSphereDashboard /></Suspense></ProtectedSurface>}</Route>
    <Route path="/patient/sms-preferences">{() => <ProtectedSurface><Suspense fallback={<DashboardRouteFallback />}><PatientSmsConsentSettings /></Suspense></ProtectedSurface>}</Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <LanguageProvider>
          <DashboardPreferencesProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </DashboardPreferencesProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </ErrorBoundary>;
}

export default App;
