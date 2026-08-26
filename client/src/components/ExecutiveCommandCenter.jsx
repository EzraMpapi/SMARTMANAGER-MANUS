import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { asRows, buildActionItem, buildDashboardMetric, sourceNoteFor, trendFromPeriods } from "../dashboardContracts";
import { useDashboardPreferences } from "../contexts/DashboardPreferencesContext";

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const PERFORMANCE_WINDOWS = [
  { id: "30d", label: "This month", shortLabel: "30D", days: 30 },
  { id: "3m", label: "Last 3 months", shortLabel: "3M", days: 92 },
  { id: "6m", label: "Last 6 months", shortLabel: "6M", days: 183 },
  { id: "1y", label: "This year", shortLabel: "1Y", days: 365 },
];

const MIX_COLORS = ["#0E9F6E", "#3B82F6", "#F59E0B", "#8B5CF6", "#64748B"];

function rowDate(row) {
  const value = row?.date || row?.issueDate || row?.expenseDate || row?.created_at || row?.createdAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function isInPerformanceWindow(row, start, end) {
  const date = rowDate(row);
  return Boolean(date) && date >= start && date <= end;
}

function money(value, currency = "TZS") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Insufficient confirmed data";
  return `${currency} ${numberFormat.format(Math.round(Number(value)))}`;
}

function invoiceTotal(invoice) {
  const direct = [invoice?.total, invoice?.grandTotal, invoice?.amount].map(Number).find((value) => Number.isFinite(value) && value > 0);
  if (direct !== undefined) return direct;
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  return items.reduce((sum, item) => {
    const qty = Number(item?.qty) || 0;
    const rate = Number(item?.rate ?? item?.price) || 0;
    const discount = Math.min(100, Math.max(0, Number(item?.discount) || 0));
    return sum + qty * rate * (1 - discount / 100) * 1.18;
  }, 0);
}

function dateKey(value) {
  const date = String(value || "");
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : "";
}

function periodLabel(key) {
  if (!key) return "Unknown";
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

function sumByMonth(rows, valueForRow, dateForRow) {
  const totals = new Map();
  asRows(rows).forEach((row) => {
    const key = dateKey(dateForRow(row));
    const value = Number(valueForRow(row)) || 0;
    if (!key || !Number.isFinite(value)) return;
    totals.set(key, (totals.get(key) || 0) + value);
  });
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => ({ key, period: periodLabel(key), value }));
}

function statusMeta(status) {
  if (status === "healthy") return { label: "Healthy", color: "#15803D", bg: "#F0FDF4", icon: CheckCircle2 };
  if (status === "attention") return { label: "Needs attention", color: "#B45309", bg: "#FFFBEB", icon: AlertTriangle };
  if (status === "risk") return { label: "At risk", color: "#B91C1C", bg: "#FEF2F2", icon: ShieldAlert };
  return { label: "Insufficient data", color: "#64748B", bg: "#F8FAFC", icon: Activity };
}

function Panel({ children, className = "", style }) {
  return <section style={style} className={`overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,.035)] ${className}`}>{children}</section>;
}

function Skeleton({ className = "" }) {
  return <span className={`block animate-pulse rounded-lg bg-slate-100 ${className}`} aria-hidden="true" />;
}

function EmptyState({ icon: Icon = Activity, title, detail, actionLabel, onAction, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center px-5 text-center ${compact ? "min-h-[178px] py-5" : "min-h-[250px] py-8"}`}>
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700"><Icon size={18} /></span>
      <h3 className="mt-3 text-[12px] font-bold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-[10.5px] leading-5 text-slate-500">{detail}</p>
      {actionLabel && <button type="button" onClick={onAction} className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-700 px-3 text-[10.5px] font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{actionLabel}<ChevronRight size={13} /></button>}
    </div>
  );
}

function MiniTrend({ values, tone = "#0E9F6E" }) {
  const valid = values.map(Number).filter(Number.isFinite);
  if (valid.length < 2 || valid.every((value) => value === 0)) return <span className="mt-3 block border-t border-dashed border-slate-200" aria-label="Awaiting comparable records" />;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const span = max - min || 1;
  const points = valid.map((value, index) => `${(index / (valid.length - 1)) * 116 + 2},${27 - ((value - min) / span) * 20}`).join(" ");
  return <svg className="mt-3 h-7 w-full" viewBox="0 0 120 30" role="img" aria-label="Confirmed trend sparkline"><polyline fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} /><circle cx="118" cy={27 - ((valid[valid.length - 1] - min) / span) * 20} r="2.25" fill={tone} /></svg>;
}

function MetricCard({ metric, onNavigate, series, tone }) {
  const Icon = metric.icon || CircleDollarSign;
  const trend = metric.trend;
  const value = metric.value === null || metric.value === undefined ? "—" : metric.value;
  const statusColor = metric.status === "confirmed" ? "#15803D" : metric.status === "warning" ? "#B45309" : "#64748B";
  return (
    <button type="button" onClick={() => metric.onAction?.() || (metric.module && onNavigate(metric.module))} className="group min-h-[166px] rounded-[18px] border border-slate-200/80 bg-white p-4 text-left shadow-[0_2px_7px_rgba(15,23,42,.03)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_28px_rgba(15,23,42,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2" aria-label={`${metric.label}. ${metric.statusLabel}. ${metric.actionLabel}`}>
      <div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: tone, backgroundColor: `${tone}13` }}><Icon size={17} /></span><span className="text-[9px] font-bold" style={{ color: statusColor }}>{metric.statusLabel}</span></div>
      <p className="mt-4 truncate text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{metric.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2"><p className="truncate text-[20px] font-black tracking-[-.045em] text-slate-950">{value}</p>{trend?.direction !== "neutral" && <span className={`mb-0.5 inline-flex shrink-0 items-center gap-0.5 text-[9.5px] font-bold ${trend.direction === "up" ? "text-emerald-700" : "text-rose-700"}`}>{trend.direction === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{trend.label}</span>}</div>
      <p className="mt-1 truncate text-[9.5px] text-slate-400" title={metric.context || metric.source}>{metric.context || metric.source}</p>
      <MiniTrend values={series} tone={tone} />
      <p className="mt-1 truncate text-[8.5px] font-medium text-slate-400" title={metric.source}>Source: {metric.source}</p>
    </button>
  );
}

function HealthRow({ label, status, explanation }) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return <div className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ color: meta.color, background: meta.bg }}><Icon size={14} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11.5px] font-bold text-slate-800">{label}</p><span className="text-[9.5px] font-bold" style={{ color: meta.color }}>{meta.label}</span></div><p className="mt-1 text-[10px] leading-4 text-slate-500">{explanation}</p></div></div>;
}

function WidgetHeading({ eyebrow, title, icon: Icon, actionLabel, onAction }) {
  return <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5"><div><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon size={14} /></span><p className="text-[10px] font-bold uppercase tracking-[.12em] text-emerald-700">{eyebrow}</p></div><h2 className="mt-2 text-[14px] font-black tracking-[-.02em] text-slate-900">{title}</h2></div>{actionLabel && <button type="button" onClick={onAction} className="inline-flex min-h-8 shrink-0 items-center gap-1 text-[10px] font-bold text-emerald-700 transition hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{actionLabel}<ChevronRight size={12} /></button>}</header>;
}

export function ExecutiveCommandCenter({
  invoices,
  expenses,
  inventory,
  crm,
  employees,
  leaveRequests,
  posTransactions,
  workOrders,
  recentActivity = [],
  onNavigate,
  onQuickAction,
  onCustomizeDashboard,
  currentUser,
  company,
  currency = "TZS",
  allowedModules = [],
  writeAccess = "none",
}) {
  const { preferences, updatePreference } = useDashboardPreferences();
  const performanceWindowId = preferences.performanceWindow;
  const performanceWindow = PERFORMANCE_WINDOWS.find((window) => window.id === performanceWindowId) || PERFORMANCE_WINDOWS[0];
  const performanceBounds = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - performanceWindow.days + 1);
    return { start, end };
  }, [performanceWindow.days]);
  const isLoading = [invoices, expenses, inventory, crm].some((source) => source?.loading);
  const hasSourceError = [invoices, expenses, inventory, crm, employees, leaveRequests, posTransactions, workOrders].some((source) => source?.error);
  const canWrite = writeAccess !== "none";
  const canOpen = (moduleId) => !allowedModules.length || allowedModules.includes(moduleId);
  const retrySources = () => [invoices, expenses, inventory, crm, employees, leaveRequests, posTransactions, workOrders].forEach((source) => source?.reload?.());

  const data = useMemo(() => {
    const invoiceRows = asRows(invoices).filter((row) => isInPerformanceWindow(row, performanceBounds.start, performanceBounds.end));
    const expenseRows = asRows(expenses).filter((row) => isInPerformanceWindow(row, performanceBounds.start, performanceBounds.end));
    const inventoryRows = asRows(inventory);
    const leadRows = asRows(crm);
    const employeeRows = asRows(employees);
    const leaveRows = asRows(leaveRequests);
    const posRows = asRows(posTransactions).filter((row) => isInPerformanceWindow(row, performanceBounds.start, performanceBounds.end));
    const workOrderRows = asRows(workOrders);
    const billed = invoiceRows.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const collected = invoiceRows.reduce((sum, invoice) => sum + (invoice.status === "Paid" ? invoiceTotal(invoice) : (Number(invoice.amountPaid) || 0)), 0);
    const operatingExpenses = expenseRows.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const netResult = collected - operatingExpenses;
    const receivables = invoiceRows.filter((invoice) => invoice.status !== "Paid").reduce((sum, invoice) => sum + Math.max(0, invoiceTotal(invoice) - (Number(invoice.amountPaid) || 0)), 0);
    const lowStockRows = inventoryRows.filter((item) => Number(item.reorder) > 0 && Number(item.qty) <= Number(item.reorder));
    const pendingLeaveRows = leaveRows.filter((leave) => ["Pending", "Submitted", "Awaiting Approval"].includes(leave.status));
    const overdueRows = invoiceRows.filter((invoice) => invoice.status !== "Paid" && invoice.dueDate && invoice.dueDate < performanceBounds.end.toISOString().slice(0, 10));
    const orderCount = invoiceRows.length + posRows.length;
    const openWorkOrders = workOrderRows.filter((order) => !["Completed", "Cancelled"].includes(order.status));
    const salesByMonth = sumByMonth(invoiceRows, (invoice) => invoice.status === "Paid" ? invoiceTotal(invoice) : Number(invoice.amountPaid) || 0, (invoice) => invoice.date);
    const expenseByMonth = sumByMonth(expenseRows, (expense) => expense.amount, (expense) => expense.date || expense.expenseDate);
    const allKeys = [...new Set([...salesByMonth.map((row) => row.key), ...expenseByMonth.map((row) => row.key)])].sort().slice(-6);
    const chartData = allKeys.map((key) => {
      const revenue = salesByMonth.find((row) => row.key === key)?.value || 0;
      const expense = expenseByMonth.find((row) => row.key === key)?.value || 0;
      return { key, period: periodLabel(key), revenue, expenses: expense, result: revenue - expense };
    });
    const productMap = new Map();
    invoiceRows.forEach((invoice) => (Array.isArray(invoice.items) ? invoice.items : []).forEach((item) => {
      const name = item?.name || item?.sku || "Uncategorised item";
      const current = productMap.get(name) || { name, units: 0, revenue: 0 };
      current.units += Number(item?.qty) || 0;
      current.revenue += (Number(item?.qty) || 0) * (Number(item?.rate ?? item?.price) || 0);
      productMap.set(name, current);
    }));
    const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const productRevenue = topProducts.reduce((sum, item) => sum + item.revenue, 0);
    const mixMap = new Map();
    invoiceRows.forEach((invoice) => {
      const label = invoice.status === "Paid" ? "Collected" : invoice.status || "Open";
      const value = invoice.status === "Paid" ? invoiceTotal(invoice) : Number(invoice.amountPaid) || 0;
      mixMap.set(label, (mixMap.get(label) || 0) + Math.max(0, value));
    });
    const salesMix = [...mixMap.entries()].map(([name, value]) => ({ name, value })).filter((row) => row.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
    const currentSales = salesByMonth.length > 0 ? salesByMonth[salesByMonth.length - 1].value : null;
    const priorSales = salesByMonth.length > 1 ? salesByMonth[salesByMonth.length - 2].value : null;
    const currentResult = chartData.length > 0 ? chartData[chartData.length - 1].result : null;
    const priorResult = chartData.length > 1 ? chartData[chartData.length - 2].result : null;
    return { invoiceRows, expenseRows, inventoryRows, leadRows, employeeRows, leaveRows, billed, collected, operatingExpenses, netResult, receivables, lowStockRows, pendingLeaveRows, overdueRows, orderCount, openWorkOrders, salesByMonth, expenseByMonth, chartData, topProducts, productRevenue, salesMix, salesTrend: trendFromPeriods(currentSales, priorSales), resultTrend: trendFromPeriods(currentResult, priorResult) };
  }, [invoices, expenses, inventory, crm, employees, leaveRequests, posTransactions, workOrders, performanceBounds]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = String(currentUser?.name || "there").trim().split(/\s+/)[0] || "there";
  const localDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Dar_es_Salaam" }).format(new Date());

  const metrics = [
    buildDashboardMetric({ id: "revenue", label: "Total revenue", value: data.invoiceRows.length ? money(data.billed, currency) : null, source: "sales_invoices", context: data.invoiceRows.length ? `${data.invoiceRows.length} confirmed invoice${data.invoiceRows.length === 1 ? "" : "s"}` : "No confirmed invoice records yet", actionLabel: "Open sales", onAction: () => onNavigate("sales"), trend: data.salesTrend, status: data.invoiceRows.length ? "confirmed" : "insufficient", icon: CircleDollarSign }),
    buildDashboardMetric({ id: "expenses", label: "Total expenses", value: data.expenseRows.length ? money(data.operatingExpenses, currency) : null, source: "finance_expenses", context: data.expenseRows.length ? `${data.expenseRows.length} recorded expense${data.expenseRows.length === 1 ? "" : "s"}` : "No confirmed expense records yet", actionLabel: "Open finance", onAction: () => onNavigate("finance"), status: data.expenseRows.length ? "confirmed" : "insufficient", icon: WalletCards }),
    buildDashboardMetric({ id: "net-result", label: "Net operating result", value: data.invoiceRows.length || data.expenseRows.length ? money(data.netResult, currency) : null, source: "collections less recorded operating expenses", context: "Not a gross-profit calculation; no COGS is inferred", actionLabel: "Open finance", onAction: () => onNavigate("finance"), trend: data.resultTrend, status: data.invoiceRows.length || data.expenseRows.length ? (data.netResult < 0 ? "warning" : "confirmed") : "insufficient", icon: BarChart3 }),
    buildDashboardMetric({ id: "orders", label: "Orders & sales", value: data.orderCount ? numberFormat.format(data.orderCount) : null, source: "sales_invoices + pos_transactions", context: data.orderCount ? "Confirmed invoice and POS records in this period" : "No confirmed order records yet", actionLabel: "Open sales", onAction: () => onNavigate("sales"), status: data.orderCount ? "confirmed" : "insufficient", icon: ShoppingCart }),
    buildDashboardMetric({ id: "receivables", label: "Outstanding invoices", value: data.invoiceRows.length ? money(data.receivables, currency) : null, source: "sales_invoices", context: data.overdueRows.length ? `${data.overdueRows.length} invoice${data.overdueRows.length === 1 ? "" : "s"} overdue` : "No overdue invoice indicated", actionLabel: "Review receivables", onAction: () => onNavigate("finance"), status: data.overdueRows.length ? "warning" : data.invoiceRows.length ? "confirmed" : "insufficient", icon: ReceiptText }),
  ];
  const metricSeries = [data.salesByMonth.map((row) => row.value), data.expenseByMonth.map((row) => row.value), data.chartData.map((row) => row.result), data.salesByMonth.map(() => data.orderCount), data.salesByMonth.map(() => data.receivables)];
  const metricTones = ["#0E9F6E", "#F59E0B", "#3B82F6", "#2563EB", "#E11D48"];
  const visibleMetrics = metrics.filter((metric) => preferences.kpiCardIds.includes(metric.id));
  const widgetStyle = (widgetId, visible = true) => ({ order: Math.max(0, preferences.widgetOrder.indexOf(widgetId)), display: visible ? undefined : "none" });
  const health = [
    { label: "Financial momentum", status: data.invoiceRows.length || data.expenseRows.length ? (data.netResult < 0 ? "risk" : "healthy") : "insufficient", explanation: data.invoiceRows.length || data.expenseRows.length ? `${money(data.netResult, currency)} recorded result in the selected period.` : "Confirmed sales or expense rows are needed before a result can be assessed." },
    { label: "Receivables", status: data.invoiceRows.length ? (data.overdueRows.length ? "attention" : "healthy") : "insufficient", explanation: data.invoiceRows.length ? (data.overdueRows.length ? `${data.overdueRows.length} invoice${data.overdueRows.length === 1 ? " is" : "s are"} past due.` : "No confirmed overdue invoice is exposed in this window.") : "No invoice records are available for a receivables assessment." },
    { label: "Inventory readiness", status: data.inventoryRows.length ? (data.lowStockRows.length ? "attention" : "healthy") : "insufficient", explanation: data.inventoryRows.length ? `${data.lowStockRows.length} item${data.lowStockRows.length === 1 ? " is" : "s are"} at or below the confirmed reorder level.` : "No confirmed inventory records are available." },
    { label: "Operational queue", status: data.openWorkOrders.length ? "attention" : data.orderCount ? "healthy" : "insufficient", explanation: data.openWorkOrders.length ? `${data.openWorkOrders.length} work order${data.openWorkOrders.length === 1 ? " remains" : "s remain"} open.` : data.orderCount ? "Confirmed orders are present without an exposed open work-order risk." : "No confirmed operational rows are available." },
  ];
  const actionItems = [
    ...data.overdueRows.slice(0, 2).map((invoice) => buildActionItem({ id: `invoice-${invoice.id}`, title: `Overdue invoice ${invoice.id}`, detail: `${invoice.customer || "Customer"} · ${money(Math.max(0, invoiceTotal(invoice) - (Number(invoice.amountPaid) || 0)), currency)}`, severity: "critical", source: "sales_invoices", actionLabel: "Review", onAction: () => onNavigate("finance") })),
    ...data.lowStockRows.slice(0, 2).map((item) => buildActionItem({ id: `stock-${item.id || item.sku}`, title: `${item.name || item.sku || "Inventory item"} is low`, detail: `${numberFormat.format(Number(item.qty) || 0)} available · reorder at ${numberFormat.format(Number(item.reorder) || 0)}`, severity: "warning", source: "inventory_items", actionLabel: "Review", onAction: () => onNavigate("inventory") })),
    ...data.pendingLeaveRows.slice(0, 1).map((leave) => buildActionItem({ id: `leave-${leave.id}`, title: `${leave.employee || "Employee"} leave request`, detail: `${leave.type || "Leave"} · ${leave.startDate || "Date pending"}`, severity: "warning", source: "hr_leave_requests", actionLabel: "Review", onAction: () => onNavigate("hr") })),
  ].slice(0, 5);
  const quickActions = [
    canWrite && canOpen("sales") ? { label: "New sale", icon: ReceiptText, action: () => onQuickAction?.("sales", { tab: "invoices", openForm: true }) || onNavigate("sales") } : null,
    canWrite && canOpen("finance") ? { label: "Add expense", icon: WalletCards, action: () => onQuickAction?.("finance", { tab: "expenses" }) || onNavigate("finance") } : null,
    canWrite && canOpen("crm") ? { label: "Add customer", icon: Users, action: () => onQuickAction?.("crm", { tab: "leads" }) || onNavigate("crm") } : null,
    canOpen("inventory") ? { label: "Review stock", icon: Package, action: () => onNavigate("inventory") } : null,
    canOpen("reports") ? { label: "View reports", icon: BarChart3, action: () => onNavigate("reports") } : null,
    canWrite && canOpen("finance") ? { label: "Record payment", icon: CreditCard, action: () => onQuickAction?.("finance", { tab: "receivables" }) || onNavigate("finance") } : null,
    canWrite && canOpen("hr") ? { label: "Approve leave", icon: Clock3, action: () => onQuickAction?.("hr", { tab: "leave" }) || onNavigate("hr") } : null,
    canOpen("ai") ? { label: "AI assistant", icon: Activity, action: () => onNavigate("ai") } : null,
  ].filter(Boolean).slice(0, 8);
  const chartHasData = data.chartData.some((point) => point.revenue || point.expenses);

  return (
    <section className="mx-auto w-full max-w-[1700px] space-y-5 pb-7" aria-label="Executive dashboard">
      <header className="rounded-[22px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_3px_14px_rgba(15,23,42,.035)] sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-emerald-700">SMART MANAGER ERP · {company?.name || "Workspace"}</p><h1 className="mt-2 text-[25px] font-black tracking-[-.045em] text-slate-950 sm:text-[30px]">{greeting}, {firstName}<span aria-hidden="true">.</span></h1><p className="mt-1.5 text-[12px] text-slate-500">Here’s what’s happening with your business today, based on confirmed workspace records.</p></div><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10.5px] font-semibold text-slate-600"><Clock3 size={14} className="text-emerald-700" />{localDate}</span><div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Select dashboard performance period">{PERFORMANCE_WINDOWS.map((window) => <button key={window.id} type="button" onClick={() => updatePreference("performanceWindow", window.id)} aria-pressed={performanceWindowId === window.id} title={window.label} className={`min-h-8 min-w-10 rounded-lg px-2 text-[9.5px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${performanceWindowId === window.id ? "bg-emerald-700 text-white shadow-sm" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"}`}>{window.shortLabel}</button>)}</div>{onCustomizeDashboard && <button type="button" onClick={onCustomizeDashboard} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 text-[10.5px] font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><SlidersHorizontal size={14} />Customize dashboard</button>}</div></div>
      </header>

      {hasSourceError && <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-rose-700" /><div><p className="text-[11px] font-bold text-rose-900">Some workspace information is unavailable</p><p className="mt-0.5 text-[10px] text-rose-800">Confirmed records remain visible where possible. No local fallback is treated as saved business data.</p></div></div><button type="button" onClick={retrySources} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-3 text-[10px] font-bold text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"><RefreshCw size={13} />Retry</button></div>}

      {preferences.showKpiBanner && <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Key performance indicators">{isLoading ? Array.from({ length: Math.max(1, visibleMetrics.length) }, (_, index) => <Panel key={index} className="min-h-[166px] p-4"><Skeleton className="h-9 w-9" /><Skeleton className="mt-4 h-3 w-24" /><Skeleton className="mt-3 h-6 w-36" /><Skeleton className="mt-5 h-6 w-full" /></Panel>) : visibleMetrics.map((metric) => { const index = metrics.findIndex((candidate) => candidate.id === metric.id); return <MetricCard key={metric.id} metric={metric} onNavigate={onNavigate} series={metricSeries[index]} tone={metricTones[index]} />; })}</section>}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="contents">
        <Panel style={widgetStyle("revenue", preferences.showRevenueOverview)}><WidgetHeading eyebrow="Financial movement" title="Revenue overview" icon={BarChart3} actionLabel="Open reports" onAction={() => onNavigate("reports")} />{isLoading ? <div className="h-[292px] p-5"><Skeleton className="h-full w-full" /></div> : chartHasData ? <div className="h-[292px] px-2 pb-4 pt-4 sm:px-4"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="referenceRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0E9F6E" stopOpacity=".26" /><stop offset="100%" stopColor="#0E9F6E" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#EDF1EF" strokeDasharray="3 3" /><XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} dy={8} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 9 }} tickFormatter={(value) => compactFormat.format(value)} /><Tooltip formatter={(value, name) => [money(value, currency), name === "revenue" ? "Collected" : name === "expenses" ? "Expenses" : "Net result"]} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 11 }} /><Area type="monotone" dataKey="revenue" stroke="#0E9F6E" strokeWidth={2.5} fill="url(#referenceRevenue)" /><Area type="monotone" dataKey="expenses" stroke="#F59E0B" strokeWidth={2} fill="transparent" strokeDasharray="5 4" /></AreaChart></ResponsiveContainer></div> : <EmptyState icon={BarChart3} title={`No confirmed movement in ${performanceWindow.label.toLowerCase()}`} detail="This chart needs confirmed invoice payments or recorded expenses in the selected period. It never fabricates a trend." actionLabel="Open finance" onAction={() => onNavigate("finance")} />}</Panel>
        <Panel style={widgetStyle("salesMix", preferences.showSalesMix)}><WidgetHeading eyebrow="Sales mix" title="Collected value by status" icon={CircleDollarSign} actionLabel="Open sales" onAction={() => onNavigate("sales")} />{data.salesMix.length ? <div className="flex min-h-[292px] flex-col px-4 py-4"><div className="h-[154px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.salesMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={67} paddingAngle={3} stroke="none">{data.salesMix.map((row, index) => <Cell key={row.name} fill={MIX_COLORS[index % MIX_COLORS.length]} />)}</Pie><Tooltip formatter={(value) => money(value, currency)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 10 }} /></PieChart></ResponsiveContainer></div><div className="mt-2 space-y-2">{data.salesMix.map((row, index) => <div key={row.name} className="flex items-center gap-2 text-[10.5px]"><span className="h-2 w-2 rounded-full" style={{ background: MIX_COLORS[index % MIX_COLORS.length] }} /><span className="min-w-0 flex-1 truncate text-slate-600">{row.name}</span><span className="font-bold text-slate-800">{money(row.value, currency)}</span></div>)}</div></div> : <EmptyState icon={CircleDollarSign} title="No confirmed sales mix yet" detail="Status breakdown appears after invoice payments are recorded in the selected period." actionLabel="Open sales" onAction={() => onNavigate("sales")} />}</Panel>
        <Panel style={widgetStyle("quickActions", preferences.showQuickActions && preferences.showPendingApprovals)}><WidgetHeading eyebrow="Quick actions" title="Move work forward" icon={Plus} />{quickActions.length ? <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">{quickActions.map((action) => { const Icon = action.icon; return <button type="button" key={action.label} onClick={action.action} className="group flex min-h-[74px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50 px-2 text-center transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm transition group-hover:bg-emerald-700 group-hover:text-white"><Icon size={15} /></span><span className="mt-2 text-[9.5px] font-bold leading-3 text-slate-700">{action.label}</span></button>; })}</div> : <EmptyState compact icon={ShieldAlert} title="No actions are available" detail="Available actions follow your workspace role and module access." />}</Panel>
        </div>
        <div className="contents">
        <Panel style={widgetStyle("products", preferences.showTopProducts)}><WidgetHeading eyebrow="Products" title="Top products" icon={Package} actionLabel="Open inventory" onAction={() => onNavigate("inventory")} />{data.topProducts.length ? <div className="space-y-3 px-4 py-4">{data.topProducts.map((product, index) => { const percent = data.productRevenue ? Math.round((product.revenue / data.productRevenue) * 100) : 0; return <div key={product.name} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-500">{index + 1}</span><div className="min-w-0"><div className="flex items-center justify-between gap-2"><p className="truncate text-[11px] font-bold text-slate-800">{product.name}</p><span className="shrink-0 text-[9.5px] text-slate-500">{numberFormat.format(product.units)} units</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(6, percent)}%` }} /></div></div><div className="text-right"><p className="text-[10px] font-bold text-slate-800">{money(product.revenue, currency)}</p><p className="mt-0.5 text-[9px] text-slate-400">{percent}%</p></div></div>; })}</div> : <EmptyState icon={Package} title="No confirmed product sales yet" detail="Product ranking needs invoice line items with quantities and rates; no product result is invented." actionLabel="Open inventory" onAction={() => onNavigate("inventory")} />}</Panel>
        <Panel style={widgetStyle("cashFlow", preferences.showCashFlow)}><WidgetHeading eyebrow="Recorded movement" title="Cash flow overview" icon={WalletCards} actionLabel="Open finance" onAction={() => onNavigate("finance")} />{chartHasData ? <div className="px-4 pb-4 pt-3"><div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 px-3 py-3"><div><p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">Cash in</p><p className="mt-1 text-[12px] font-black text-emerald-700">{money(data.collected, currency)}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">Cash out</p><p className="mt-1 text-[12px] font-black text-rose-700">{money(data.operatingExpenses, currency)}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">Net</p><p className="mt-1 text-[12px] font-black text-slate-900">{money(data.netResult, currency)}</p></div></div><div className="mt-3 h-[168px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.chartData} margin={{ top: 6, right: 0, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="#F1F5F9" /><XAxis dataKey="period" tick={{ fontSize: 9, fill: "#94A3B8" }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickLine={false} axisLine={false} tickFormatter={(value) => compactFormat.format(value)} /><Tooltip formatter={(value, name) => [money(value, currency), name === "revenue" ? "Collected" : "Expenses"]} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 10 }} /><Bar dataKey="revenue" fill="#0E9F6E" radius={[3, 3, 0, 0]} /><Bar dataKey="expenses" fill="#EF4444" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="mt-2 text-[9px] leading-4 text-slate-400">Recorded collections less operating expenses. This is not a bank-balance statement.</p></div> : <EmptyState icon={WalletCards} title="No recorded movement yet" detail="Cash movement is shown only from confirmed collections and recorded expenses." actionLabel="Open finance" onAction={() => onNavigate("finance")} />}</Panel>
        <Panel style={widgetStyle("businessHealth", preferences.showBusinessHealth)}><WidgetHeading eyebrow="Business health" title="Explainable signals" icon={ShieldAlert} actionLabel="Open reports" onAction={() => onNavigate("reports")} /><div className="space-y-2 p-4">{health.map((row) => <HealthRow key={row.label} {...row} />)}</div></Panel>
        </div>
        <div className="contents">
        <Panel style={widgetStyle("activity", preferences.showActivityTimeline)}><WidgetHeading eyebrow="Recent activity" title="What happened recently" icon={Activity} actionLabel="Open reports" onAction={() => onNavigate("reports")} />{recentActivity.length ? <div className="divide-y divide-slate-100">{recentActivity.slice(0, 5).map((activity, index) => { const Icon = activity.icon || Activity; return <div key={`${activity.text}-${index}`} className="flex items-center gap-3 px-4 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ color: activity.color, backgroundColor: `${activity.color}16` }}><Icon size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-slate-800">{activity.text}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{activity.sub}</p></div><span className="shrink-0 text-[9.5px] text-slate-400">{activity.date || ""}</span></div>; })}</div> : <EmptyState compact icon={Activity} title="No confirmed activity yet" detail="This feed uses recorded invoices, expenses, and approval activity only." actionLabel="Open reports" onAction={() => onNavigate("reports")} />}</Panel>
        <Panel style={widgetStyle("actionCenter", preferences.showActionCenter)}><WidgetHeading eyebrow="Action center" title="Needs attention" icon={AlertTriangle} actionLabel="Open reports" onAction={() => onNavigate("reports")} />{actionItems.length ? <div className="divide-y divide-slate-100">{actionItems.map((item) => <button key={item.id} type="button" onClick={item.onAction} className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${item.severity === "critical" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}><AlertTriangle size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold text-slate-800">{item.title}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{item.detail}</span><span className="mt-1 inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700">{item.actionLabel}<ChevronRight size={11} /></span></span><span className="sr-only">{sourceNoteFor(item.severity === "critical" ? "warning" : "confirmed", item.source)}</span></button>)}</div> : <EmptyState compact icon={CheckCircle2} title="No confirmed urgent items" detail="No overdue receivables, low stock records, or pending leave approvals are currently exposed." />}</Panel>
        </div>
      </section>
    </section>
  );
}
