import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PERFORMANCE_RANGES = [
  { id: "7d", label: "7D", days: 7, bucket: "day" },
  { id: "30d", label: "30D", days: 30, bucket: "day" },
  { id: "3m", label: "3M", days: 92, bucket: "month" },
  { id: "6m", label: "6M", days: 183, bucket: "month" },
  { id: "1y", label: "1Y", days: 365, bucket: "month" },
];

const STATUS_COLORS = ["#0f8b6d", "#2563eb", "#f3ad3d", "#8b5cf6", "#e05b50"];

function invoiceValue(row) {
  const direct = [row?.total, row?.grandTotal, row?.amount]
    .map(Number)
    .find(Number.isFinite);
  if (direct !== undefined) return direct;
  return (Array.isArray(row?.items) ? row.items : []).reduce(
    (sum, item) => sum + (Number(item?.qty) || 0) * (Number(item?.price ?? item?.rate) || 0),
    0,
  );
}

function buildPerformanceTrend(invoiceRows, expenseRows, rangeId) {
  const range = PERFORMANCE_RANGES.find((item) => item.id === rangeId) || PERFORMANCE_RANGES[1];
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - range.days + 1);
  const rows = new Map();
  const addRows = (sourceRows, kind) => sourceRows.forEach((row) => {
    const rawDate = row?.date || row?.expenseDate || row?.issueDate;
    if (!rawDate) return;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime()) || date < start || date > end) return;
    const key = range.bucket === "day" ? date.toISOString().slice(0, 10) : date.toISOString().slice(0, 7);
    const bucket = rows.get(key) || { key, revenue_tzs_k: 0, expenses_tzs_k: 0 };
    if (kind === "revenue") {
      bucket.revenue_tzs_k += Math.max(0, (row.status === "Paid" ? invoiceValue(row) : Number(row.amountPaid) || 0) / 1000);
    }
    if (kind === "expense") bucket.expenses_tzs_k += Math.max(0, (Number(row.amount) || 0) / 1000);
    rows.set(key, bucket);
  });

  addRows(invoiceRows, "revenue");
  addRows(expenseRows, "expense");
  return [...rows.values()].sort((a, b) => a.key.localeCompare(b.key)).map((row) => ({
    ...row,
    label: range.bucket === "day"
      ? new Date(`${row.key}T00:00:00`).toLocaleDateString("en", { day: "numeric", month: "short" })
      : new Date(`${row.key}-01T00:00:00`).toLocaleDateString("en", { month: "short" }),
  }));
}

function Panel({ children, className = "" }) {
  return <section className={`sm-panel dashboard-reference-panel overflow-hidden rounded-2xl ${className}`}>{children}</section>;
}

function PanelHeader({ title, detail, actionLabel, onAction, children }) {
  return <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
    <div className="min-w-0">
      <h2 className="truncate text-[15px] font-bold tracking-[-.025em] text-slate-950">{title}</h2>
      {detail && <p className="mt-1 text-[10.5px] font-medium text-slate-500">{detail}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {children}
      {actionLabel && <button type="button" onClick={onAction} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[10.5px] font-bold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50">{actionLabel}<ArrowRight size={12} /></button>}
    </div>
  </header>;
}

function WidgetHeader({ eyebrow, title, icon: Icon, tone = "emerald", actionLabel, onAction }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return <PanelHeader title={title} actionLabel={actionLabel} onAction={onAction}><span className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone] || tones.emerald}`} aria-label={eyebrow}><Icon size={15} aria-hidden="true" /></span></PanelHeader>;
}

function EmptyPanel({ icon: Icon = ClipboardCheck, title, detail, actionLabel, onAction }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center">
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={18} /></span>
    <h3 className="mt-3 text-[13px] font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">{detail}</p>
    {actionLabel && <button type="button" onClick={onAction} className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{actionLabel}<ArrowRight size={13} /></button>}
  </div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone = "emerald", onClick }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return <button type="button" onClick={onClick} className="sm-panel sm-panel-interactive dashboard-reference-kpi group min-h-[150px] rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
    <div className="flex items-start justify-between gap-3">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone] || tones.emerald}`}><Icon size={17} aria-hidden="true" /></span>
      <ChevronRight size={16} className="mt-1 text-slate-300 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </div>
    <p className="mt-4 text-[10px] font-bold uppercase tracking-[.11em] text-slate-500">{label}</p>
    <p className="mt-1 text-[21px] font-bold tracking-[-.045em] text-slate-950">{value}</p>
    <p className="mt-2 line-clamp-2 text-[10.5px] leading-4 text-slate-500">{detail}</p>
    <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">View details <ArrowRight size={11} /></span>
  </button>;
}

function QuickAction({ label, detail, icon: Icon, onClick }) {
  return <button type="button" onClick={onClick} className="dashboard-reference-action group flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-slate-100 bg-white px-2 py-3 text-center shadow-[0_2px_4px_rgba(15,23,42,.02)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-white"><Icon size={15} aria-hidden="true" /></span>
    <span className="mt-2 text-[10px] font-bold text-slate-800">{label}</span>
    <span className="mt-0.5 hidden text-[9px] text-slate-400 xl:block">{detail}</span>
  </button>;
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
  recentActivity,
  attentionItems,
  pendingLeave,
  formatMoney,
  onNavigate,
  onQuickAction,
  onCustomizeDashboard,
  allowedModules = [],
  writeAccess = "none",
}) {
  const invoiceRows = invoices?.rows || [];
  const expenseRows = expenses?.rows || [];
  const inventoryRows = inventory?.rows || [];
  const crmRows = crm?.rows || [];
  const isLoading = Boolean(invoices?.loading || expenses?.loading || inventory?.loading || crm?.loading);
  const hasError = [invoices, expenses, inventory, crm].some((source) => source?.error);
  const canWrite = writeAccess !== "none";
  const canOpen = (moduleId) => !allowedModules.length || allowedModules.includes(moduleId);
  const money = (amount) => formatMoney ? formatMoney(amount || 0) : `TZS ${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`;
  const lowStockCount = inventoryRows.filter((item) => Number(item?.reorder) > 0 && Number(item?.qty) <= Number(item.reorder)).length;
  const openDeals = crmRows.filter((lead) => !["Won", "Lost"].includes(lead?.stage));
  const pipelineTotal = openDeals.reduce((sum, lead) => sum + (Number(lead?.value) || 0), 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const [performanceRangeId, setPerformanceRangeId] = useState("30d");
  const performanceTrend = useMemo(() => buildPerformanceTrend(invoiceRows, expenseRows, performanceRangeId), [invoiceRows, expenseRows, performanceRangeId]);
  const hasCoreRows = invoiceRows.length + expenseRows.length + inventoryRows.length + crmRows.length > 0;
  const activeSubscriptions = (subscriptions?.rows || []).filter((row) => row?.status === "Active").length;
  const confirmedOutstanding = invoiceRows.map((row) => ({
    ...row,
    balance: Math.max(0, invoiceValue(row) - (Number(row?.amountPaid) || 0)),
  })).filter((row) => row.balance > 0 && String(row?.status || "").toLowerCase() !== "paid");
  const decisionCues = [
    confirmedOutstanding.length ? `${confirmedOutstanding.length} confirmed receivable${confirmedOutstanding.length === 1 ? " remains" : "s remain"} open for follow-up.` : null,
    lowStockCount ? `${lowStockCount} confirmed inventory item${lowStockCount === 1 ? " is" : "s are"} at or below its reorder level.` : null,
    openDeals.length ? `${openDeals.length} active CRM opportunity${openDeals.length === 1 ? " is" : "ies are"} available for review.` : null,
  ].filter(Boolean);

  const salesDocumentStatus = useMemo(() => {
    const grouped = invoiceRows.reduce((result, row) => {
      const label = row?.status || "Unclassified";
      result.set(label, (result.get(label) || 0) + 1);
      return result;
    }, new Map());
    return [...grouped.entries()].map(([name, value], index) => ({ name, value, color: STATUS_COLORS[index % STATUS_COLORS.length] }));
  }, [invoiceRows]);

  const topProducts = useMemo(() => inventoryRows
    .map((item) => ({
      id: item?.id || item?.sku || item?.name,
      name: item?.name || item?.sku || "Inventory item",
      quantity: Number(item?.qty) || 0,
      value: (Number(item?.qty) || 0) * (Number(item?.unitCost) || 0),
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 4), [inventoryRows]);

  const quickActions = [
    canWrite && canOpen("sales") ? { label: "New invoice", detail: "Open Sales", icon: ReceiptText, action: () => onQuickAction("sales", { tab: "invoices", openForm: true }) } : null,
    canWrite && canOpen("finance") ? { label: "Expense", detail: "Open Finance", icon: Wallet, action: () => onQuickAction("finance", { tab: "expenses" }) } : null,
    canWrite && canOpen("procurement") ? { label: "Purchase", detail: "Open Procurement", icon: ShoppingCart, action: () => onNavigate("procurement") } : null,
    canWrite && canOpen("crm") ? { label: "Customer", detail: "Open CRM", icon: Users, action: () => onQuickAction("crm", { tab: "leads" }) } : null,
    canOpen("inventory") ? { label: "Inventory", detail: "Review stock", icon: Package, action: () => onNavigate("inventory") } : null,
    canOpen("reports") ? { label: "Reports", detail: "Open Reports", icon: BarChart3, action: () => onNavigate("reports") } : null,
  ].filter(Boolean).slice(0, 6);

  const metrics = [
    { label: "Collected revenue", value: money(financials?.revenue), detail: invoiceRows.length ? `${invoiceRows.length} sales document${invoiceRows.length === 1 ? "" : "s"} in this workspace view` : "Awaiting confirmed invoice payments", icon: CircleDollarSign, tone: "emerald", action: () => onQuickAction("finance", { tab: "receivables" }) },
    { label: "Recorded expenses", value: money(financials?.expenseTotal), detail: expenseRows.length ? `${expenseRows.length} recorded expense${expenseRows.length === 1 ? "" : "s"} in this workspace view` : "No confirmed expense rows yet", icon: Wallet, tone: "rose", action: () => onQuickAction("finance", { tab: "expenses" }) },
    { label: "Net movement", value: money(financials?.profit), detail: financials?.profit === undefined ? "Awaiting finance records" : financials.profit >= 0 ? "Collected value less recorded expenses" : "Recorded expenses currently exceed collected value", icon: financials?.profit >= 0 ? TrendingUp : TrendingDown, tone: "emerald", action: () => onNavigate("finance") },
    { label: "Sales documents", value: String(invoiceRows.length), detail: invoiceRows.length ? "Derived from the current Sales workspace view" : "No confirmed sales documents yet", icon: ReceiptText, tone: "blue", action: () => onNavigate("sales") },
    { label: "Open receivables", value: money(financials?.pendingCash), detail: financials?.outstandingCount ? `${financials.outstandingCount} invoice${financials.outstandingCount === 1 ? "" : "s"} need follow-up` : "No confirmed open receivables", icon: AlertTriangle, tone: "amber", action: () => onQuickAction("finance", { tab: "receivables" }) },
  ];

  const businessChecks = [
    { label: "Finance information", detail: invoiceRows.length || expenseRows.length ? "Confirmed rows are available for review" : "Waiting for confirmed finance rows", ready: Boolean(invoiceRows.length || expenseRows.length) },
    { label: "Inventory watch", detail: inventoryRows.length ? lowStockCount ? `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} need attention` : "No confirmed reorder exceptions" : "Waiting for inventory rows", ready: inventoryRows.length > 0 && lowStockCount === 0 },
    { label: "Customer pipeline", detail: crmRows.length ? `${openDeals.length} active opportunity${openDeals.length === 1 ? "" : "ies"}` : "Waiting for CRM rows", ready: crmRows.length > 0 },
  ];

  return <div className="enterprise-overview dashboard-reference-layout mx-auto w-full max-w-[1760px] space-y-5 pb-10">
    <header className="dashboard-reference-welcome flex flex-col gap-4 border-b border-slate-200/80 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">Connected workspace view</p>
        <h1 className="mt-2 text-[27px] font-bold tracking-[-.05em] text-slate-950 sm:text-[32px]">{greeting}, {(currentUser?.name || company?.owner || "there").split(" ")[0]}.</h1>
        <p className="mt-1 text-[12px] text-slate-500">Here is the current view of confirmed business records and review signals for <strong className="font-semibold text-slate-700">{company?.name || "your workspace"}</strong>.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-[10.5px] font-semibold text-slate-500">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</span>
        {onCustomizeDashboard && <button type="button" onClick={onCustomizeDashboard} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Plus size={14} />Customize dashboard</button>}
      </div>
    </header>

    {hasError && <Panel className="border-rose-200 bg-rose-50"><div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-rose-700"><AlertTriangle size={17} /></span><div><p className="text-[12px] font-bold text-rose-950">Some live workspace information is unavailable</p><p className="mt-0.5 text-[11px] leading-5 text-rose-800">The dashboard leaves unavailable information empty rather than treating local fallback content as saved data.</p></div></div><button type="button" onClick={() => window.location.reload()} className="min-h-10 rounded-lg border border-rose-200 bg-white px-3 text-[11px] font-semibold text-rose-800 hover:bg-rose-100">Retry secure refresh</button></div></Panel>}

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5" aria-label="Key performance indicators">
      {isLoading ? Array.from({ length: 5 }, (_, index) => <Panel key={index} className="min-h-[150px] animate-pulse bg-slate-50" />) : metrics.map((metric) => <MetricCard key={metric.label} {...metric} onClick={metric.action} />)}
    </section>

    <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.85fr)_minmax(300px,.7fr)]">
      <Panel>
        <PanelHeader title="Revenue overview" detail="Confirmed collection and recorded expense movement" actionLabel="Open Finance" onAction={() => onNavigate("finance")}>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Performance period">{PERFORMANCE_RANGES.map((range) => <button key={range.id} type="button" onClick={() => setPerformanceRangeId(range.id)} aria-pressed={performanceRangeId === range.id} className={`min-h-7 rounded-md px-2 text-[9px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${performanceRangeId === range.id ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{range.label}</button>)}</div>
        </PanelHeader>
        {isLoading ? <div className="h-[290px] animate-pulse bg-slate-50" /> : performanceTrend.some((point) => point.revenue_tzs_k || point.expenses_tzs_k) ? <div className="h-[290px] px-2 pb-5 pt-4 sm:px-5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceTrend} margin={{ top: 8, right: 10, left: -28, bottom: 0 }}><defs><linearGradient id="referenceRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f8b6d" stopOpacity=".28" /><stop offset="100%" stopColor="#0f8b6d" stopOpacity="0" /></linearGradient><linearGradient id="referenceExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e05b50" stopOpacity=".12" /><stop offset="100%" stopColor="#e05b50" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1ef" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7a8983", fontSize: 10 }} dy={8} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#7a8983", fontSize: 10 }} tickFormatter={(value) => `${value}k`} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8e5", boxShadow: "0 12px 30px rgba(15,23,42,.12)", fontSize: 11 }} formatter={(value, name) => [`TZS ${Math.round(Number(value) || 0).toLocaleString()}k`, name === "revenue_tzs_k" ? "Collected" : "Expenses"]} /><Area type="monotone" dataKey="revenue_tzs_k" stroke="#0f8b6d" strokeWidth={2.5} fill="url(#referenceRevenue)" /><Area type="monotone" dataKey="expenses_tzs_k" stroke="#e05b50" strokeWidth={2} fill="url(#referenceExpenses)" /></AreaChart></ResponsiveContainer></div> : <EmptyPanel icon={BarChart3} title="No confirmed movement in this view" detail="This trend is calculated only from confirmed invoice payments and recorded expense rows within the selected period." actionLabel="Open Finance" onAction={() => onNavigate("finance")} />}
      </Panel>

      <Panel>
        <PanelHeader title="Sales document status" detail="Derived from the current Sales workspace" actionLabel="Open Sales" onAction={() => onNavigate("sales")} />
        {salesDocumentStatus.length ? <div className="p-4 sm:p-5"><div className="h-[194px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={salesDocumentStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={2} stroke="none">{salesDocumentStatus.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8e5", fontSize: 11 }} /></PieChart></ResponsiveContainer></div><div className="space-y-2.5 pt-1">{salesDocumentStatus.slice(0, 5).map((entry) => <div key={entry.name} className="flex items-center justify-between gap-3 text-[11px]"><span className="flex min-w-0 items-center gap-2 text-slate-600"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} /><span className="truncate">{entry.name}</span></span><span className="shrink-0 font-bold text-slate-800">{entry.value}</span></div>)}</div></div> : <EmptyPanel icon={ReceiptText} title="No sales documents yet" detail="Status distribution will appear when confirmed Sales workspace rows are available." actionLabel="Open Sales" onAction={() => onNavigate("sales")} />}
      </Panel>

      <div className="space-y-5">
        <Panel>
          <PanelHeader title="Quick actions" detail="Open an existing workspace action" />
          {quickActions.length ? <div className="grid grid-cols-3 gap-2 p-3">{quickActions.map((action) => <QuickAction key={action.label} {...action} onClick={action.action} />)}</div> : <EmptyPanel icon={Plus} title="No write actions are available" detail="Actions appear here only for modules available to the signed-in role." />}
        </Panel>
        <Panel>
          <WidgetHeader eyebrow="Workspace activity" title="Recent activity" icon={Activity} tone="violet" actionLabel="View all" onAction={() => onNavigate("reports")} />
          {recentActivity?.length ? <div className="divide-y divide-slate-100">{recentActivity.slice(0, 4).map((item, index) => { const Icon = item.icon || Activity; return <div key={`${item.text}-${index}`} className="flex items-center gap-3 px-4 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${item.color || "#0f8b6d"}15`, color: item.color || "#0f8b6d" }}><Icon size={14} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-800">{item.text}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{item.sub}</span></span><span className="shrink-0 text-[9px] text-slate-400">{item.date || ""}</span></div>; })}</div> : <EmptyPanel icon={Activity} title="No recorded activity yet" detail="This timeline is populated from confirmed workspace rows only." actionLabel="Open reports" onAction={() => onNavigate("reports")} />}
        </Panel>
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.1fr_.95fr_.95fr]">
      <Panel>
        <WidgetHeader eyebrow="Inventory" title="Top inventory value" icon={Package} tone="amber" actionLabel="Open inventory" onAction={() => onNavigate("inventory")} />
        {topProducts.length ? <div className="space-y-4 p-5">{topProducts.map((item, index) => <button type="button" key={item.id || index} onClick={() => onNavigate("inventory")} className="flex w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-800">{item.name}</span><span className="mt-0.5 block text-[10px] text-slate-400">{item.quantity} recorded unit{item.quantity === 1 ? "" : "s"}</span></span><span className="shrink-0 text-[10.5px] font-bold text-slate-700">{money(item.value)}</span></button>)}</div> : <EmptyPanel icon={Package} title="No confirmed inventory yet" detail="Inventory summaries appear only after item rows are available to the signed-in workspace." actionLabel="Open inventory" onAction={() => onNavigate("inventory")} />}<p className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400">Source: confirmed inventory rows</p>
      </Panel>

      <Panel>
        <WidgetHeader eyebrow="Cash movement" title="Current workspace view" icon={Wallet} tone="emerald" actionLabel="Open finance" onAction={() => onNavigate("finance")} />
        <div className="space-y-4 p-5"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-[11px] text-slate-500">Collected value</span><span className="text-[12px] font-bold text-emerald-700">{money(financials?.revenue)}</span></div><div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-[11px] text-slate-500">Recorded expenses</span><span className="text-[12px] font-bold text-rose-700">{money(financials?.expenseTotal)}</span></div><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-slate-700">Net movement</span><span className="text-[14px] font-bold text-slate-950">{money(financials?.profit)}</span></div><p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[10px] leading-4 text-slate-500">This panel is a current-view summary only. It is not a bank balance, forecast, settlement, or reconciliation result.</p></div><p className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400">Source: confirmed invoice rows</p>
      </Panel>

      <Panel>
        <WidgetHeader eyebrow="Business review" title="Confirmed readiness signals" icon={CheckCircle2} tone="blue" actionLabel="Open reports" onAction={() => onNavigate("reports")} />
        <div className="space-y-3 p-5">{businessChecks.map((check) => <div key={check.label} className="flex items-start gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${check.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{check.ready ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}</span><span><span className="block text-[11px] font-semibold text-slate-800">{check.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{check.detail}</span></span></div>)}<div className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">{activeSubscriptions ? `${activeSubscriptions} active subscription record${activeSubscriptions === 1 ? "" : "s"} in the current view.` : "Subscription status is available through the existing Sales/Billing workspace."}</div></div>
      </Panel>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]" aria-label="Confirmed decision cues and receivables">
      <Panel>
        <WidgetHeader eyebrow="Smart insights" title="Decision cues from confirmed data" icon={BarChart3} tone="emerald" actionLabel="Open reports" onAction={() => onNavigate("reports")} />
        {decisionCues.length ? <div className="space-y-2 p-5">{decisionCues.map((cue) => <div key={cue} className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-700" /><p className="text-[11px] leading-5 text-emerald-950">{cue}</p></div>)}</div> : <EmptyPanel icon={BarChart3} title="Insights will appear as records are confirmed" detail="This section summarizes recorded data only; it does not predict performance or invent business events." actionLabel="Open reports" onAction={() => onNavigate("reports")} />}
      </Panel>
      <Panel>
        <WidgetHeader eyebrow="Receivables" title="Outstanding debts" icon={ReceiptText} tone="blue" actionLabel="Open finance" onAction={() => onNavigate("finance")} />
        {confirmedOutstanding.length ? <div className="divide-y divide-slate-100">{confirmedOutstanding.slice(0, 4).map((row) => <button type="button" key={row.id || row.customer} onClick={() => onQuickAction("finance", { tab: "receivables" })} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><ReceiptText size={14} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-800">{row.customer || row.id || "Open invoice"}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{row.status || "Open"}{row.dueDate ? ` · due ${row.dueDate}` : ""}</span></span><span className="shrink-0 font-mono text-[10.5px] font-bold text-slate-700">{money(row.balance)}</span></button>)}</div> : <EmptyPanel icon={CheckCircle2} title="No open debts" detail="Outstanding invoices will appear here when confirmed invoice rows remain unpaid." actionLabel="Open finance" onAction={() => onNavigate("finance")} />}<p className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400">Source: confirmed invoice rows</p>
      </Panel>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Panel>
        <WidgetHeader eyebrow="Attention queue" title="What needs review" icon={AlertTriangle} tone="amber" actionLabel="Open reports" onAction={() => onNavigate("reports")} />
        {attentionItems?.length ? <div className="divide-y divide-slate-100">{attentionItems.slice(0, 5).map((item) => { const Icon = item.icon || AlertTriangle; return <button type="button" key={item.id} onClick={item.action} className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: item.surface, color: item.color }}><Icon size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-800">{item.title}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{item.detail}</span></span><ChevronRight size={14} className="mt-1 shrink-0 text-slate-300" /></button>; })}</div> : <EmptyPanel icon={CheckCircle2} title="No current attention signals" detail="The current confirmed workspace rows do not indicate an unresolved exception." actionLabel="Open activity" onAction={() => onNavigate("reports")} />}
      </Panel>
      <Panel>
        <WidgetHeader eyebrow="Team" title="Approvals and tasks" icon={CalendarClock} tone="blue" actionLabel="Open People" onAction={() => onQuickAction("hr", { tab: "leave" })} />
        {pendingLeave?.length ? <div className="divide-y divide-slate-100">{pendingLeave.slice(0, 4).map((leave) => <button type="button" key={leave.id} onClick={() => onQuickAction("hr", { tab: "leave" })} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><CalendarClock size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-800">{leave.employee}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{leave.type} · {leave.startDate} to {leave.endDate}</span></span><ChevronRight size={14} className="text-slate-300" /></button>)}</div> : <EmptyPanel icon={ClipboardCheck} title="No approval tasks are waiting" detail="Review tasks appear for authorized team members only after confirmed requests are available." actionLabel="Open People" onAction={() => onQuickAction("hr", { tab: "leave" })} />}
      </Panel>
    </section>

    {!hasCoreRows && !isLoading && <Panel className="border-dashed border-emerald-200 bg-emerald-50/35"><EmptyPanel icon={FileText} title="This workspace is ready for its first confirmed records" detail="The dashboard does not invent business metrics, activity, products, customers, or financial results. Add records through the existing Sales, Finance, CRM, and Inventory modules to populate this overview." actionLabel="Open Sales" onAction={() => onNavigate("sales")} /></Panel>}
  </div>;
}
