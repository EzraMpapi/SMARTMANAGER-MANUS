import { jsPDF } from "jspdf";
import { ENV } from "./_core/env";
import { getReportScheduleByTaskUid, markReportSent, type ReportDateRange, type ReportFormat, type ReportModules } from "./reportSchedules";
import { isTransactionalEmailDeliveryEnabled, sendTransactionalEmail, workspaceEmailHtml } from "./transactionalEmail";

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const STATUS_BUCKETS = ["Planned", "In Progress", "Completed", "Cancelled"];

type RawRow = Record<string, any>;
type ReportSection = { title: string; rows: Array<Record<string, unknown>> };

function getCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function csvEscape(value: unknown): string {
  return `"${getCell(value).replace(/"/g, '""')}"`;
}

export function serializeReportSectionsToCsv(sections: ReportSection[]): string {
  const lines = [csvEscape("BusinessSphere ERP — scheduled dashboard report")];
  for (const section of sections) {
    lines.push("", csvEscape(section.title));
    if (!section.rows.length) continue;
    const headers = Array.from(new Set(section.rows.flatMap((row) => Object.keys(row))));
    lines.push(headers.map(csvEscape).join(","));
    for (const row of section.rows) lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

function addPdfSection(doc: jsPDF, section: ReportSection, state: { y: number }, margin: number, pageWidth: number, pageHeight: number) {
  const contentWidth = pageWidth - margin * 2;
  const rows = section.rows;
  if (!rows.length) return;
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const ensureSpace = (height: number) => {
    if (state.y + height > pageHeight - margin) {
      doc.addPage();
      state.y = 42;
    }
  };
  ensureSpace(48);
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(margin, state.y - 13, contentWidth, 24, 5, 5, "F");
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(section.title.slice(0, 78), margin + 8, state.y + 2);
  state.y += 20;
  const columnWidth = contentWidth / Math.max(headers.length, 1);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, state.y - 11, contentWidth, 18, "F");
  doc.setFontSize(7.5);
  headers.forEach((header, index) => doc.text(header.slice(0, Math.max(12, Math.floor(columnWidth / 4))), margin + index * columnWidth + 5, state.y));
  state.y += 15;
  rows.forEach((row, rowIndex) => {
    ensureSpace(17);
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, state.y - 10, contentWidth, 16, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    headers.forEach((header, index) => {
      const value = getCell(row[header]).replace(/\s+/g, " ");
      doc.text(value.length > 30 ? `${value.slice(0, 29)}…` : value, margin + index * columnWidth + 5, state.y);
    });
    state.y += 16;
  });
  state.y += 14;
}

export function createScheduledReportPdf({ companyName, periodLabel, filterSummary, sections }: { companyName: string; periodLabel: string; filterSummary: string; sections: ReportSection[] }): ArrayBuffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 36;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(13, 34, 20);
  doc.rect(0, 0, pageWidth, 74, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BusinessSphere ERP", margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Scheduled dashboard chart data report", margin, 52);
  doc.text(`${companyName.slice(0, 42)} · ${periodLabel.slice(0, 28)}`, pageWidth - margin, 52, { align: "right" });
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Filters: ${filterSummary.slice(0, 92)}`, margin, 67);
  const state = { y: 96 };
  sections.forEach((section) => addPdfSection(doc, section, state, margin, pageWidth, pageHeight));
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text(`Generated ${new Date().toISOString().slice(0, 10)} · Live dashboard data`, margin, pageHeight - 18);
  return doc.output("arraybuffer");
}

async function querySupabase(table: string, select: string, companyId: string): Promise<RawRow[]> {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Supabase server credentials are not configured.");
  const params = new URLSearchParams({ select, company_id: `eq.${companyId}`, limit: "1000" });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/${table}?${params.toString()}`, {
    headers: { accept: "application/json", apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}` },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Supabase ${table} query failed (${response.status}): ${body?.message || body?.hint || "unknown error"}`);
  return Array.isArray(body) ? body : [];
}

function inDateRange(value: unknown, dateRange: ReportDateRange): boolean {
  if (!dateRange.start && !dateRange.end) return true;
  if (!value) return false;
  const date = String(value).slice(0, 10);
  return (!dateRange.start || date >= dateRange.start) && (!dateRange.end || date <= dateRange.end);
}

function lineTotal(items: RawRow[] = []): number {
  return items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
}

function filterSections(sections: ReportSection[], modules: ReportModules): ReportSection[] {
  const moduleForTitle: Record<string, keyof ReportModules | "executive"> = {
    "Revenue vs Expenses Trend": "finance",
    "Accounts Receivable Aging": "finance",
    "CRM Pipeline by Stage": "crm",
    "Inventory Value by Category": "inventory",
    "Work Orders by Status": "operations",
    "Top Customers by Billed Value": "sales",
  };
  return sections.filter((section) => section.title === "Executive KPIs" || modules[moduleForTitle[section.title] as keyof ReportModules] !== false);
}

export async function buildScheduledReportData({ companyId, modules, dateRange }: { companyId: string; modules: ReportModules; dateRange: ReportDateRange }) {
  const [invoices, expenses, leads, inventory, workOrders, companyRows] = await Promise.all([
    querySupabase("sales_invoices", "*,sales_invoice_items(*)", companyId),
    querySupabase("finance_expenses", "*", companyId),
    querySupabase("crm_leads", "*", companyId),
    querySupabase("inventory_items", "*", companyId),
    querySupabase("manufacturing_work_orders", "*", companyId),
    querySupabase("companies", "id,name,currency", companyId),
  ]);
  const filteredInvoices = invoices.filter((row) => inDateRange(row.issue_date, dateRange));
  const filteredExpenses = expenses.filter((row) => inDateRange(row.expense_date, dateRange));
  const filteredLeads = leads.filter((row) => inDateRange(row.created_at || row.expected_close_date, dateRange));
  const filteredWorkOrders = workOrders.filter((row) => inDateRange(row.start_date, dateRange));
  const revenue = filteredInvoices.reduce((sum, row) => sum + (row.status === "Paid" ? lineTotal(row.sales_invoice_items) : Number(row.amount_paid) || 0), 0);
  const expenseTotal = filteredExpenses.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const pipeline = filteredLeads.filter((row) => !["Won", "Lost"].includes(row.stage)).reduce((sum, row) => sum + (Number(row.value_amount) || 0), 0);
  const pipelineByStage = STAGES.map((stage) => ({ stage, deal_count: filteredLeads.filter((row) => row.stage === stage).length }));
  const stockByCategory = Object.entries(inventory.reduce((map, row) => ({ ...map, [row.category || "General"]: (map[row.category || "General"] || 0) + (Number(row.qty_on_hand ?? row.quantity) || 0) * (Number(row.unit_cost) || 0) }), {} as Record<string, number>)).map(([category, value]) => ({ category, stock_value_tzs_k: Math.round(value) }));
  const workOrdersByStatus = STATUS_BUCKETS.map((status) => ({ status, order_count: filteredWorkOrders.filter((row) => row.status === status).length }));
  const customerTotals: Record<string, number> = {};
  filteredInvoices.forEach((row) => { customerTotals[row.customer || "Unknown"] = (customerTotals[row.customer || "Unknown"] || 0) + lineTotal(row.sales_invoice_items); });
  const topCustomers = Object.entries(customerTotals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([customer, value]) => ({ customer, billed_value_tzs_k: value }));
  const unpaid = filteredInvoices.filter((row) => row.status !== "Paid");
  const now = Date.now();
  const aging = [
    { bucket: "Current", rows: unpaid.filter((row) => !row.due_date || new Date(row.due_date).getTime() >= now) },
    { bucket: "1–30 days", rows: unpaid.filter((row) => row.due_date && now - new Date(row.due_date).getTime() > 0 && now - new Date(row.due_date).getTime() <= 30 * 86400000) },
    { bucket: "31–60 days", rows: unpaid.filter((row) => row.due_date && now - new Date(row.due_date).getTime() > 30 * 86400000 && now - new Date(row.due_date).getTime() <= 60 * 86400000) },
    { bucket: "60+ days", rows: unpaid.filter((row) => row.due_date && now - new Date(row.due_date).getTime() > 60 * 86400000) },
  ].map(({ bucket, rows }) => ({ bucket, invoice_count: rows.length, amount_tzs_k: Math.round(rows.reduce((sum, row) => sum + lineTotal(row.sales_invoice_items) - (Number(row.amount_paid) || 0), 0) / 1000) }));
  const sections: ReportSection[] = [
    { title: "Executive KPIs", rows: [
      { metric: "Revenue Collected", value: `TZS ${Math.round(revenue / 1000)}k`, detail: `${filteredInvoices.length} invoices` },
      { metric: "Expenses", value: `TZS ${Math.round(expenseTotal / 1000)}k`, detail: `${filteredExpenses.length} expenses` },
      { metric: "Profit", value: `TZS ${Math.round((revenue - expenseTotal) / 1000)}k`, detail: "Collected − Expenses" },
      { metric: "Open Pipeline", value: `TZS ${Math.round(pipeline / 1000)}k`, detail: `${filteredLeads.length} leads` },
    ] },
    { title: "Revenue vs Expenses Trend", rows: [{ period: dateRange.start || "All available dates", revenue_tzs_k: Math.round(revenue / 1000), expenses_tzs_k: Math.round(expenseTotal / 1000), profit_tzs_k: Math.round((revenue - expenseTotal) / 1000) }] },
    { title: "Accounts Receivable Aging", rows: aging },
    { title: "CRM Pipeline by Stage", rows: pipelineByStage },
    { title: "Inventory Value by Category", rows: stockByCategory },
    { title: "Work Orders by Status", rows: workOrdersByStatus },
    { title: "Top Customers by Billed Value", rows: topCustomers },
  ];
  return {
    companyName: companyRows[0]?.name || "BusinessSphere ERP",
    currency: companyRows[0]?.currency || "TZS",
    filterSummary: `${Object.entries(modules).filter(([, enabled]) => enabled).map(([module]) => module).join(", ") || "Executive only"} · ${dateRange.start || "start"} → ${dateRange.end || "today"}`,
    sections: filterSections(sections, modules),
  };
}

async function sendViaConfiguredProvider({ to, subject, filename, content, contentType }: { to: string; subject: string; filename: string; content: Buffer; contentType: string }) {
  await sendTransactionalEmail({ to: [to], subject, text: "Your scheduled Smart Manager dashboard report is attached. It was generated from live tenant data using the filters saved with your schedule.", html: workspaceEmailHtml({ title: "Your scheduled dashboard report", preheader: "A Smart Manager report is attached", body: "Your scheduled Smart Manager dashboard report is attached. It was generated from live tenant data using the filters saved with your schedule." }), attachments: [{ filename, content, contentType }], category: "report" });
}

export async function runScheduledDashboardReport(taskUid: string) {
  const schedule = await getReportScheduleByTaskUid(taskUid);
  if (!schedule) return { ok: true as const, skipped: "orphan" as const };
  if (!schedule.isActive) return { ok: true as const, skipped: "paused" as const };
  if (!isTransactionalEmailDeliveryEnabled()) return { ok: true as const, skipped: "delivery-disabled" as const };
  const data = await buildScheduledReportData({ companyId: schedule.companyId, modules: schedule.modules as ReportModules, dateRange: schedule.dateRange as ReportDateRange });
  const periodLabel = schedule.dateRange && (schedule.dateRange as ReportDateRange).start ? `${(schedule.dateRange as ReportDateRange).start} → ${(schedule.dateRange as ReportDateRange).end || "today"}` : "Current period";
  const filename = `businesssphere-dashboard-${schedule.id}-${new Date().toISOString().slice(0, 10)}.${schedule.format}`;
  const bytes = schedule.format === "pdf"
    ? Buffer.from(createScheduledReportPdf({ companyName: data.companyName, periodLabel, filterSummary: data.filterSummary, sections: data.sections }))
    : Buffer.from(serializeReportSectionsToCsv(data.sections), "utf8");
  await sendViaConfiguredProvider({ to: schedule.recipientEmail, subject: `${data.companyName} dashboard report · ${periodLabel}`, filename, content: bytes, contentType: schedule.format === "pdf" ? "application/pdf" : "text/csv" });
  await markReportSent(schedule.id);
  return { ok: true as const, scheduleId: schedule.id, format: schedule.format };
}
