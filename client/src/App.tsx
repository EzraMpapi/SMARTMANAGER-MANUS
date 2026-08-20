import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, type ComponentType } from "react";
import NotFound from "@/pages/NotFound";

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
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { BrandLogo } from "./components/BrandLogo";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { DashboardPreferencesProvider } from "./contexts/DashboardPreferencesContext";
import Home from "./pages/Home";

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

function DashboardRouteFallback() {
  return <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6" role="status" aria-live="polite">
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-2xl">
      <BrandLogo variant="compact" priority className="mx-auto h-11 w-11 animate-pulse ring-1 ring-emerald-300/30" />
      <h1 className="mt-4 text-base font-semibold">Preparing Smart Manager</h1>
      <p className="mt-1 text-sm text-slate-400">Loading your secure business workspace.</p>
    </div>
  </main>;
}

function isPublicAuthRequest() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  let hasStoredSession = false;
  try {
    hasStoredSession = Boolean(
      window.localStorage.getItem("bs_access_token") ||
      window.sessionStorage.getItem("bs_session_access_token"),
    );
  } catch {}
  return params.get("auth") !== "signup" && !hasStoredSession;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"}>{() => <Suspense fallback={<DashboardRouteFallback />}>{isPublicAuthRequest() ? <PublicAuthGateway /> : <BusinessSphereDashboard />}</Suspense>}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable={true}
      >
        <LanguageProvider>
          <DashboardPreferencesProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </DashboardPreferencesProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
