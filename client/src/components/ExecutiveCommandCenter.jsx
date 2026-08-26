import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Package,
  ReceiptText,
  ShieldAlert,
  ShoppingCart,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  asRows,
  buildActionItem,
  buildDashboardMetric,
  dataStatusFor,
  sourceNoteFor,
  trendFromPeriods,
} from "../dashboardContracts";

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const PERFORMANCE_WINDOWS = [
  { id: "30d", label: "30D", days: 30 },
  { id: "3m", label: "3M", days: 92 },
  { id: "6m", label: "6M", days: 183 },
  { id: "1y", label: "1Y", days: 365 },
];

function rowDate(row) {
  const value = row?.date || row?.issueDate || row?.expenseDate || row?.created_at || row?.createdAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function isInPerformanceWindow(row, start) {
  const date = rowDate(row);
  return Boolean(date) && date >= start;
}

function money(value, currency = "TZS") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Insufficient confirmed data";
  return `${currency} ${numberFormat.format(Math.round(Number(value)))}k`;
}

function invoiceTotal(invoice) {
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

function MetricCard({ metric, onNavigate }) {
  const Icon = metric.icon || CircleDollarSign;
  const trend = metric.trend;
  const value = metric.value === null || metric.value === undefined ? "—" : metric.value;
  const statusColor = metric.status === "confirmed" ? "#15803D" : metric.status === "warning" ? "#B45309" : "#64748B";
  return (
    <button
      type="button"
      onClick={() => metric.onAction?.() || (metric.module && onNavigate(metric.module))}
      className="group min-h-[142px] rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      aria-label={`${metric.label}. ${metric.statusLabel}. ${metric.actionLabel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white"><Icon size={17} /></span>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold" style={{ color: statusColor, background: `${statusColor}12` }}>
          {metric.statusLabel}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{metric.label}</p>
          <p className="mt-1 text-[21px] font-black tracking-tight text-slate-900">{value}</p>
        </div>
        {trend && trend.direction !== "neutral" && (
          <span className={`inline-flex shrink-0 items-center gap-0.5 text-[10px] font-bold ${trend.direction === "up" ? "text-emerald-700" : "text-rose-700"}`}>
            {trend.direction === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend.label}
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-4 text-slate-500">{metric.context || metric.source}</p>
      <p className="mt-1 truncate text-[9px] font-medium text-slate-400" title={metric.source}>Source: {metric.source}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700">{metric.actionLabel}<ChevronRight size={12} /></p>
    </button>
  );
}

function HealthRow({ label, status, explanation }) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ color: meta.color, background: meta.bg }}><Icon size={14} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-slate-800">{label}</p>
          <span className="text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
        </div>
        <p className="mt-1 text-[10.5px] leading-4 text-slate-500">{explanation}</p>
      </div>
    </div>
  );
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
  onNavigate,
  onCustomizeDashboard,
  currentUser,
  company,
  currency = "TZS",
}) {
  const [performanceWindowId, setPerformanceWindowId] = useState("6m");
  const performanceWindow = PERFORMANCE_WINDOWS.find((window) => window.id === performanceWindowId) || PERFORMANCE_WINDOWS[2];
  const performanceStart = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - performanceWindow.days + 1);
    return start;
  }, [performanceWindow.days]);
  const data = useMemo(() => {
    const invoiceRows = asRows(invoices).filter((row) => isInPerformanceWindow(row, performanceStart));
    const expenseRows = asRows(expenses).filter((row) => isInPerformanceWindow(row, performanceStart));
    const inventoryRows = asRows(inventory);
    const leadRows = asRows(crm);
    const employeeRows = asRows(employees);
    const leaveRows = asRows(leaveRequests);
    const posRows = asRows(posTransactions);
    const workOrderRows = asRows(workOrders);

    const billed = invoiceRows.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const netSales = invoiceRows.reduce((sum, invoice) => sum + (invoice.status === "Paid" ? invoiceTotal(invoice) : (Number(invoice.amountPaid) || 0)), 0);
    const operatingExpenses = expenseRows.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const grossProfit = netSales - operatingExpenses;
    const receivables = invoiceRows.filter((invoice) => invoice.status !== "Paid").reduce((sum, invoice) => sum + Math.max(0, invoiceTotal(invoice) - (Number(invoice.amountPaid) || 0)), 0);
    const inventoryValue = inventoryRows.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitCost) || 0), 0);
    const lowStockRows = inventoryRows.filter((item) => Number(item.reorder) > 0 && Number(item.qty) <= Number(item.reorder));
    const pendingLeaveRows = leaveRows.filter((leave) => ["Pending", "Submitted", "Awaiting Approval"].includes(leave.status));
    const overdueRows = invoiceRows.filter((invoice) => invoice.status !== "Paid" && invoice.dueDate && invoice.dueDate < new Date().toISOString().slice(0, 10));
    const activeEmployees = employeeRows.filter((employee) => !employee.status || ["Active", "Employed"].includes(employee.status));
    const activeCustomers = new Set([...invoiceRows.map((invoice) => invoice.customer), ...leadRows.map((lead) => lead.company || lead.name)].filter(Boolean));
    const orderCount = invoiceRows.length + posRows.length;
    const openWorkOrders = workOrderRows.filter((order) => !["Completed", "Cancelled"].includes(order.status));
    const salesByMonth = sumByMonth(invoiceRows, invoiceTotal, (invoice) => invoice.date);
    const expenseByMonth = sumByMonth(expenseRows, (expense) => expense.amount, (expense) => expense.date || expense.expenseDate);
    const profitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : null;
    const profitByMonth = salesByMonth.map((period) => {
      const expense = expenseByMonth.find((row) => row.key === period.key)?.value || 0;
      return { ...period, value: period.value - expense };
    });
    const priorSales = salesByMonth.length > 1 ? salesByMonth[salesByMonth.length - 2].value : null;
    const currentSales = salesByMonth.length > 0 ? salesByMonth[salesByMonth.length - 1].value : null;
    const priorProfit = profitByMonth.length > 1 ? profitByMonth[profitByMonth.length - 2].value : null;
    const currentProfit = profitByMonth.length > 0 ? profitByMonth[profitByMonth.length - 1].value : null;
    const invoiceSource = invoiceRows.length ? "sales_invoices" : "No confirmed invoices";
    const expenseSource = expenseRows.length ? "finance_expenses" : "No confirmed expenses";
    return {
      invoiceRows,
      expenseRows,
      inventoryRows,
      leadRows,
      leaveRows,
      billed,
      netSales,
      operatingExpenses,
      grossProfit,
      receivables,
      inventoryValue,
      lowStockRows,
      pendingLeaveRows,
      overdueRows,
      activeEmployees,
      activeCustomers,
      orderCount,
      openWorkOrders,
      salesByMonth,
      expenseByMonth,
      profitByMonth,
      salesTrend: trendFromPeriods(currentSales, priorSales),
      profitTrend: trendFromPeriods(currentProfit, priorProfit),
      invoiceSource,
      expenseSource,
      profitMargin,
    };
  }, [invoices, expenses, inventory, crm, employees, leaveRequests, posTransactions, workOrders, performanceStart]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = String(currentUser?.name || "there").trim().split(/\s+/)[0] || "there";

  const metrics = [
    buildDashboardMetric({ id: "revenue", label: "Total revenue", value: data.billed ? money(data.billed, currency) : null, source: data.invoiceSource, context: data.invoiceRows.length ? `${data.invoiceRows.length} confirmed invoice${data.invoiceRows.length === 1 ? "" : "s"}` : "No confirmed invoice records yet", actionLabel: "Open sales records", onAction: () => onNavigate("sales"), trend: data.salesTrend, status: data.invoiceRows.length ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "net-sales", label: "Net sales", value: data.netSales ? money(data.netSales, currency) : null, source: data.invoiceSource, context: data.netSales ? "Paid or partially collected invoice value" : "No confirmed collections yet", actionLabel: "Open receivables", onAction: () => onNavigate("finance"), trend: data.salesTrend, status: data.invoiceRows.length ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "gross-profit", label: "Gross profit", value: null, source: "No confirmed cost-of-goods source exposed to the executive dashboard", context: "Gross profit is not inferred from sales minus operating expenses", actionLabel: "Open finance", onAction: () => onNavigate("finance"), status: "insufficient" }),
    buildDashboardMetric({ id: "net-profit", label: "Net profit", value: data.invoiceRows.length || data.expenseRows.length ? money(data.grossProfit, currency) : null, source: `${data.invoiceSource} + ${data.expenseSource}`, context: data.invoiceRows.length || data.expenseRows.length ? "Net sales less confirmed operating expenses" : "Add confirmed sales or expenses to calculate net profit", actionLabel: "Open finance", onAction: () => onNavigate("finance"), trend: data.profitTrend, status: data.invoiceRows.length || data.expenseRows.length ? (data.grossProfit < 0 ? "warning" : "confirmed") : "insufficient" }),
    buildDashboardMetric({ id: "operating-expenses", label: "Operating expenses", value: data.expenseRows.length ? money(data.operatingExpenses, currency) : null, source: data.expenseSource, context: data.expenseRows.length ? `${data.expenseRows.length} confirmed expense${data.expenseRows.length === 1 ? "" : "s"}` : "No confirmed expense records yet", actionLabel: "Review expenses", onAction: () => onNavigate("finance"), status: data.expenseRows.length ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "receivables", label: "Outstanding receivables", value: data.invoiceRows.length ? money(data.receivables, currency) : null, source: data.invoiceSource, context: data.overdueRows.length ? `${data.overdueRows.length} overdue invoice${data.overdueRows.length === 1 ? "" : "s"}` : "No overdue invoice records", actionLabel: "Review receivables", onAction: () => onNavigate("finance"), status: data.overdueRows.length ? "warning" : data.invoiceRows.length ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "low-stock", label: "Low-stock items", value: data.inventoryRows.length ? numberFormat.format(data.lowStockRows.length) : null, source: "inventory_items", context: data.inventoryRows.length ? `${data.lowStockRows.length} item${data.lowStockRows.length === 1 ? "" : "s"} at or below reorder threshold` : "No confirmed inventory records", actionLabel: "Review inventory", onAction: () => onNavigate("inventory"), status: data.lowStockRows.length ? "warning" : data.inventoryRows.length ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "payables", label: "Outstanding payables", value: null, source: "No confirmed payables source exposed to the executive dashboard", context: "The dashboard will show this when a confirmed supplier-payables source is available", actionLabel: "Open procurement", onAction: () => onNavigate("procurement"), status: "insufficient" }),
    buildDashboardMetric({ id: "cash", label: "Cash position", value: null, source: "No confirmed cash-balance source exposed to the executive dashboard", context: "Cash position is not inferred from invoices or expenses", actionLabel: "Open finance", onAction: () => onNavigate("finance"), status: "insufficient" }),
    buildDashboardMetric({ id: "inventory", label: "Inventory value", value: data.inventoryRows.length ? money(data.inventoryValue, currency) : null, source: "inventory_items", context: data.inventoryRows.length ? `${data.inventoryRows.length} confirmed SKU${data.inventoryRows.length === 1 ? "" : "s"}` : "No confirmed inventory records", actionLabel: "Review inventory", onAction: () => onNavigate("inventory"), status: data.lowStockRows.length ? "warning" : data.inventoryRows.length ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "customers", label: "Active customers", value: data.activeCustomers.size ? numberFormat.format(data.activeCustomers.size) : null, source: data.activeCustomers.size ? "sales_invoices + crm_leads" : "No confirmed customer activity", context: data.activeCustomers.size ? "Unique customers represented in confirmed sales or pipeline rows" : "No confirmed customer activity yet", actionLabel: "Open CRM", onAction: () => onNavigate("crm"), status: data.activeCustomers.size ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "employees", label: "Employees", value: data.activeEmployees.length ? numberFormat.format(data.activeEmployees.length) : null, source: "hr_employees", context: data.activeEmployees.length ? "Active employees in the confirmed HR roster" : "No confirmed employee records", actionLabel: "Open HR", onAction: () => onNavigate("hr"), status: data.activeEmployees.length ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "orders", label: "Orders", value: data.orderCount ? numberFormat.format(data.orderCount) : null, source: "sales_invoices + pos_transactions", context: data.orderCount ? "Confirmed sales and POS transaction records" : "No confirmed order records", actionLabel: "Open sales", onAction: () => onNavigate("sales"), status: data.orderCount ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "approvals", label: "Pending approvals", value: data.pendingLeaveRows.length ? numberFormat.format(data.pendingLeaveRows.length) : data.leaveRows.length ? "0" : null, source: "hr_leave_requests", context: data.leaveRows.length ? "Confirmed leave requests awaiting a decision" : "No confirmed approval queue records", actionLabel: "Review approvals", onAction: () => onNavigate("hr"), status: data.pendingLeaveRows.length ? "warning" : data.leaveRows.length ? "confirmed" : "insufficient" }),
    buildDashboardMetric({ id: "sales-target", label: "Sales target", value: null, source: "No confirmed workspace target configured", context: "Configure a management target before showing achievement", actionLabel: "Open reports", onAction: () => onNavigate("reports"), status: "insufficient" }),
    buildDashboardMetric({ id: "target-achievement", label: "Target achievement", value: null, source: "No confirmed workspace target configured", context: "Achievement is not calculated without a confirmed target", actionLabel: "Open reports", onAction: () => onNavigate("reports"), status: "insufficient" }),
    buildDashboardMetric({ id: "profit-margin", label: "Profit margin", value: data.profitMargin !== null ? `${data.profitMargin.toFixed(1)}%` : null, source: `${data.invoiceSource} + ${data.expenseSource}`, context: data.profitMargin !== null ? "Net profit divided by confirmed net sales" : "Insufficient confirmed sales for a margin calculation", actionLabel: "Open finance", onAction: () => onNavigate("finance"), status: data.profitMargin !== null ? (data.profitMargin < 0 ? "warning" : "confirmed") : "insufficient" }),
  ];

  const health = [
    { label: "Financial health", status: data.invoiceRows.length || data.expenseRows.length ? (data.grossProfit < 0 ? "risk" : "healthy") : "insufficient", explanation: data.invoiceRows.length || data.expenseRows.length ? `${money(data.grossProfit, currency)} gross result from confirmed sales and expenses.` : "Insufficient confirmed data to assess profit or cash pressure." },
    { label: "Sales health", status: data.invoiceRows.length || data.leadRows.length ? (data.invoiceRows.length ? "healthy" : "attention") : "insufficient", explanation: data.invoiceRows.length ? `${data.invoiceRows.length} confirmed invoice${data.invoiceRows.length === 1 ? "" : "s"} and ${data.leadRows.length} CRM lead${data.leadRows.length === 1 ? "" : "s"} are available.` : "Pipeline data exists, but confirmed billing activity is not available yet." },
    { label: "Inventory health", status: data.inventoryRows.length ? (data.lowStockRows.length ? "attention" : "healthy") : "insufficient", explanation: data.inventoryRows.length ? `${data.lowStockRows.length} item${data.lowStockRows.length === 1 ? "" : "s"} at or below reorder threshold.` : "Insufficient confirmed stock data to assess inventory risk." },
    { label: "Customer health", status: data.activeCustomers.size ? "healthy" : "insufficient", explanation: data.activeCustomers.size ? `${data.activeCustomers.size} unique customer identities appear in confirmed CRM or sales rows.` : "No confirmed customer activity is available for a reliable health assessment." },
    { label: "Operational health", status: data.orderCount || data.openWorkOrders.length ? (data.openWorkOrders.length ? "attention" : "healthy") : "insufficient", explanation: data.openWorkOrders.length ? `${data.openWorkOrders.length} production or operations work order${data.openWorkOrders.length === 1 ? "" : "s"} remain open.` : data.orderCount ? "Confirmed sales activity is present and no open work-order risk is exposed here." : "Insufficient confirmed operational data to assess performance." },
    { label: "Security & integrations", status: "insufficient", explanation: "Integration and security health remain in their dedicated, permission-aware modules; no status is inferred here." },
  ];

  const actions = [
    ...data.overdueRows.slice(0, 3).map((invoice) => buildActionItem({ id: `invoice-${invoice.id}`, title: `Overdue invoice ${invoice.id}`, detail: `${invoice.customer || "Customer"} · ${money(Math.max(0, invoiceTotal(invoice) - (Number(invoice.amountPaid) || 0)), currency)} outstanding`, severity: "critical", source: "sales_invoices", actionLabel: "Review receivable", onAction: () => onNavigate("finance") })),
    ...data.lowStockRows.slice(0, 3).map((item) => buildActionItem({ id: `stock-${item.id}`, title: `${item.name || item.sku || "Inventory item"} is low`, detail: `${numberFormat.format(Number(item.qty) || 0)} available · reorder at ${numberFormat.format(Number(item.reorder) || 0)}`, severity: "warning", source: "inventory_items", actionLabel: "Review stock", onAction: () => onNavigate("inventory") })),
    ...data.pendingLeaveRows.slice(0, 3).map((leave) => buildActionItem({ id: `leave-${leave.id}`, title: `${leave.employee || "Employee"} leave request`, detail: `${leave.type || "Leave"} · ${leave.startDate || "Date pending"}`, severity: "warning", source: "hr_leave_requests", actionLabel: "Review leave", onAction: () => onNavigate("hr") })),
  ].slice(0, 6);

  const hasPerformanceData = data.salesByMonth.length >= 2 || data.expenseByMonth.length >= 2;
  const chartData = useMemo(() => {
    const keys = [...new Set([...data.salesByMonth.map((row) => row.key), ...data.expenseByMonth.map((row) => row.key)])].sort().slice(-6);
    return keys.map((key) => ({
      period: periodLabel(key),
      revenue: data.salesByMonth.find((row) => row.key === key)?.value || 0,
      expenses: data.expenseByMonth.find((row) => row.key === key)?.value || 0,
      profit: data.profitByMonth.find((row) => row.key === key)?.value || 0,
    }));
  }, [data.salesByMonth, data.expenseByMonth, data.profitByMonth]);

  return (
    <section className="space-y-5" aria-label="Executive command center">
      <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white px-5 py-5 shadow-[0_8px_26px_rgba(15,23,42,.045)] sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">SMART MANAGER · {company?.name || "Workspace"}</p>
            <h1 className="mt-2 text-[25px] font-black tracking-[-.045em] text-slate-950 sm:text-[30px]">{greeting}, {firstName}.</h1>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-slate-500">Here is what is happening with confirmed business records in your current workspace.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Select dashboard performance period">
              {PERFORMANCE_WINDOWS.map((window) => <button key={window.id} type="button" onClick={() => setPerformanceWindowId(window.id)} aria-pressed={performanceWindowId === window.id} className={`min-h-9 min-w-11 rounded-lg px-2.5 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${performanceWindowId === window.id ? "bg-emerald-700 text-white shadow-sm" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"}`}>{window.label}</button>)}
            </div>
            {onCustomizeDashboard && <button type="button" onClick={onCustomizeDashboard} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3.5 text-[11px] font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Clock3 size={14} aria-hidden="true" />Customize dashboard</button>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700"><BriefcaseBusiness size={14} /> Executive command center</div>
          <h2 className="mt-1 text-[20px] font-black tracking-tight text-slate-900">What needs management attention now?</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">A module-aware operating view built from confirmed workspace records in the selected {performanceWindow.label} window. Every card and alert leads to the underlying operational module.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10.5px] font-bold text-emerald-800"><CheckCircle2 size={13} /> Confirmed-data model</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.id} metric={metric} onNavigate={onNavigate} />)}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><BarChart3Icon /></span><h3 className="text-[14px] font-black text-slate-900">Business performance</h3></div>
              <p className="mt-1 text-[11px] text-slate-500">Revenue, expense, and profit movement by confirmed invoice and expense month.</p>
            </div>
            <button type="button" onClick={() => onNavigate("reports")} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">Open reports <ChevronRight size={13} /></button>
          </div>
          {hasPerformanceData ? (
            <div className="mt-4 h-[245px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="executiveRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16A34A" stopOpacity={0.28} /><stop offset="95%" stopColor="#16A34A" stopOpacity={0} /></linearGradient>
                    <linearGradient id="executiveProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(value) => compactFormat.format(value)} />
                  <Tooltip formatter={(value, name) => [money(value, currency), name === "revenue" ? "Revenue" : name === "expenses" ? "Expenses" : "Profit"]} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 11 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#16A34A" fill="url(#executiveRevenue)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="profit" stroke="#2563EB" fill="url(#executiveProfit)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="#F59E0B" fill="transparent" strokeWidth={2} strokeDasharray="5 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex min-h-[245px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center"><Activity size={21} className="text-slate-300" /><p className="mt-3 text-[12px] font-bold text-slate-600">Insufficient confirmed data</p><p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-400">At least two comparable periods are required before a trend is shown. The dashboard will not invent a trajectory.</p></div>
          )}
          <p className="mt-2 text-[10px] text-slate-400">Source: confirmed `sales_invoices` and `finance_expenses` rows. No target or forecast is inferred.</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><ShieldAlert size={16} /></span><h3 className="text-[14px] font-black text-slate-900">Business health</h3></div><p className="mt-1 text-[11px] text-slate-500">Explainable status by operating area.</p></div><button type="button" onClick={() => onNavigate("reports")} className="text-[10.5px] font-bold text-emerald-700">Details</button></div>
          <div className="mt-4 space-y-2">{health.map((row) => <HealthRow key={row.label} {...row} />)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700"><AlertTriangle size={16} /></span><h3 className="text-[14px] font-black text-slate-900">Action center</h3>{actions.length > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800">{actions.length} require review</span>}</div><p className="mt-1 text-[11px] text-slate-500">Only confirmed overdue, stock, and approval records appear here.</p></div><button type="button" onClick={() => onNavigate("reports")} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">View all operational reports <ChevronRight size={13} /></button></div>
        {actions.length ? <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">{actions.map((item) => <button key={item.id} type="button" onClick={item.onAction} className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-rose-200 hover:bg-rose-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[12px] font-bold text-slate-800">{item.title}</p><p className="mt-1 line-clamp-2 text-[10.5px] leading-4 text-slate-500">{item.detail}</p></div><ChevronRight size={14} className="mt-0.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5" /></div><p className="mt-2 text-[10px] font-bold text-emerald-700">{item.actionLabel}</p><p className="mt-1 text-[9.5px] text-slate-400">{sourceNoteFor(item.severity === "critical" ? "warning" : "confirmed", item.source)}</p></button>)}</div> : <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4"><CheckCircle2 size={18} className="shrink-0 text-emerald-700" /><div><p className="text-[12px] font-bold text-emerald-900">No confirmed urgent items</p><p className="mt-0.5 text-[10.5px] text-emerald-800/75">The current rows do not expose overdue receivables, low stock, or pending leave approvals.</p></div></div>}
      </div>
    </section>
  );
}

function BarChart3Icon() {
  return <span className="text-[13px] font-black leading-none">↗</span>;
}
