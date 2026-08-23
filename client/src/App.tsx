import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
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

function AuthenticationUnavailable() {
  return <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-red-400/20 bg-slate-900 p-7 text-center shadow-2xl" role="alert">
      <h1 className="text-lg font-semibold">Secure authentication is unavailable</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">This workspace cannot verify an account because its public Supabase configuration is unavailable. Contact the workspace administrator instead of continuing in an unverified mode.</p>
    </section>
  </main>;
}

function IdentitySetupRequired({ reason }: { reason?: string | null }) {
  return <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-amber-300/20 bg-slate-900 p-7 text-center shadow-2xl" role="alert">
      <h1 className="text-lg font-semibold">Secure workspace setup required</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">Your Supabase session is valid, but the application could not verify the profile and workspace identity required for tenant-scoped access.</p>
      {reason && <p className="mt-3 text-xs text-slate-500">Reference: {reason}</p>}
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

  if (auth.loading) return <DashboardRouteFallback />;
  if (auth.status === "AUTH_ERROR") return <AuthenticationUnavailable />;
  if (auth.status === "UNAUTHORIZED") return <IdentitySetupRequired reason={typeof auth.reason === "string" ? auth.reason : null} />;
  if (authScreen === "forgot" || authScreen === "reset" || (isPublicAuthScreen() && !auth.isAuthenticated)) return <Suspense fallback={<DashboardRouteFallback />}><PublicAuthGateway /></Suspense>;
  if (!auth.configured && !auth.isAuthenticated) {
    if (requestedSignup && import.meta.env.MODE === "e2e") return <Suspense fallback={<DashboardRouteFallback />}><BusinessSphereDashboard /></Suspense>;
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
