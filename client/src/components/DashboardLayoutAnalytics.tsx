import { BarChart3, Info, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useState } from "react";

const ranges = [
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["90d", "Last 90 days"],
  ["all", "All time"],
] as const;

export function DashboardLayoutAnalytics() {
  const [range, setRange] = useState<(typeof ranges)[number][0]>("30d");
  const { data, isLoading, isError, refetch, isFetching } = trpc.dashboardLayoutAnalytics.summary.useQuery({ range }, { retry: false });
  const maxSource = Math.max(1, ...(data?.topSources || []).map((row) => row.adoptionEvents));
  const maxDay = Math.max(1, ...(data?.activityByDay || []).map((row) => row.adoptionEvents));

  return (
    <section className="space-y-4" aria-labelledby="layout-analytics-title">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-emerald-700"><BarChart3 size={14} /> Personalization intelligence</div>
          <h2 id="layout-analytics-title" className="mt-1 text-[21px] font-black tracking-tight text-slate-950">Dashboard layout adoption</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">Understand which team presets and layout patterns are being applied, without collecting business records, preference payloads, or user identifiers.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="layout-analytics-range">Analytics range</label>
          <select id="layout-analytics-range" value={range} onChange={(event) => setRange(event.target.value as typeof range)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
            {ranges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50" aria-label="Refresh layout analytics"><RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </div>

      {isLoading ? <div className="grid gap-3 md:grid-cols-3"><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /></div> : isError ? <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-[12px] text-rose-800">Analytics are unavailable for this administrator session. The tenant data and layout preferences remain unchanged.</div> : <>
        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Adoption events" value={data?.adoptionEvents ?? 0} detail="Successful layout or preset applications" icon={<TrendingUp size={17} />} />
          <Metric label="Tracked events" value={data?.trackedEvents ?? 0} detail="All accepted telemetry events in range" icon={<BarChart3 size={17} />} />
          <Metric label="Privacy boundary" value="Protected" detail="No business data or user IDs stored" icon={<ShieldCheck size={17} />} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-[13px] font-black text-slate-900">Most applied sources</h3><p className="mt-1 text-[10.5px] text-slate-500">Event volume, ranked by resolved preset or layout source.</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Tenant scoped</span></div>
            <div className="mt-5 space-y-3">{data?.topSources?.length ? data.topSources.map((row) => <div key={`${row.sourceType}:${row.label}`}><div className="mb-1 flex items-center justify-between gap-3 text-[11px]"><span className="truncate font-bold text-slate-700">{row.label}</span><span className="font-mono font-bold text-slate-500">{row.adoptionEvents}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(5, (row.adoptionEvents / maxSource) * 100)}%` }} /></div></div>) : <Empty text="No adoption events in this range." />}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-[13px] font-black text-slate-900">Activity trend</h3><p className="mt-1 text-[10.5px] text-slate-500">Daily adoption events; dates are displayed in UTC.</p>
            <div className="mt-5 flex h-36 items-end gap-1.5">{data?.activityByDay?.length ? data.activityByDay.map((row) => <div key={row.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${row.date}: ${row.adoptionEvents} adoption events`}><div className="w-full rounded-t bg-amber-400" style={{ height: `${Math.max(6, (row.adoptionEvents / maxDay) * 100)}%` }} /><span className="hidden text-[8px] text-slate-400 group-last:block">{row.date.slice(5)}</span></div>) : <Empty text="No trend data yet." />}</div>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10.5px] leading-4 text-slate-500"><Info size={14} className="mt-0.5 shrink-0 text-slate-400" /><span>{data?.note}</span></div>
      </>}
    </section>
  );
}

function Metric({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</span><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Verified</span></div><p className="mt-4 text-[24px] font-black tracking-tight text-slate-950">{value}</p><p className="text-[11px] font-bold text-slate-700">{label}</p><p className="mt-1 text-[10.5px] text-slate-500">{detail}</p></div>;
}

function Empty({ text }: { text: string }) { return <div className="flex h-24 w-full items-center justify-center text-[11px] text-slate-400">{text}</div>; }
