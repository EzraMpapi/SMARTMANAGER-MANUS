import { lazy, Suspense } from "react";

const DashboardCore = lazy(() => import("./BusinessSphereDashboardCore.jsx"));

function DashboardEntryFallback() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6" role="status" aria-live="polite">
      <section className="w-full max-w-sm border border-white/10 bg-slate-900/80 p-6 text-center" aria-label="Loading Smart Manager">
        <p className="text-base font-semibold">Preparing Smart Manager</p>
        <p className="mt-2 text-sm text-slate-400">Loading your secure business workspace.</p>
      </section>
    </main>
  );
}

export default function BusinessSphereDashboard() {
  return (
    <Suspense fallback={<DashboardEntryFallback />}>
      <DashboardCore />
    </Suspense>
  );
}

/* Extracted from BusinessSphereDashboard.jsx to keep Vercel source files below the direct-upload limit. */
