import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { BrandLogo } from "./components/BrandLogo";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { DashboardPreferencesProvider } from "./contexts/DashboardPreferencesContext";
import Home from "./pages/Home";

const PublicAuthGateway = lazy(
  // @ts-expect-error The lightweight public auth gateway intentionally remains JavaScript.
  () => import("./components/PublicAuthGateway"),
);
const BusinessSphereDashboard = lazy(
  // @ts-expect-error The preserved single-file dashboard intentionally remains JavaScript.
  () => import("./BusinessSphereDashboard"),
);
const PublicSignupGateway = lazy(
  // @ts-expect-error The lightweight public signup gateway intentionally remains JavaScript.
  () => import("./components/PublicSignupGateway"),
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

function isSignupRequest() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("auth") === "signup";
}
function isPublicAuthRequest() {
  if (typeof window === "undefined") return false;
  const token = window.localStorage.getItem("bs_access_token");
  const auth = new URLSearchParams(window.location.search).get("auth");
  const explicitPublicScreen = auth && ["login", "forgot", "reset", "verify"].includes(auth);
  // If a valid session token is stored, never trap the user in a public auth screen
  if (token && explicitPublicScreen) return false;
  return Boolean(explicitPublicScreen) || (!auth && !token);
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"}>{() => <Suspense fallback={<DashboardRouteFallback />}>{isSignupRequest() ? <PublicSignupGateway onBack={() => window.location.assign("/app")} /> : isPublicAuthRequest() ? <PublicAuthGateway /> : <BusinessSphereDashboard />}</Suspense>}</Route>
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
