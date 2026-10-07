import { Skeleton } from './ui/skeleton';

const navigationRows = [
  'w-28',
  'w-36',
  'w-24',
  'w-32',
  'w-28',
  'w-20',
];

const metricRows = [
  { value: 'w-24', trend: 'w-14' },
  { value: 'w-20', trend: 'w-16' },
  { value: 'w-28', trend: 'w-12' },
  { value: 'w-24', trend: 'w-20' },
];

function SkeletonLine({ className = '' }: { className?: string }) {
  return <Skeleton className={`rounded-md ${className}`} />;
}

function SidebarSkeleton() {
  return (
    <aside className="hidden w-[276px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3 border-b border-slate-200/80 px-2 pb-6 dark:border-slate-800">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-3.5 w-32" />
          <SkeletonLine className="h-2.5 w-20" />
        </div>
      </div>

      <div className="mt-7 space-y-7">
        {[0, 1, 2].map((section) => (
          <div key={section} className="space-y-2">
            <SkeletonLine className="ml-3 h-2.5 w-16" />
            <div className="space-y-1.5">
              {navigationRows.slice(section * 2, section * 2 + 2).map((width, index) => (
                <div key={`${section}-${index}`} className="flex h-10 items-center gap-3 rounded-xl px-3">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <SkeletonLine className={`h-3 ${width}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-slate-200/80 pt-5 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl px-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-5 w-5 rounded-md" />
        </div>
      </div>
    </aside>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex min-h-16 flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm sm:px-5 dark:border-slate-800 dark:bg-slate-950">
      <Skeleton className="h-10 w-10 rounded-xl lg:hidden" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonLine className="h-3 w-24 sm:w-32" />
        <SkeletonLine className="h-2.5 w-36 sm:w-48" />
      </div>
      <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:w-auto">
        <Skeleton className="h-10 min-w-0 flex-1 rounded-xl sm:w-56 sm:flex-none" />
        <Skeleton className="hidden h-10 w-10 rounded-xl sm:block" />
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </header>
  );
}

function MetricSkeleton({ value, trend }: { value: string; trend: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <div className="mt-5 space-y-2">
        <SkeletonLine className="h-2.5 w-24" />
        <SkeletonLine className={`h-7 ${value}`} />
        <SkeletonLine className={`h-2.5 ${trend}`} />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <SkeletonLine className="h-3.5 w-32" />
          <SkeletonLine className="h-2.5 w-48" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="mt-7 flex h-52 items-end gap-2 border-b border-slate-200/80 px-1 pb-0 dark:border-slate-800 sm:gap-3">
        {[38, 62, 48, 78, 56, 88, 66, 74, 52, 94, 70, 82].map((height, index) => (
          <Skeleton key={index} className="min-w-0 flex-1 rounded-t-lg rounded-b-none" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="mt-3 flex justify-between px-1">
        {[0, 1, 2, 3, 4, 5].map((item) => <SkeletonLine key={item} className="h-2 w-8" />)}
      </div>
    </section>
  );
}

function ActivitySkeleton() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <SkeletonLine className="h-3.5 w-28" />
          <SkeletonLine className="h-2.5 w-36" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="mt-6 space-y-5">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex items-start gap-3">
            <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className={`h-3 ${item % 2 ? 'w-4/5' : 'w-full'}`} />
              <SkeletonLine className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TableSkeleton() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <SkeletonLine className="h-3.5 w-36" />
          <SkeletonLine className="h-2.5 w-52" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="grid grid-cols-[1.3fr_1fr_.8fr_.7fr] gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          {[0, 1, 2, 3].map((item) => <SkeletonLine key={item} className="h-2.5 w-16" />)}
        </div>
        <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="grid grid-cols-[1.3fr_1fr_.8fr_.7fr] items-center gap-3 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3"><Skeleton className="h-8 w-8 shrink-0 rounded-lg" /><SkeletonLine className="h-3 w-28" /></div>
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-3 w-16" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DashboardLayoutSkeleton() {
  return (
    <div
      className="dashboard-layout-skeleton min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
      role="status"
      aria-busy="true"
      aria-label="Loading Smart Manager workspace"
    >
      <span className="sr-only">Loading Smart Manager workspace</span>
      <div className="flex min-h-screen">
        <SidebarSkeleton />
        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-7">
          <div className="mx-auto max-w-[1680px] space-y-5 lg:space-y-6">
            <HeaderSkeleton />
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
              <div className="space-y-2">
                <SkeletonLine className="h-6 w-48 sm:h-8 sm:w-64" />
                <SkeletonLine className="h-3 w-64 sm:w-96" />
              </div>
              <div className="flex gap-2"><Skeleton className="h-10 w-24 rounded-xl" /><Skeleton className="h-10 w-28 rounded-xl" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metricRows.map((metric, index) => <MetricSkeleton key={index} {...metric} />)}
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]">
              <ChartSkeleton />
              <ActivitySkeleton />
            </div>
            <TableSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}
