import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { DashboardPreferencesProvider } from "./contexts/DashboardPreferencesContext";
import Home from "./pages/Home";

const BusinessSphereDashboard = lazy(
  // @ts-expect-error The preserved single-file dashboard intentionally remains JavaScript.
  () => import("./BusinessSphereDashboard"),
);

function DashboardRouteFallback() {
  return <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6" role="status" aria-live="polite">
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-2xl">
      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
      <h1 className="mt-4 text-base font-semibold">Preparing Smart Manager</h1>
      <p className="mt-1 text-sm text-slate-400">Loading your secure business workspace.</p>
    </div>
  </main>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"}>{() => <Suspense fallback={<DashboardRouteFallback />}><BusinessSphereDashboard /></Suspense>}</Route>
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
