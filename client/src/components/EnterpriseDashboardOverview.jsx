import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const compactNumber = (value) => new Intl.NumberFormat("en", { maximumFractionDigits: 0, notation: "compact" }).format(Math.abs(Number(value) || 0));

function Panel({ children, className = "" }) {
  return <section className={`relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_2px_3px_rgba(15,23,42,.025)] transition-shadow duration-200 hover:shadow-[0_16px_32px_rgba(15,23,42,.055)] ${className}`}>{children}</section>;
}

function Skeleton({ className = "" }) {
  return <span className={`block animate-pulse rounded-lg bg-slate-100 ${className}`} aria-hidden="true" />;
}

const widgetTones = {
  emerald: { eyebrow: "text-emerald-700", icon: "border-emerald-100 bg-emerald-50 text-emerald-700", line: "bg-emerald-500" },
  amber: { eyebrow: "text-amber-700", icon: "border-amber-100 bg-amber-50 text-amber-700", line: "bg-amber-400" },
  violet: { eyebrow: "text-violet-700", icon: "border-violet-100 bg-violet-50 text-violet-700", line: "bg-violet-500" },
  sky: { eyebrow: "text-sky-700", icon: "border-sky-100 bg-sky-50 text-sky-700", line: "bg-sky-500" },
};

function WidgetHeader({ eyebrow, title, icon: Icon, tone = "emerald", actionLabel, onAction }) {
  const style = widgetTones[tone] || widgetTones.emerald;
  return <header className="relative flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"><span className={`absolute inset-y-4 left-0 w-1 rounded-r-full ${style.line}`} aria-hidden="true" /><div className="min-w-0"><p className={`text-[10px] font-bold uppercase tracking-[.12em] ${style.eyebrow}`}>{eyebrow}</p><h2 className="mt-1 text-[16px] font-semibold tracking-[-.025em] text-slate-950">{title}</h2></div>{actionLabel ? <button type="button" onClick={onAction} className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10.5px] font-bold ${style.eyebrow} transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600`}>{actionLabel}<ArrowRight size={13} /></button> : <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${style.icon}`}><Icon size={17} aria-hidden="true" /></span>}</header>;
}

function MetricCard({ label, value, detail, tone, icon: Icon, onClick }) {
  return (
    <button type="button" onClick={onClick} className="group relative min-h-[166px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,.03)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_30px_rgba(15,23,42,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
      <span className={`absolute inset-x-0 top-0 h-1 ${tone.edge}`} aria-hidden="true" />
      <span className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-70 blur-2xl ${tone.glow}`} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl border border-white/70 shadow-sm ${tone.bg} ${tone.text}`}><Icon size={18} aria-hidden="true" /></span>
        <ChevronRight size={16} className="mt-1 text-slate-300 transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" />
      </div>
      <p className="relative mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</p>
      <p className="relative mt-1.5 text-[24px] font-bold tracking-[-.045em] text-slate-950">{value}</p>
      <p className="relative mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">{detail}</p>
      <span className={`relative mt-3 inline-flex items-center gap-1 text-[10px] font-bold ${tone.text}`}>View details <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" /></span>
    </button>
  );
}

function EmptyPanel({ icon: Icon = ClipboardCheck, title, detail, actionLabel, onAction }) {
  return <div className="relative flex min-h-[244px] flex-col items-center justify-center overflow-hidden px-5 py-8 text-center"><span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-100/70 blur-2xl" aria-hidden="true" /><span className="relative grid h-11 w-11 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm"><Icon size={19} /></span><h3 className="relative mt-4 text-sm font-semibold text-slate-900">{title}</h3><p className="relative mt-1 max-w-sm text-[12px] leading-5 text-slate-500">{detail}</p>{actionLabel && <button type="button" onClick={onAction} className="relative mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{actionLabel}<ArrowRight size={13} /></button>}</div>;
}

export function EnterpriseDashboardOverview({
  company,
  currentUser,
  invoices,
  expenses,
  inventory,
  crm,
  leaveRequests,
  workOrders,
  subscriptions,
  financials,
  revenueExpenseTrend,
  recentActivity,
  attentionItems,
  pendingLeave,
  formatMoney,
  onNavigate,
  onQuickAction,
}) {
  const invoiceRows = invoices?.rows || [];
  const expenseRows = expenses?.rows || [];
  const inventoryRows = inventory?.rows || [];
  const crmRows = crm?.rows || [];
  const subscriptionRows = subscriptions?.rows || [];
  const isLoading = Boolean(invoices?.loading || expenses?.loading || inventory?.loading || crm?.loading);
  const hasError = [invoices, expenses, inventory, crm].some((source) => source?.error);
  const lowStockCount = inventoryRows.filter((item) => item.qty <= item.reorder && item.reorder > 0).length;
  const openDeals = crmRows.filter((lead) => !["Won", "Lost"].includes(lead.stage));
  const pipelineTotal = openDeals.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
  const activeSubscriptions = subscriptionRows.filter((subscription) => subscription.status === "Active").length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const hasCoreRows = invoiceRows.length + expenseRows.length + inventoryRows.length + crmRows.length > 0;
  const money = (amount) => formatMoney ? formatMoney(amount || 0) : `TZS ${compactNumber(amount)}`;

  const metrics = [
    { label: "Collected", value: money(financials?.revenue), detail: invoiceRows.length ? "Confirmed invoice payments in the current view" : "No confirmed invoice payments yet", icon: CircleDollarSign, tone: { bg: "bg-emerald-50", text: "text-emerald-700", edge: "bg-emerald-500", glow: "bg-emerald-200" }, action: () => onQuickAction("finance", { tab: "receivables" }) },
    { label: "Open receivables", value: money(financials?.pendingCash), detail: financials?.outstandingCount ? `${financials.outstandingCount} invoice${financials.outstandingCount === 1 ? "" : "s"} still open` : "No outstanding invoices", icon: ReceiptText, tone: { bg: "bg-amber-50", text: "text-amber-700", edge: "bg-amber-400", glow: "bg-amber-200" }, action: () => onQuickAction("finance", { tab: "receivables" }) },
    { label: "Pipeline", value: money(pipelineTotal), detail: openDeals.length ? `${openDeals.length} open deal${openDeals.length === 1 ? "" : "s"} in CRM` : "No open deals yet", icon: Users, tone: { bg: "bg-violet-50", text: "text-violet-700", edge: "bg-violet-500", glow: "bg-violet-200" }, action: () => onNavigate("crm") },
    { label: "Stock attention", value: String(lowStockCount), detail: lowStockCount ? "Items at or below their confirmed reorder level" : inventoryRows.length ? "No stock items need attention" : "No confirmed stock items yet", icon: Package, tone: { bg: "bg-rose-50", text: "text-rose-700", edge: "bg-rose-500", glow: "bg-rose-200" }, action: () => onNavigate("inventory") },
  ];

  const workspaceSignals = [
    { label: "Revenue signal", value: money(financials?.revenue), detail: invoiceRows.length ? `${invoiceRows.length} invoice record${invoiceRows.length === 1 ? "" : "s"} in this view` : "Waiting for confirmed payments", icon: TrendingUp, tone: "text-emerald-100", surface: "bg-emerald-300/10" },
    { label: "Pipeline signal", value: money(pipelineTotal), detail: openDeals.length ? `${openDeals.length} open ${openDeals.length === 1 ? "opportunity" : "opportunities"}` : "No active CRM opportunity", icon: Users, tone: "text-amber-100", surface: "bg-amber-300/10" },
    { label: "Review queue", value: String(attentionItems?.length || 0), detail: attentionItems?.length ? "Live item(s) currently need review" : "No live escalation at present", icon: AlertTriangle, tone: "text-sky-100", surface: "bg-sky-300/10" },
  ];

  const quickActions = [
    { label: "Create invoice", detail: "Start a sales invoice", icon: ReceiptText, action: () => onQuickAction("sales", { tab: "invoices", openForm: true }) },
    { label: "Add a lead", detail: "Capture a customer opportunity", icon: Users, action: () => onQuickAction("crm", { tab: "leads" }) },
    { label: "Record expense", detail: "Open finance expenses", icon: Wallet, action: () => onQuickAction("finance", { tab: "expenses" }) },
    { label: "Ask Smart AI", detail: "Open the existing assistant", icon: Brain, action: () => onNavigate("ai") },
  ];

  return (
    <div className="enterprise-overview mx-auto w-full max-w-[1600px] space-y-7 pb-10">
      <header className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[#0b1f1a] px-5 py-6 text-white shadow-[0_18px_48px_rgba(11,31,26,.16)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_0%,rgba(212,163,83,.28),transparent_28%),radial-gradient(circle_at_10%_100%,rgba(22,163,116,.22),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent_76%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Workspace overview</div>
            <h1 className="mt-4 text-[30px] font-semibold tracking-[-.055em] sm:text-[36px]">{greeting}, {(currentUser?.name || company?.owner || "there").split(" ")[0]}.</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-emerald-50/70">A concise view of confirmed finance, sales, stock and operating signals for <strong className="font-semibold text-white">{company?.name || "your workspace"}</strong>.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigate("reports")} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.08] px-3.5 py-2.5 text-[12px] font-semibold transition hover:bg-white/[.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><BarChart3 size={15} />Open reports</button>
            <button type="button" onClick={() => onQuickAction("sales", { tab: "invoices", openForm: true })} className="inline-flex items-center gap-2 rounded-xl bg-[#d9a34d] px-3.5 py-2.5 text-[12px] font-bold text-[#10231e] transition hover:bg-[#e4b364] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5d39c]"><Plus size={15} />New invoice</button>
          </div>
        </div>
        <section className="relative mt-7 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-3" aria-label="Workspace signals">
          {workspaceSignals.map((signal) => {
            const Icon = signal.icon;
            return <div key={signal.label} className={`min-w-0 rounded-2xl border border-white/10 ${signal.surface} px-3.5 py-3 backdrop-blur-sm`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-white/55">{signal.label}</span><Icon size={14} className={signal.tone} aria-hidden="true" /></div><p className="mt-2 truncate text-[18px] font-bold tracking-[-.04em] text-white">{signal.value}</p><p className="mt-1 truncate text-[10.5px] text-white/55">{signal.detail}</p></div>;
          })}
        </section>
        <div className="relative mt-6 flex flex-wrap gap-2 text-[10.5px] text-emerald-50/75">
          <span className="rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5">{isLoading ? "Refreshing confirmed data" : "Confirmed workspace data"}</span>
          <span className="rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5">{activeSubscriptions ? `${activeSubscriptions} active subscription${activeSubscriptions === 1 ? "" : "s"}` : "Subscription state available in Sales"}</span>
          <span className="rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5">Role: {currentUser?.role || "Workspace member"}</span>
        </div>
      </header>

      {hasError && <Panel className="border-rose-200 bg-rose-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-rose-700"><AlertTriangle size={17} /></span><div><p className="text-[12px] font-bold text-rose-950">Some live workspace information is unavailable</p><p className="mt-0.5 text-[11px] leading-5 text-rose-800">The dashboard keeps confirmed content visible where possible. No local fallback is treated as saved data.</p></div></div><button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-semibold text-rose-800 hover:bg-rose-100">Retry secure refresh</button></div></Panel>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key performance indicators">
        {isLoading ? Array.from({ length: 4 }, (_, index) => <Panel key={index} className="min-h-[152px] p-4"><Skeleton className="h-10 w-10" /><Skeleton className="mt-5 h-3 w-20" /><Skeleton className="mt-3 h-7 w-28" /><Skeleton className="mt-3 h-3 w-full" /></Panel>) : metrics.map((metric) => <MetricCard key={metric.label} {...metric} onClick={metric.action} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,.9fr)]">
        <Panel className="overflow-hidden">
          <WidgetHeader eyebrow="Financial movement" title="Collected value and recorded expenses" icon={BarChart3} tone="emerald" actionLabel="Open finance" onAction={() => onNavigate("finance")} />
          {isLoading ? <div className="h-[294px] p-5"><Skeleton className="h-full w-full" /></div> : revenueExpenseTrend?.some((point) => point.revenue_tzs_k || point.expenses_tzs_k) ? <div className="h-[294px] px-2 pb-5 pt-4 sm:px-5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueExpenseTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="smRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f8b6d" stopOpacity=".28" /><stop offset="100%" stopColor="#0f8b6d" stopOpacity="0" /></linearGradient><linearGradient id="smExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d9a34d" stopOpacity=".22" /><stop offset="100%" stopColor="#d9a34d" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1ef" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#7a8983", fontSize: 11 }} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#7a8983", fontSize: 10 }} tickFormatter={(value) => `${compactNumber(value)}k`} /><Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #e2e8e5", boxShadow: "0 12px 30px rgba(15,23,42,.12)", fontSize: 12 }} formatter={(value, name) => [`TZS ${compactNumber(value)}k`, name === "revenue_tzs_k" ? "Collected" : "Expenses"]} /><Area type="monotone" dataKey="revenue_tzs_k" stroke="#0f8b6d" strokeWidth={2.5} fill="url(#smRevenue)" /><Area type="monotone" dataKey="expenses_tzs_k" stroke="#d9a34d" strokeWidth={2} fill="url(#smExpense)" /></AreaChart></ResponsiveContainer></div> : <EmptyPanel icon={BarChart3} title="Your first financial trend will appear here" detail="The chart uses confirmed invoice payments and recorded expenses. Add business records through the existing Sales or Finance workspace." actionLabel="Open finance" onAction={() => onNavigate("finance")} />}
        </Panel>

        <Panel className="overflow-hidden">
          <WidgetHeader eyebrow="Attention queue" title="What needs a review" icon={AlertTriangle} tone="amber" />
          {attentionItems?.length ? <div className="divide-y divide-slate-100">{attentionItems.slice(0, 4).map((item) => { const Icon = item.icon || AlertTriangle; return <button type="button" key={item.id} onClick={item.action} className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ background: item.surface, color: item.color }}><Icon size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-slate-900">{item.title}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{item.detail}</span><span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">{item.actionLabel}<ChevronRight size={12} /></span></span></button>; })}</div> : <EmptyPanel icon={CheckCircle2} title="No current attention signals" detail="Alerts appear from confirmed workspace conditions, such as stock thresholds or overdue work orders." actionLabel="Open activity" onAction={() => onNavigate("activity")} />}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel className="overflow-hidden"><WidgetHeader eyebrow="Momentum" title="Recent confirmed activity" icon={Activity} tone="violet" />{recentActivity?.length ? <div className="divide-y divide-slate-100">{recentActivity.slice(0, 5).map((activity, index) => { const Icon = activity.icon || Activity; return <div key={`${activity.text}-${index}`} className="flex items-center gap-3 px-5 py-3.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${activity.color}16`, color: activity.color }}><Icon size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-slate-900">{activity.text}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{activity.sub}</p></div><span className="shrink-0 text-[10px] font-medium text-slate-400">{activity.date || ""}</span></div>; })}</div> : <EmptyPanel icon={Activity} title="No confirmed activity yet" detail="This timeline will use actual invoices, expenses, and leave records once they are available." actionLabel="Open reports" onAction={() => onNavigate("reports")} />}</Panel>
        <Panel className="overflow-hidden"><WidgetHeader eyebrow="Team & next steps" title="Approvals and tasks" icon={CalendarClock} tone="sky" />{pendingLeave?.length ? <div className="divide-y divide-slate-100">{pendingLeave.slice(0, 4).map((leave) => <button type="button" key={leave.id} onClick={() => onQuickAction("hr", { tab: "leave" })} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><CalendarClock size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-slate-900">{leave.employee}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500">{leave.type} · {leave.startDate} to {leave.endDate}</span></span><ChevronRight size={14} className="text-slate-300" /></button>)}</div> : <EmptyPanel icon={ClipboardCheck} title="No approval tasks are waiting" detail="When confirmed leave requests need review, they will appear here for authorized team members." actionLabel="Open people workspace" onAction={() => onQuickAction("hr", { tab: "leave" })} />}</Panel>
      </section>

      <section><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Quick actions</p><h2 className="mt-1 text-[17px] font-semibold tracking-[-.025em] text-slate-950">Move work forward</h2></div><span className="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] font-medium text-slate-500 sm:inline">Each action opens an existing workspace.</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{quickActions.map((action) => { const Icon = action.icon; return <button type="button" key={action.label} onClick={action.action} className="group relative flex min-h-[104px] items-center gap-3 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white p-4 text-left shadow-[0_2px_3px_rgba(15,23,42,.025)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_28px_rgba(15,23,42,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-100/60 blur-2xl opacity-0 transition group-hover:opacity-100" aria-hidden="true" /><span className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:border-emerald-100 group-hover:bg-emerald-50 group-hover:text-emerald-700"><Icon size={18} /></span><span className="relative min-w-0 flex-1"><span className="block text-[12px] font-semibold text-slate-900">{action.label}</span><span className="mt-0.5 block text-[11px] text-slate-500">{action.detail}</span></span><ArrowRight size={15} className="relative text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" /></button>; })}</div></section>

      {!hasCoreRows && !isLoading && <Panel className="border-dashed border-emerald-200 bg-emerald-50/40"><EmptyPanel icon={FileText} title="This workspace is ready for its first confirmed records" detail="The dashboard does not invent business metrics. Add or import records through the existing Sales, Finance, CRM, and Inventory modules to populate this overview." actionLabel="Open Sales" onAction={() => onNavigate("sales")} /></Panel>}
    </div>
  );
}
