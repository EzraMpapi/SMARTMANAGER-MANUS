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

// @ts-expect-error The preserved single-file dashboard intentionally remains JavaScript.
const BusinessSphereDashboard = lazy(() => import("./BusinessSphereDashboard"));

function DashboardLoadingBoundary() {
  return (
    <main className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center p-6" aria-busy="true" aria-live="polite">
      <section className="w-full max-w-md rounded-2xl border border-[#C9A96E]/25 bg-[#10182A] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-[#C9A96E]/30 border-t-[#C9A96E] animate-spin" aria-hidden="true" />
        <h1 className="font-heading text-lg font-bold text-[#F7E7C1]">Preparing your command center</h1>
        <p className="mt-2 text-sm text-slate-400">Loading the secure BusinessSphere workspace…</p>
      </section>
    </main>
  );
}

function LazyBusinessSphereDashboard() {
  return (
    <Suspense fallback={<DashboardLoadingBoundary />}>
      <BusinessSphereDashboard />
    </Suspense>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"} component={LazyBusinessSphereDashboard} />
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
