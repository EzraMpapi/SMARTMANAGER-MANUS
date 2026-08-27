import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Package,
  PackageCheck,
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
  Legend,
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

const SERIES_COLORS = ["#089669", "#2f80ed", "#f29d38", "#7762e7", "#df5f57"];
const STATUS_TONES = {
  paid: "bg-emerald-50 text-emerald-700",
  processed: "bg-sky-50 text-sky-700",
  pending: "bg-amber-50 text-amber-700",
  cancelled: "bg-rose-50 text-rose-700",
  default: "bg-slate-100 text-slate-600",
};

function invoiceValue(row) {
  const lineValue = (Array.isArray(row?.items) ? row.items : []).reduce(
    (sum, item) => sum + (Number(item?.qty) || 0) * (Number(item?.rate ?? item?.price) || 0),
    0,
  );
  return lineValue || Number(row?.total ?? row?.grandTotal ?? row?.amount) || 0;
}

function posValue(row) {
  return (Array.isArray(row?.items) ? row.items : []).reduce(
    (sum, item) => sum + (Number(item?.qty) || 0) * (Number(item?.rate ?? item?.price) || 0),
    0,
  );
}

function rowDate(row) {
  const source = row?.date || row?.expenseDate || row?.issueDate || row?.createdAt;
  const result = source ? new Date(source) : null;
  return result && !Number.isNaN(result.getTime()) ? result : null;
}

function buildPerformanceTrend(invoiceRows, expenseRows, rangeId) {
  const range = PERFORMANCE_RANGES.find((item) => item.id === rangeId) || PERFORMANCE_RANGES[1];
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - range.days + 1);
  const rows = new Map();
  const getBucket = (date) => {
    const key = range.bucket === "day" ? date.toISOString().slice(0, 10) : date.toISOString().slice(0, 7);
    const current = rows.get(key) || { key, revenue_tzs_k: 0, expenses_tzs_k: 0, sales_documents: 0 };
    rows.set(key, current);
    return current;
  };

  invoiceRows.forEach((row) => {
    const date = rowDate(row);
    if (!date || date < start || date > end) return;
    const bucket = getBucket(date);
    bucket.revenue_tzs_k += Math.max(0, (String(row?.status).toLowerCase() === "paid" ? invoiceValue(row) : Number(row?.amountPaid) || 0) / 1000);
    bucket.sales_documents += 1;
  });
  expenseRows.forEach((row) => {
    const date = rowDate(row);
    if (!date || date < start || date > end) return;
    getBucket(date).expenses_tzs_k += Math.max(0, (Number(row?.amount) || 0) / 1000);
  });

  return [...rows.values()]
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((row) => ({
      ...row,
      label: range.bucket === "day"
        ? new Date(`${row.key}T00:00:00`).toLocaleDateString("en", { day: "numeric", month: "short" })
        : new Date(`${row.key}-01T00:00:00`).toLocaleDateString("en", { month: "short" }),
    }));
}

function dateLabel(value) {
  const date = rowDate({ date: value });
  return date ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable";
}

function statusTone(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("paid") || normalized.includes("complete")) return STATUS_TONES.paid;
  if (normalized.includes("process")) return STATUS_TONES.processed;
  if (normalized.includes("pending") || normalized.includes("draft")) return STATUS_TONES.pending;
  if (normalized.includes("cancel")) return STATUS_TONES.cancelled;
  return STATUS_TONES.default;
}

function changeMeta(values = []) {
  const valid = values.map(Number).filter(Number.isFinite);
  if (valid.length < 2 || valid[valid.length - 2] === 0) return { direction: "neutral", label: "No comparison" };
  const change = ((valid[valid.length - 1] - valid[valid.length - 2]) / Math.abs(valid[valid.length - 2])) * 100;
  if (!Number.isFinite(change) || Math.abs(change) < 0.1) return { direction: "neutral", label: "No material change" };
  return { direction: change > 0 ? "up" : "down", label: `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs prior period` };
}

function Sparkline({ values, tone = "#089669" }) {
  const valid = values.map(Number).filter(Number.isFinite);
  if (valid.length < 2 || valid.every((value) => value === 0)) {
    return <span className="mt-4 block h-7 border-t border-dashed border-slate-200" aria-label="No comparable confirmed trend" />;
  }
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const span = max - min || 1;
  const points = valid.map((value, index) => `${(index / (valid.length - 1)) * 116 + 2},${27 - ((value - min) / span) * 20}`).join(" ");
  return <svg className="mt-3 h-7 w-full overflow-visible" viewBox="0 0 120 30" role="img" aria-label="Confirmed trend sparkline"><polyline fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} /><circle cx="118" cy={27 - ((valid[valid.length - 1] - min) / span) * 20} r="2.1" fill={tone} /></svg>;
}

function Panel({ children, className = "" }) {
  return <section className={`sm-panel dashboard-reference-panel overflow-hidden rounded-xl border border-slate-200/80 bg-white ${className}`}>{children}</section>;
}

function PanelHeader({ title, actionLabel, onAction, children }) {
  return <header className="flex min-h-[50px] items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3 sm:px-4">
    <h2 className="min-w-0 truncate text-[12px] font-bold tracking-[-.02em] text-slate-950">{title}</h2>
    <div className="flex shrink-0 items-center gap-2">
      {children}
      {actionLabel && <button type="button" onClick={onAction} className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 text-[9.5px] font-bold text-sky-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{actionLabel}<ArrowRight size={11} /></button>}
    </div>
  </header>;
}

function EmptyPanel({ icon: Icon = ClipboardCheck, title, detail, actionLabel, onAction, compact = false }) {
  return <div className={`flex flex-col items-center justify-center px-5 text-center ${compact ? "min-h-[166px] py-6" : "min-h-[252px] py-8"}`}>
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={18} /></span>
    <h3 className="mt-3 text-[12px] font-bold text-slate-900">{title}</h3>
    <p className="mt-1 max-w-sm text-[10.5px] leading-5 text-slate-500">{detail}</p>
    {actionLabel && <button type="button" onClick={onAction} className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-[10.5px] font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{actionLabel}<ArrowRight size={13} /></button>}
  </div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone, series, onClick }) {
  const trend = changeMeta(series);
  const trendClass = trend.direction === "up" ? "text-emerald-700" : trend.direction === "down" ? "text-rose-700" : "text-slate-400";
  return <button type="button" onClick={onClick} className="dashboard-reference-kpi group min-h-[164px] rounded-xl border border-slate-200/80 bg-white p-3.5 text-left shadow-[0_4px_12px_rgba(15,23,42,.035)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_12px_24px_rgba(15,23,42,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
    <div className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-bold uppercase tracking-[.07em] text-slate-500">{label}</p><p className="mt-1 text-[15px] font-extrabold tracking-[-.035em] text-slate-950">{value}</p></div><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ color: tone, backgroundColor: `${tone}14` }}><Icon size={17} aria-hidden="true" /></span></div>
    <p className="mt-2 flex min-h-4 items-center gap-1 text-[9px] font-semibold"><span className={trendClass}>{trend.direction === "up" ? <ArrowUpRight size={11} /> : trend.direction === "down" ? <ArrowDownRight size={11} /> : null}</span><span className={trendClass}>{trend.label}</span></p>
    <p className="mt-1 truncate text-[9px] leading-4 text-slate-500" title={detail}>{detail}</p>
    <Sparkline values={series} tone={tone} />
  </button>;
}

function DonutPanel({ title, detail, data, onAction, actionLabel, emptyTitle, emptyDetail, emptyAction, palette = SERIES_COLORS }) {
  return <Panel>
    <PanelHeader title={title} actionLabel={actionLabel} onAction={onAction} />
    {data.length ? <div className="p-3.5 sm:p-4"><div className="h-[148px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={62} paddingAngle={2} stroke="none">{data.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 10 }} formatter={(value) => [Number(value).toLocaleString(), "Confirmed value"]} /></PieChart></ResponsiveContainer></div><p className="mt-1 text-center text-[9px] text-slate-400">{detail}</p><div className="mt-3 space-y-2.5">{data.slice(0, 5).map((entry, index) => <div key={entry.name} className="flex items-center justify-between gap-2 text-[10px]"><span className="flex min-w-0 items-center gap-2 text-slate-600"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} /><span className="truncate">{entry.name}</span></span><span className="shrink-0 font-bold text-slate-800">{entry.display || entry.value}</span></div>)}</div></div> : <EmptyPanel compact icon={BarChart3} title={emptyTitle} detail={emptyDetail} actionLabel={emptyAction} onAction={onAction} />}
  </Panel>;
}

function TableAction({ children, onClick }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-8 items-center rounded-md font-semibold text-sky-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{children}</button>;
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
  posTransactions,
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
  const posRows = posTransactions?.rows || [];
  const isLoading = Boolean(invoices?.loading || expenses?.loading || inventory?.loading || crm?.loading || posTransactions?.loading);
  const hasError = [invoices, expenses, inventory, crm, posTransactions].some((source) => source?.error);
  const canWrite = writeAccess !== "none";
  const canOpen = (moduleId) => !allowedModules.length || allowedModules.includes(moduleId);
  const money = (amount) => formatMoney ? formatMoney(Number(amount) || 0) : `TZS ${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`;
  const openModule = (moduleId) => onNavigate?.(moduleId);
  const openAction = (moduleId, params) => onQuickAction?.(moduleId, params) || onNavigate?.(moduleId);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const [performanceRangeId, setPerformanceRangeId] = useState("30d");
  const performanceTrend = useMemo(() => buildPerformanceTrend(invoiceRows, expenseRows, performanceRangeId), [invoiceRows, expenseRows, performanceRangeId]);
  const hasCoreRows = invoiceRows.length + expenseRows.length + inventoryRows.length + crmRows.length + posRows.length > 0;
  const inventoryValue = inventoryRows.reduce((sum, item) => sum + (Number(item?.qty) || 0) * (Number(item?.unitCost) || 0), 0);
  const customerCount = new Set(invoiceRows.map((row) => row?.customer).filter(Boolean)).size;
  const lowStockRows = inventoryRows.filter((item) => Number(item?.reorder) > 0 && Number(item?.qty) <= Number(item?.reorder));
  const outOfStockRows = inventoryRows.filter((item) => Number(item?.qty) <= 0);
  const confirmedOutstanding = invoiceRows.map((row) => ({
    ...row,
    balance: Math.max(0, invoiceValue(row) - (Number(row?.amountPaid) || 0)),
  })).filter((row) => row.balance > 0 && String(row?.status || "").toLowerCase() !== "paid");

  const categoryLookup = useMemo(() => {
    const lookup = new Map();
    inventoryRows.forEach((item) => {
      const category = item?.category || "Uncategorized inventory";
      if (item?.sku) lookup.set(item.sku, category);
      if (item?.name) lookup.set(item.name, category);
    });
    return lookup;
  }, [inventoryRows]);

  const salesByCategory = useMemo(() => {
    const grouped = new Map();
    invoiceRows.forEach((invoice) => (Array.isArray(invoice?.items) ? invoice.items : []).forEach((item) => {
      const category = categoryLookup.get(item?.sku) || categoryLookup.get(item?.name) || "Uncategorized items";
      const value = (Number(item?.qty) || 0) * (Number(item?.rate ?? item?.price) || 0);
      grouped.set(category, (grouped.get(category) || 0) + Math.max(0, value));
    }));
    return [...grouped.entries()].map(([name, value]) => ({ name, value, display: money(value) })).filter((row) => row.value > 0).sort((left, right) => right.value - left.value).slice(0, 5);
  }, [invoiceRows, categoryLookup]);

  const salesByChannel = useMemo(() => {
    const invoiceSales = invoiceRows.reduce((sum, row) => sum + invoiceValue(row), 0);
    const posSales = posRows.reduce((sum, row) => sum + posValue(row), 0);
    return [
      invoiceSales > 0 ? { name: "Invoice sales", value: invoiceSales, display: money(invoiceSales) } : null,
      posSales > 0 ? { name: "POS sales", value: posSales, display: money(posSales) } : null,
    ].filter(Boolean);
  }, [invoiceRows, posRows]);

  const topProducts = useMemo(() => {
    const grouped = new Map();
    invoiceRows.forEach((invoice) => (Array.isArray(invoice?.items) ? invoice.items : []).forEach((item) => {
      const key = item?.sku || item?.name || "unnamed-item";
      const product = grouped.get(key) || { name: item?.name || "Unnamed item", sku: item?.sku || "—", units: 0, revenue: 0 };
      product.units += Number(item?.qty) || 0;
      product.revenue += (Number(item?.qty) || 0) * (Number(item?.rate ?? item?.price) || 0);
      grouped.set(key, product);
    }));
    return [...grouped.values()].sort((left, right) => right.revenue - left.revenue).slice(0, 5);
  }, [invoiceRows]);

  const salesDocumentStatus = useMemo(() => {
    const grouped = invoiceRows.reduce((result, row) => {
      const status = row?.status || "Unclassified";
      result.set(status, (result.get(status) || 0) + 1);
      return result;
    }, new Map());
    return [...grouped.entries()].map(([name, value]) => ({ name, value, display: `${value} document${value === 1 ? "" : "s"}` }));
  }, [invoiceRows]);

  const receivablesAging = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = [
      { label: "Current", tone: "border-emerald-100 bg-emerald-50/70 text-emerald-800", rows: [] },
      { label: "1–30 days", tone: "border-sky-100 bg-sky-50/70 text-sky-800", rows: [] },
      { label: "31–60 days", tone: "border-amber-100 bg-amber-50/70 text-amber-800", rows: [] },
      { label: "60+ days", tone: "border-rose-100 bg-rose-50/70 text-rose-800", rows: [] },
    ];
    confirmedOutstanding.forEach((invoice) => {
      const due = invoice?.dueDate ? new Date(invoice.dueDate) : null;
      const days = due && !Number.isNaN(due.getTime()) ? Math.floor((today.getTime() - due.getTime()) / 86_400_000) : -1;
      const index = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : 3;
      buckets[index].rows.push(invoice);
    });
    return buckets.map((bucket) => ({ ...bucket, value: bucket.rows.reduce((sum, row) => sum + row.balance, 0) }));
  }, [confirmedOutstanding]);

  const recentDocuments = useMemo(() => [...invoiceRows]
    .sort((left, right) => (rowDate(right)?.getTime() || 0) - (rowDate(left)?.getTime() || 0))
    .slice(0, 5), [invoiceRows]);

  const trendSeries = {
    revenue: performanceTrend.map((row) => row.revenue_tzs_k),
    expenses: performanceTrend.map((row) => row.expenses_tzs_k),
    movement: performanceTrend.map((row) => row.revenue_tzs_k - row.expenses_tzs_k),
    sales: performanceTrend.map((row) => row.sales_documents),
  };
  const decisionCues = [
    confirmedOutstanding.length ? `${confirmedOutstanding.length} confirmed receivable${confirmedOutstanding.length === 1 ? " needs" : "s need"} follow-up.` : null,
    lowStockRows.length ? `${lowStockRows.length} confirmed inventory item${lowStockRows.length === 1 ? " is" : "s are"} at or below its reorder level.` : null,
    crmRows.length ? `${crmRows.length} CRM record${crmRows.length === 1 ? " is" : "s are"} available for review.` : null,
  ].filter(Boolean);
  const readinessChecks = [
    { label: "Sales records", ready: invoiceRows.length > 0, detail: invoiceRows.length ? `${invoiceRows.length} confirmed sale document${invoiceRows.length === 1 ? "" : "s"}` : "No confirmed sales documents" },
    { label: "Finance records", ready: invoiceRows.length + expenseRows.length > 0, detail: invoiceRows.length + expenseRows.length ? "Revenue or expense information available" : "No confirmed finance information" },
    { label: "Inventory records", ready: inventoryRows.length > 0, detail: inventoryRows.length ? lowStockRows.length ? `${lowStockRows.length} reorder exception${lowStockRows.length === 1 ? "" : "s"}` : "No reorder exception in current rows" : "No confirmed inventory rows" },
    { label: "Customer pipeline", ready: crmRows.length > 0, detail: crmRows.length ? `${crmRows.length} available CRM record${crmRows.length === 1 ? "" : "s"}` : "No confirmed CRM rows" },
  ];
  const readinessScore = Math.round((readinessChecks.filter((check) => check.ready).length / readinessChecks.length) * 100);

  const quickActions = [
    canWrite && canOpen("sales") ? { label: "New sale", icon: ReceiptText, action: () => openAction("sales", { tab: "invoices", openForm: true }) } : null,
    canWrite && canOpen("crm") ? { label: "Add customer", icon: Users, action: () => openAction("crm", { tab: "leads" }) } : null,
    canOpen("inventory") ? { label: "Add product", icon: Package, action: () => openModule("inventory") } : null,
    canWrite && canOpen("sales") ? { label: "Create invoice", icon: FileText, action: () => openAction("sales", { tab: "invoices", openForm: true }) } : null,
    canWrite && canOpen("procurement") ? { label: "Purchase order", icon: ShoppingCart, action: () => openModule("procurement") } : null,
    canWrite && canOpen("finance") ? { label: "Record expense", icon: Wallet, action: () => openAction("finance", { tab: "expenses" }) } : null,
    canWrite && canOpen("hr") ? { label: "Add employee", icon: Users, action: () => openAction("hr", { tab: "employees" }) } : null,
    canOpen("reports") ? { label: "Generate report", icon: BarChart3, action: () => openModule("reports") } : null,
  ].filter(Boolean).slice(0, 8);

  const metrics = [
    { label: "Total revenue", value: money(financials?.revenue), detail: invoiceRows.length ? "Collected confirmed invoice value" : "Awaiting confirmed payments", icon: CircleDollarSign, tone: "#089669", series: trendSeries.revenue, action: () => openAction("finance", { tab: "receivables" }) },
    { label: "Net movement", value: money(financials?.profit), detail: financials?.profit === undefined ? "Awaiting finance records" : "Collected value less recorded expenses", icon: financials?.profit >= 0 ? TrendingUp : TrendingDown, tone: financials?.profit >= 0 ? "#089669" : "#df5f57", series: trendSeries.movement, action: () => openModule("finance") },
    { label: "Total sales", value: money(invoiceRows.reduce((sum, row) => sum + invoiceValue(row), 0)), detail: invoiceRows.length ? "Confirmed invoice document value" : "No confirmed sales documents", icon: ShoppingCart, tone: "#2f80ed", series: trendSeries.revenue, action: () => openModule("sales") },
    { label: "Orders", value: String(invoiceRows.length + posRows.length), detail: "Confirmed invoice and POS documents", icon: ReceiptText, tone: "#7762e7", series: trendSeries.sales, action: () => openModule("sales") },
    { label: "Customers", value: String(customerCount || crmRows.length), detail: customerCount ? "Unique invoiced customer records" : crmRows.length ? "Available CRM records" : "No customer records yet", icon: Users, tone: "#089669", series: [], action: () => openModule("crm") },
    { label: "Inventory value", value: money(inventoryValue), detail: inventoryRows.length ? "Current quantity × unit cost" : "No confirmed inventory rows", icon: PackageCheck, tone: "#f29d38", series: [], action: () => openModule("inventory") },
    { label: "Receivables", value: money(financials?.pendingCash), detail: financials?.outstandingCount ? `${financials.outstandingCount} invoice${financials.outstandingCount === 1 ? "" : "s"} pending` : "No confirmed open receivables", icon: Wallet, tone: "#df5f57", series: [], action: () => openAction("finance", { tab: "receivables" }) },
  ];

  return <div className="enterprise-overview dashboard-reference-layout dashboard-reference-erp mx-auto w-full max-w-[1800px] space-y-3.5 pb-10">
    <header className="dashboard-reference-welcome flex flex-col gap-3 border-b border-slate-200/90 pb-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-emerald-700">Connected workspace view</p><h1 className="mt-1.5 text-[24px] font-extrabold tracking-[-.045em] text-slate-950 sm:text-[27px]">{greeting}, {(currentUser?.name || company?.owner || "there").split(" ")[0]} <span aria-hidden="true">👋</span></h1><p className="mt-1 text-[11px] text-slate-500">Here’s what’s happening with your business today, based only on confirmed workspace records.</p></div>
      <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => openAction("sales", { tab: "invoices", openForm: true })} disabled={!canWrite || !canOpen("sales")} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-[10px] font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Plus size={13} />New sale</button><button type="button" onClick={() => openAction("crm", { tab: "leads" })} disabled={!canWrite || !canOpen("crm")} className="hidden min-h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Plus size={13} />Add customer</button><button type="button" onClick={() => openModule("inventory")} disabled={!canOpen("inventory")} className="hidden min-h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 lg:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Plus size={13} />Add product</button><button type="button" onClick={() => openModule("reports")} disabled={!canOpen("reports")} className="hidden min-h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 xl:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">More actions<ChevronDown size={13} /></button>{onCustomizeDashboard && <button type="button" onClick={onCustomizeDashboard} className="inline-flex min-h-9 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Customize</button>}</div>
    </header>

    {hasError && <Panel className="border-rose-200 bg-rose-50"><div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-rose-700"><AlertTriangle size={17} /></span><div><p className="text-[12px] font-bold text-rose-950">Some live workspace information is unavailable</p><p className="mt-0.5 text-[10.5px] leading-5 text-rose-800">Unavailable information remains empty. The dashboard does not invent business metrics or local fallback records.</p></div></div><button type="button" onClick={() => window.location.reload()} className="min-h-9 rounded-md border border-rose-200 bg-white px-3 text-[10px] font-bold text-rose-800 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600">Retry secure refresh</button></div></Panel>}

    <section className="grid grid-cols-1 gap-3 min-[470px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7" aria-label="Key performance indicators">
      {isLoading ? Array.from({ length: 7 }, (_, index) => <Panel key={index} className="min-h-[164px] animate-pulse bg-slate-50" />) : metrics.map((metric) => <MetricCard key={metric.label} {...metric} onClick={metric.action} />)}
    </section>

    <section className="grid gap-3.5 2xl:grid-cols-[minmax(0,1.65fr)_minmax(215px,.68fr)_minmax(215px,.68fr)_minmax(230px,.75fr)]">
      <Panel className="2xl:col-span-1"><PanelHeader title="Revenue & Sales Performance" actionLabel="Open finance" onAction={() => openModule("finance")}><div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Performance period">{PERFORMANCE_RANGES.map((range) => <button key={range.id} type="button" onClick={() => setPerformanceRangeId(range.id)} aria-pressed={performanceRangeId === range.id} className={`min-h-7 rounded px-1.5 text-[8.5px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${performanceRangeId === range.id ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{range.label}</button>)}</div></PanelHeader>{isLoading ? <div className="h-[286px] animate-pulse bg-slate-50" /> : performanceTrend.some((point) => point.revenue_tzs_k || point.expenses_tzs_k) ? <div className="h-[286px] px-2 pb-3 pt-3 sm:px-4"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceTrend} margin={{ top: 8, right: 12, left: -28, bottom: 0 }}><defs><linearGradient id="erpRevenueArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#089669" stopOpacity=".22" /><stop offset="100%" stopColor="#089669" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eef2f1" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7a8983", fontSize: 9 }} dy={8} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#7a8983", fontSize: 9 }} tickFormatter={(value) => `${value}k`} /><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8e5", boxShadow: "0 10px 24px rgba(15,23,42,.10)", fontSize: 10 }} formatter={(value, name) => [`TZS ${Math.round(Number(value) || 0).toLocaleString()}k`, name === "revenue_tzs_k" ? "Collected revenue" : "Recorded expenses"]} /><Legend iconType="plainline" iconSize={12} wrapperStyle={{ fontSize: 9, paddingTop: 10 }} formatter={(value) => value === "revenue_tzs_k" ? "Collected revenue" : "Recorded expenses"} /><Area type="monotone" dataKey="revenue_tzs_k" stroke="#089669" strokeWidth={2.2} fill="url(#erpRevenueArea)" /><Area type="monotone" dataKey="expenses_tzs_k" stroke="#df5f57" strokeWidth={1.8} fill="transparent" /></AreaChart></ResponsiveContainer></div> : <EmptyPanel icon={BarChart3} title="No confirmed financial movement in this period" detail="The chart uses only confirmed invoice collections and recorded expense rows within the selected period." actionLabel="Open finance" onAction={() => openModule("finance")} />}<p className="border-t border-slate-100 px-4 py-2 text-[8.5px] text-slate-400">Source: confirmed invoice rows and recorded expense rows</p></Panel>
      <DonutPanel title="Sales by category" detail="Confirmed invoice-item value" data={salesByCategory} onAction={() => openModule("sales")} actionLabel="View all" emptyTitle="No categorised sales yet" emptyDetail="This panel requires confirmed invoice line items matched to existing inventory categories." emptyAction="Open sales" />
      <DonutPanel title="Sales by channel" detail="Confirmed document value" data={salesByChannel} onAction={() => openModule("sales")} actionLabel="View all" emptyTitle="No sales channels yet" emptyDetail="Invoice and POS channel totals appear when confirmed sales documents contain item rows." emptyAction="Open sales" palette={["#089669", "#2f80ed", "#f29d38"]} />
      <Panel><PanelHeader title="Business health" actionLabel="View details" onAction={() => openModule("reports")} /><div className="flex min-h-[270px] flex-col items-center px-4 py-4"><div className="grid h-[126px] w-[126px] place-items-center rounded-full" style={{ background: `conic-gradient(#089669 ${readinessScore}%, #e7eeeb 0)` }}><div className="grid h-[101px] w-[101px] place-items-center rounded-full bg-white text-center"><p className="text-[23px] font-extrabold tracking-[-.05em] text-slate-950">{readinessScore}%</p><p className="-mt-1 text-[10px] font-bold text-emerald-700">Coverage</p></div></div><p className="mt-3 text-center text-[10px] font-semibold text-slate-600">Confirmed data readiness</p><div className="mt-3 w-full space-y-2">{readinessChecks.map((check) => <div key={check.label} className="flex items-center justify-between gap-2 text-[9.5px]"><span className="flex min-w-0 items-center gap-1.5"><span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${check.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{check.ready ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}</span><span className="truncate text-slate-600">{check.label}</span></span><span className={`shrink-0 font-bold ${check.ready ? "text-emerald-700" : "text-amber-700"}`}>{check.ready ? "Available" : "Waiting"}</span></div>)}</div></div></Panel>
    </section>

    <section className="grid gap-3.5 xl:grid-cols-[1.06fr_1fr_1.18fr]">
      <Panel><PanelHeader title="Top products" actionLabel="View all" onAction={() => openModule("inventory")} />{topProducts.length ? <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left"><thead className="border-b border-slate-100 bg-slate-50/70 text-[8.5px] font-bold uppercase tracking-[.06em] text-slate-500"><tr><th className="px-3.5 py-2">Product</th><th className="px-2 py-2">SKU</th><th className="px-2 py-2 text-right">Units sold</th><th className="px-3.5 py-2 text-right">Revenue</th></tr></thead><tbody>{topProducts.map((product) => <tr key={`${product.sku}-${product.name}`} className="border-b border-slate-100 last:border-0"><td className="px-3.5 py-2.5"><TableAction onClick={() => openModule("inventory")}><span className="flex max-w-[145px] items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700"><Package size={12} /></span><span className="truncate text-[10px] text-slate-800">{product.name}</span></span></TableAction></td><td className="px-2 py-2.5 font-mono text-[9px] text-slate-500">{product.sku}</td><td className="px-2 py-2.5 text-right text-[9.5px] text-slate-700">{product.units.toLocaleString()}</td><td className="px-3.5 py-2.5 text-right text-[9.5px] font-bold text-slate-800">{money(product.revenue)}</td></tr>)}</tbody></table></div> : <EmptyPanel compact icon={Package} title="No confirmed product sales yet" detail="Product ranking needs invoice line items with quantities and rates." actionLabel="Open inventory" onAction={() => openModule("inventory")} />}</Panel>
      <Panel><PanelHeader title="Recent orders" actionLabel="View all" onAction={() => openModule("sales")} />{recentDocuments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[410px] text-left"><thead className="border-b border-slate-100 bg-slate-50/70 text-[8.5px] font-bold uppercase tracking-[.06em] text-slate-500"><tr><th className="px-3.5 py-2">Order ID</th><th className="px-2 py-2">Customer</th><th className="px-2 py-2">Date</th><th className="px-3.5 py-2 text-right">Status</th></tr></thead><tbody>{recentDocuments.map((row) => <tr key={row.id} className="border-b border-slate-100 last:border-0"><td className="px-3.5 py-2.5"><TableAction onClick={() => openModule("sales")}><span className="text-[9.5px]">{row.id || "Document"}</span></TableAction></td><td className="max-w-[115px] truncate px-2 py-2.5 text-[9.5px] text-slate-700">{row.customer || "Customer unavailable"}</td><td className="whitespace-nowrap px-2 py-2.5 text-[9px] text-slate-500">{dateLabel(row.date)}</td><td className="px-3.5 py-2.5 text-right"><span className={`inline-flex rounded px-2 py-1 text-[8.5px] font-bold ${statusTone(row.status)}`}>{row.status || "Unclassified"}</span></td></tr>)}</tbody></table></div> : <EmptyPanel compact icon={ReceiptText} title="No confirmed orders yet" detail="Recent sales documents appear when this workspace exposes invoice records." actionLabel="Open sales" onAction={() => openModule("sales")} />}</Panel>
      <Panel><PanelHeader title="Inventory health" actionLabel="View all" onAction={() => openModule("inventory")} />{inventoryRows.length ? <><div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4"><div className="rounded-md border border-emerald-100 bg-emerald-50/60 px-2.5 py-2"><p className="text-[8px] font-bold uppercase text-emerald-700">Products</p><p className="mt-0.5 text-[15px] font-extrabold text-emerald-950">{inventoryRows.length}</p></div><div className="rounded-md border border-emerald-100 bg-emerald-50/60 px-2.5 py-2"><p className="text-[8px] font-bold uppercase text-emerald-700">In stock</p><p className="mt-0.5 text-[15px] font-extrabold text-emerald-950">{inventoryRows.filter((item) => Number(item?.qty) > Number(item?.reorder || 0)).length}</p></div><div className="rounded-md border border-amber-100 bg-amber-50/70 px-2.5 py-2"><p className="text-[8px] font-bold uppercase text-amber-700">Low stock</p><p className="mt-0.5 text-[15px] font-extrabold text-amber-800">{lowStockRows.length}</p></div><div className="rounded-md border border-rose-100 bg-rose-50/70 px-2.5 py-2"><p className="text-[8px] font-bold uppercase text-rose-700">Out of stock</p><p className="mt-0.5 text-[15px] font-extrabold text-rose-800">{outOfStockRows.length}</p></div></div><div className="overflow-x-auto border-t border-slate-100"><table className="w-full min-w-[430px] text-left"><thead className="text-[8px] font-bold uppercase tracking-[.06em] text-slate-500"><tr><th className="px-3.5 py-2">Low stock items</th><th className="px-2 py-2 text-right">Current</th><th className="px-2 py-2 text-right">Reorder</th><th className="px-3.5 py-2 text-right">Action</th></tr></thead><tbody>{lowStockRows.slice(0, 5).map((item) => <tr key={item.id || item.sku || item.name} className="border-t border-slate-100"><td className="max-w-[185px] truncate px-3.5 py-2 text-[9.5px] font-semibold text-slate-700">{item.name || item.sku || "Inventory item"}</td><td className="px-2 py-2 text-right text-[9px] text-slate-600">{Number(item.qty) || 0}</td><td className="px-2 py-2 text-right text-[9px] text-slate-600">{Number(item.reorder) || 0}</td><td className="px-3.5 py-1 text-right"><TableAction onClick={() => openModule("inventory")}><Package size={12} aria-label="Review stock" /></TableAction></td></tr>)}{!lowStockRows.length && <tr><td colSpan="4" className="px-3.5 py-4 text-center text-[9.5px] text-emerald-700">No confirmed reorder exceptions in the current inventory rows.</td></tr>}</tbody></table></div></> : <EmptyPanel compact icon={Package} title="No confirmed inventory yet" detail="Stock health is shown only after inventory item rows are available." actionLabel="Open inventory" onAction={() => openModule("inventory")} />}<p className="border-t border-slate-100 px-4 py-2 text-[8.5px] text-slate-400">Source: confirmed inventory rows</p></Panel>
    </section>

    <section className="grid gap-3.5 md:grid-cols-2 2xl:grid-cols-4">
      <Panel><PanelHeader title="Receivables aging" actionLabel="Open finance" onAction={() => openAction("finance", { tab: "receivables" })} />{confirmedOutstanding.length ? <div className="p-3"><p className="text-[9.5px] text-slate-500">Total outstanding: <strong className="font-bold text-slate-800">{money(confirmedOutstanding.reduce((sum, row) => sum + row.balance, 0))}</strong></p><div className="mt-3 grid grid-cols-2 gap-2">{receivablesAging.map((bucket) => <button type="button" key={bucket.label} onClick={() => openAction("finance", { tab: "receivables" })} className={`min-h-[78px] rounded-lg border px-2.5 py-2 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${bucket.tone}`}><p className="text-[8.5px] font-bold">{bucket.label}</p><p className="mt-2 text-[10px] font-extrabold">{money(bucket.value)}</p><p className="mt-1 text-[8.5px] opacity-75">{bucket.rows.length} invoice{bucket.rows.length === 1 ? "" : "s"}</p></button>)}</div></div> : <EmptyPanel compact icon={CheckCircle2} title="No open receivables" detail="Outstanding invoices will appear only when confirmed records remain unpaid." actionLabel="Open finance" onAction={() => openModule("finance")} />}</Panel>
      <Panel><PanelHeader title="Recent activity" actionLabel="View all" onAction={() => openModule("reports")} />{recentActivity?.length ? <div className="divide-y divide-slate-100">{recentActivity.slice(0, 5).map((item, index) => { const Icon = item.icon || Activity; return <div key={`${item.text}-${index}`} className="flex items-center gap-2.5 px-3.5 py-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md" style={{ backgroundColor: `${item.color || "#089669"}15`, color: item.color || "#089669" }}><Icon size={13} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[9.5px] font-semibold text-slate-800">{item.text}</span><span className="mt-0.5 block truncate text-[8.5px] text-slate-500">{item.sub}</span></span><span className="shrink-0 text-[8.5px] text-slate-400">{item.date || ""}</span></div>; })}</div> : <EmptyPanel compact icon={Activity} title="No recorded activity yet" detail="This feed is populated from confirmed workspace rows only." actionLabel="Open reports" onAction={() => openModule("reports")} />}</Panel>
      <Panel><PanelHeader title="Alerts" actionLabel="Review all" onAction={() => openModule("reports")} />{attentionItems?.length || decisionCues.length ? <div className="divide-y divide-slate-100">{(attentionItems?.length ? attentionItems : decisionCues.map((title, index) => ({ id: `cue-${index}`, icon: AlertTriangle, color: "#D97706", surface: "#FFFBEB", title, detail: "Confirmed workspace signal", action: () => openModule("reports") }))).slice(0, 5).map((item) => { const Icon = item.icon || AlertTriangle; return <button type="button" key={item.id || item.title} onClick={item.action} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md" style={{ background: item.surface || "#FFFBEB", color: item.color || "#D97706" }}><Icon size={13} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[9.5px] font-semibold text-slate-800">{item.title}</span><span className="mt-0.5 block truncate text-[8.5px] text-slate-500">{item.detail}</span></span><span className="rounded border border-slate-200 px-1.5 py-0.5 text-[8px] font-bold text-sky-700">View</span></button>; })}</div> : <EmptyPanel compact icon={CheckCircle2} title="No current alerts" detail="No confirmed exception is exposed in the current workspace rows." actionLabel="Open reports" onAction={() => openModule("reports")} />}</Panel>
      <Panel><PanelHeader title="Quick actions" />{quickActions.length ? <div className="grid grid-cols-2 gap-2 p-3">{quickActions.map((action) => { const Icon = action.icon; return <button type="button" key={action.label} onClick={action.action} className="group flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Icon size={13} className="shrink-0 text-slate-500 transition group-hover:text-emerald-700" /><span className="truncate text-[9px] font-bold text-slate-700">{action.label}</span></button>; })}</div> : <EmptyPanel compact icon={Plus} title="No write actions available" detail="Quick actions follow your signed-in role and module access." />}</Panel>
    </section>

    {!hasCoreRows && !isLoading && <Panel className="border-dashed border-emerald-200 bg-emerald-50/35"><EmptyPanel icon={FileText} title="This workspace is ready for its first confirmed records" detail="The dashboard does not invent business metrics, products, customers, activity, or financial results. Add records through the existing Sales, Finance, CRM, and Inventory modules to populate this overview." actionLabel="Open Sales" onAction={() => openModule("sales")} /></Panel>}
  </div>;
}
