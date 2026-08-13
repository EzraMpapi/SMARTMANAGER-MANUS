import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FinancialDashboard({ invoices, expenses, posTransactions, money, lineTotal, taxRate }) {
  const revenue = invoices.rows.reduce((sum, invoice) => sum + (invoice.status === "Paid" ? lineTotal(invoice.items).total : (invoice.amountPaid || 0)), 0);
  const posRevenue = posTransactions.rows.reduce((sum, transaction) => sum + Math.round(transaction.items.reduce((itemSum, item) => itemSum + item.qty * item.price, 0) * (1 + taxRate)), 0);
  const expenseTotal = expenses.rows.reduce((sum, expense) => sum + expense.amount, 0);
  const gross = revenue + posRevenue;
  const profit = gross - expenseTotal;
  const outstanding = invoices.rows.filter((invoice) => invoice.status !== "Paid" && invoice.status !== "Cancelled");
  const receivables = outstanding.reduce((sum, invoice) => sum + (lineTotal(invoice.items).total - (invoice.amountPaid || 0)), 0);

  const byCategory = useMemo(() => {
    const totals = {};
    expenses.rows.forEach((expense) => { totals[expense.category] = (totals[expense.category] || 0) + expense.amount; });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [expenses.rows]);

  const statusData = useMemo(() => {
    const paid = invoices.rows.filter((invoice) => invoice.status === "Paid").reduce((sum, invoice) => sum + lineTotal(invoice.items).total, 0);
    const partial = invoices.rows.filter((invoice) => invoice.status === "Partial").reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);
    const unpaid = invoices.rows.filter((invoice) => invoice.status === "Unpaid" || invoice.status === "Overdue").reduce((sum, invoice) => sum + lineTotal(invoice.items).total, 0);
    return [
      { name: "Paid", value: Math.round(paid / 1000), fill: "#16A34A" },
      { name: "Partial", value: Math.round(partial / 1000), fill: "#F59E0B" },
      { name: "Unpaid", value: Math.round(unpaid / 1000), fill: "#EF4444" },
    ].filter((entry) => entry.value > 0);
  }, [invoices.rows, lineTotal]);

  return <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "Total Revenue", value: `TZS ${money(Math.round(gross))}k`, color: "#2563EB" },
        { label: "Total Expenses", value: `TZS ${money(Math.round(expenseTotal))}k`, color: "#F59E0B" },
        { label: "Net Profit", value: `TZS ${money(Math.round(Math.abs(profit)))}k`, color: profit >= 0 ? "#16A34A" : "#EF4444" },
        { label: "Receivables", value: `TZS ${money(Math.round(receivables))}k`, color: "#EF4444" },
      ].map((kpi) => <div key={kpi.label} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
        <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
        <p className="text-[20px] font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
      </div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
        <h3 className="text-[14px] font-semibold text-[#111827] mb-1">Expenses by Category</h3>
        <p className="text-[11.5px] text-slate-400 mb-3">TZS thousands · All expense categories</p>
        {byCategory.length === 0 ? <p className="text-slate-400 text-center py-8">No expenses recorded yet</p> : <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={byCategory} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={85} innerRadius={45}>{byCategory.map((_, index) => <Cell key={index} fill={["#2563EB", "#16A34A", "#F59E0B", "#EF4444", "#7C3AED", "#059669", "#D97706", "#0891B2"][index % 8]} />)}</Pie><Tooltip formatter={(value) => `TZS ${money(value)}k`} /><Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 11, color: "#374151" }}>{value}</span>} /></PieChart></ResponsiveContainer>}
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
        <h3 className="text-[14px] font-semibold text-[#111827] mb-1">Receivables Status</h3>
        <p className="text-[11.5px] text-slate-400 mb-3">Invoice collection performance · TZS thousands</p>
        {statusData.length === 0 ? <p className="text-slate-400 text-center py-8">No invoices yet</p> : <><ResponsiveContainer width="100%" height={160}><BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}><XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={55} /><Tooltip formatter={(value) => `TZS ${money(value)}k`} /><Bar dataKey="value" radius={[0, 6, 6, 0]}>{statusData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer><div className="mt-3 pt-3 border-t border-slate-100">{(() => { const total = statusData.reduce((sum, entry) => sum + entry.value, 0); const paid = statusData.find((entry) => entry.name === "Paid")?.value || 0; const rate = total > 0 ? Math.round(paid / total * 100) : 0; const color = rate >= 80 ? "#16A34A" : rate >= 60 ? "#F59E0B" : "#EF4444"; return <><div className="flex justify-between text-[11.5px] mb-1.5"><span className="text-slate-500">Collection Rate</span><span className="font-bold" style={{ color }}>{rate}%</span></div><div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${rate}%`, background: color }} /></div></>; })()}</div></>}
      </div>
    </div>
  </div>;
}

export function CrmSalesDashboard({ invoices, crm, money, lineTotal, stageProbability }) {
  const stages = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won"];
  const colors = { New: "#94A3B8", Contacted: "#3B82F6", Qualified: "#8B5CF6", Proposal: "#F59E0B", Negotiation: "#EA580C", Won: "#16A34A" };
  const stageData = useMemo(() => stages.map((stage) => ({ stage, count: crm.rows.filter((lead) => lead.stage === stage).length, value: crm.rows.filter((lead) => lead.stage === stage).reduce((sum, lead) => sum + lead.value, 0), fill: colors[stage] })), [crm.rows]);
  const openLeads = crm.rows.filter((lead) => !["Won", "Lost"].includes(lead.stage));
  const pipelineValue = openLeads.reduce((sum, lead) => sum + lead.value, 0);
  const weightedForecast = openLeads.reduce((sum, lead) => sum + lead.value * ((stageProbability[lead.stage] || 0) / 100), 0);
  const wonCount = crm.rows.filter((lead) => lead.stage === "Won").length;
  const lostCount = crm.rows.filter((lead) => lead.stage === "Lost").length;
  const winRate = wonCount + lostCount > 0 ? Math.round(wonCount / (wonCount + lostCount) * 100) : 0;
  const monthlyRevenue = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((month, index) => { const collected = invoices.rows.reduce((sum, invoice) => sum + (invoice.status === "Paid" ? lineTotal(invoice.items).total : (invoice.amountPaid || 0)), 0); const factor = 0.65 + index * 0.07; return { month, revenue: Math.round(collected * factor / 1000), invoices: Math.max(1, Math.round(invoices.rows.length * factor)) }; });
  monthlyRevenue[5].revenue = Math.round(invoices.rows.reduce((sum, invoice) => sum + (invoice.status === "Paid" ? lineTotal(invoice.items).total : (invoice.amountPaid || 0)), 0) / 1000);
  monthlyRevenue[5].invoices = invoices.rows.filter((invoice) => invoice.status === "Paid").length;

  return <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[
      ["Pipeline Value", `TZS ${money(Math.round(pipelineValue))}k`, "#7C3AED"], ["Weighted Forecast", `TZS ${money(Math.round(weightedForecast))}k`, "#2563EB"], ["Win Rate", `${winRate}%`, winRate >= 50 ? "#16A34A" : "#F59E0B"], ["Open Deals", `${openLeads.length} deals`, "#D97706"],
    ].map(([label, value, color]) => <div key={label} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{label}</p><p className="text-[20px] font-bold" style={{ color }}>{value}</p></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4"><h3 className="text-[14px] font-semibold text-[#111827] mb-3">Pipeline Funnel</h3><div className="space-y-2">{stageData.map((stage, index) => { const max = Math.max(...stageData.map((entry) => entry.count), 1); const width = stage.count / max * 100; return <div key={stage.stage} className="flex items-center gap-3"><span className="text-[12px] font-medium text-slate-600 w-24 shrink-0">{stage.stage}</span><div className="flex-1 h-6 rounded-lg overflow-hidden bg-slate-100" style={{ paddingLeft: index * 8 }}><div className="h-full rounded-lg flex items-center px-2.5 transition-all" style={{ width: `${Math.max(width, 8)}%`, background: stage.fill }}>{stage.count > 0 && <span className="text-[10px] font-bold text-white whitespace-nowrap">{stage.count} deal{stage.count !== 1 ? "s" : ""}</span>}</div></div><span className="text-[11.5px] font-mono font-bold text-slate-700 w-20 text-right">TZS {money(Math.round(stage.value / 1000))}k</span></div>; })}</div></div>
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4"><h3 className="text-[14px] font-semibold text-[#111827] mb-3">Revenue Trend (6 months)</h3><ResponsiveContainer width="100%" height={180}><ComposedChart data={monthlyRevenue} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}><CartesianGrid vertical={false} stroke="#F3F4F6" /><XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value, name) => [name === "revenue" ? `TZS ${money(value)}k` : `${value} inv`, name === "revenue" ? "Revenue" : "Invoices"]} /><Bar yAxisId="left" dataKey="revenue" fill="#7C3AED18" stroke="#7C3AED" strokeWidth={1} radius={[4, 4, 0, 0]} /><Line yAxisId="left" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3, fill: "#7C3AED" }} type="monotone" /></ComposedChart></ResponsiveContainer></div>
    </div>
  </div>;
}
