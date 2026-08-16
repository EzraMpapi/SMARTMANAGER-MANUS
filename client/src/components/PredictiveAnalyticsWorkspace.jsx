import React, { useMemo, useState } from "react";
import { AlertCircle, ClipboardList, Factory, Package, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";

export function PredictiveAnalyticsWorkspace({ invoices, expenses, inventory, employees, leaveRequests, runtime }) {
  const {
    useCompanyTable, projectsSeed, projectExpensesSeed, machinesSeed, maintenanceSeed,
    mapProjectRow, mapProjectExpenseRow, mapMachineRow, mapMaintenanceRow,
    today, lineTotal, money, detectUnusualExpenses, poApprovalThreshold,
  } = runtime;
  const expenseRows = expenses.rows || expenses || [];
  const projects = useCompanyTable("projects", projectsSeed, { mapRow: mapProjectRow });
  const projectExpenses = useCompanyTable("project_expenses", projectExpensesSeed, { mapRow: mapProjectExpenseRow });
  const machines = useCompanyTable("manufacturing_machines", machinesSeed, { mapRow: mapMachineRow });
  const maintenance = useCompanyTable("manufacturing_maintenance", maintenanceSeed, { mapRow: mapMaintenanceRow });

  const cashProjection = useMemo(() => {
    const weeklyExpenseRate = expenseRows.filter((expense) => (today - new Date(expense.date)) / 86400000 <= 56).reduce((sum, expense) => sum + expense.amount, 0) / 8;
    const currentCash = invoices.rows.reduce((sum, invoice) => sum + (invoice.status === "Paid" ? lineTotal(invoice.items).total : (invoice.amountPaid || 0)), 0) - expenseRows.reduce((sum, expense) => sum + expense.amount, 0);
    let running = currentCash;
    const weeks = Array.from({ length: 8 }, (_, index) => {
      const week = index + 1;
      const weekStart = new Date(today.getTime() + index * 7 * 86400000);
      const weekEnd = new Date(today.getTime() + week * 7 * 86400000);
      const incoming = invoices.rows.filter((invoice) => invoice.status !== "Paid" && new Date(invoice.dueDate) >= weekStart && new Date(invoice.dueDate) < weekEnd).reduce((sum, invoice) => sum + (lineTotal(invoice.items).total - (invoice.amountPaid || 0)), 0);
      running += incoming - weeklyExpenseRate;
      return { week, balance: running };
    });
    return { weeklyExpenseRate, shortageWeek: weeks.find((week) => week.balance < 0) };
  }, [expenseRows, invoices.rows, lineTotal, today]);

  const stockDepletion = useMemo(() => {
    const salesBySku = {};
    invoices.rows.filter((invoice) => (today - new Date(invoice.date)) / 86400000 <= 60).forEach((invoice) => invoice.items.forEach((item) => { if (item.sku) salesBySku[item.sku] = (salesBySku[item.sku] || 0) + item.qty; }));
    return inventory.rows.map((item) => {
      const dailyRate = (salesBySku[item.sku] || 0) / 60;
      return { sku: item.sku, name: item.name, daysLeft: dailyRate > 0 ? Math.round(item.qty / dailyRate) : null };
    }).filter((item) => item.daysLeft !== null && item.daysLeft <= 21).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [inventory.rows, invoices.rows, today]);

  const churnRisk = useMemo(() => {
    const byCustomer = {};
    invoices.rows.forEach((invoice) => { (byCustomer[invoice.customer] = byCustomer[invoice.customer] || []).push(new Date(invoice.date)); });
    return Object.entries(byCustomer).filter(([, dates]) => dates.length >= 2).map(([customer, dates]) => {
      dates.sort((a, b) => a - b);
      const intervals = dates.slice(1).map((date, index) => (date - dates[index]) / 86400000);
      const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
      const daysSinceLast = (today - dates[dates.length - 1]) / 86400000;
      return { customer, average: Math.round(average), daysSinceLast: Math.round(daysSinceLast), ratio: average > 0 ? daysSinceLast / average : 0 };
    }).filter((customer) => customer.ratio >= 2).sort((a, b) => b.ratio - a.ratio);
  }, [invoices.rows, today]);

  const turnoverRisk = useMemo(() => employees.rows.filter((employee) => employee.status === "Active").map((employee) => {
    const tenureDays = employee.hireDate ? (today - new Date(employee.hireDate)) / 86400000 : null;
    const recentLeave = leaveRequests.rows.filter((leave) => leave.employee === employee.name && (today - new Date(leave.startDate)) / 86400000 <= 90).length;
    const flags = [];
    if (tenureDays !== null && tenureDays < 90) flags.push("New hire (under 90 days)");
    if (recentLeave >= 3) flags.push(`${recentLeave} leave requests in the last 90 days`);
    return { name: employee.name, department: employee.department, flags };
  }).filter((employee) => employee.flags.length > 0), [employees.rows, leaveRequests.rows, today]);

  const salesGrowth = useMemo(() => {
    const byMonth = {};
    invoices.rows.forEach((invoice) => { const month = invoice.date.slice(0, 7); byMonth[month] = (byMonth[month] || 0) + (invoice.status === "Paid" ? lineTotal(invoice.items).total : (invoice.amountPaid || 0)); });
    const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
    if (months.length < 2) return { growthRate: null, nextMonthProjection: null };
    const values = months.map(([, value]) => value);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const indices = values.map((_, index) => index);
    const meanIndex = indices.reduce((sum, value) => sum + value, 0) / indices.length;
    const slope = indices.reduce((sum, index, position) => sum + (index - meanIndex) * (values[position] - mean), 0) / (indices.reduce((sum, index) => sum + (index - meanIndex) ** 2, 0) || 1);
    return { growthRate: mean > 0 ? Math.round((slope / mean) * 1000) / 10 : 0, nextMonthProjection: mean + slope * (values.length - meanIndex) };
  }, [invoices.rows, lineTotal]);

  const budgetOverruns = useMemo(() => projects.rows.filter((project) => project.status !== "Completed" && project.status !== "Cancelled" && project.budget > 0).map((project) => {
    const spent = projectExpenses.rows.filter((expense) => expense.projectId === project.id).reduce((sum, expense) => sum + expense.amount, 0);
    const start = new Date(project.startDate);
    const end = project.endDate ? new Date(project.endDate) : null;
    const elapsed = Math.max(1, (today - start) / 86400000);
    const total = end ? Math.max(elapsed, (end - start) / 86400000) : elapsed * 2;
    const projectedTotal = spent * (total / elapsed);
    return { name: project.name, overrunPct: Math.round(((projectedTotal - project.budget) / project.budget) * 100) };
  }).filter((project) => project.overrunPct > 5).sort((a, b) => b.overrunPct - a.overrunPct), [projectExpenses.rows, projects.rows, today]);

  const fraudRisk = useMemo(() => ({
    unusual: detectUnusualExpenses(expenseRows),
    structuring: expenseRows.filter((expense) => expense.amount >= poApprovalThreshold * 0.9 && expense.amount < poApprovalThreshold),
  }), [detectUnusualExpenses, expenseRows, poApprovalThreshold]);

  const maintenanceNeeds = useMemo(() => machines.rows.map((machine) => {
    const record = maintenance.rows.filter((item) => item.machine === machine.name).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (!record?.nextDueDate) return null;
    return { machine: machine.name, daysUntil: Math.round((new Date(record.nextDueDate) - today) / 86400000) };
  }).filter((machine) => machine && machine.daysUntil <= 21), [machines.rows, maintenance.rows, today]);

  return <div className="space-y-5">
    <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-lg p-3"><Sparkles size={15} className="text-slate-400 shrink-0 mt-0.5" /><p className="text-[12px] text-slate-500 leading-relaxed">These projections use this company’s current records and transparent rule-based calculations. They are operational decision support, not unexplained confidence scores.</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <InsightCard icon={Wallet} title="Cash Shortage Projection" accent="text-[#EF4444]" detail={`8-week outlook at TZS ${money(Math.round(cashProjection.weeklyExpenseRate))}k/week`} empty="No shortfall projected in the next 8 weeks at current rates.">{cashProjection.shortageWeek && <p className="text-[12.5px] font-medium text-[#EF4444]">Projected shortfall in week {cashProjection.shortageWeek.week} — balance TZS {money(Math.round(cashProjection.shortageWeek.balance))}k</p>}</InsightCard>
      <InsightCard icon={Package} title="Stock Depletion Forecast" accent="text-[#F59E0B]" detail="Real 60-day sales velocity per SKU" empty="Nothing projected to run out within 21 days.">{stockDepletion.slice(0, 4).map((item) => <Row key={item.sku} label={item.name} value={`${item.daysLeft}d left`} accent="text-[#F59E0B]" />)}</InsightCard>
      <InsightCard icon={Users} title="Customer Churn Risk" accent="text-[#F59E0B]" detail="Each customer is evaluated against their own ordering rhythm" empty="No customers are behind their normal pace.">{churnRisk.slice(0, 4).map((customer) => <Row key={customer.customer} label={customer.customer} value={`${customer.daysSinceLast}d (avg ${customer.average}d)`} accent="text-[#F59E0B]" />)}</InsightCard>
      <InsightCard icon={Users} title="Employee Turnover Risk" accent="text-[#5B6472]" detail="Uses tenure and leave-frequency signals only" empty="No employees match the available risk signals.">{turnoverRisk.slice(0, 3).map((employee) => <div key={employee.name} className="text-[12px]"><span className="font-medium text-[#111827]">{employee.name}</span><span className="text-slate-400"> · {employee.department}</span><p className="text-slate-500 mt-0.5">{employee.flags[0]}</p></div>)}</InsightCard>
      <InsightCard icon={TrendingUp} title="Sales Growth Projection" accent="text-[#16A34A]" detail="Real linear trend across monthly revenue" empty="Not enough monthly revenue history for a trend line.">{salesGrowth.growthRate !== null && <><p className={`text-[16px] font-mono font-bold ${salesGrowth.growthRate >= 0 ? "text-[#16A34A]" : "text-[#EF4444]"}`}>{salesGrowth.growthRate >= 0 ? "+" : ""}{salesGrowth.growthRate}%/month</p><p className="text-[11.5px] text-slate-500 mt-1">Next month: TZS {money(Math.round(Math.max(0, salesGrowth.nextMonthProjection)))}k</p></>}</InsightCard>
      <InsightCard icon={ClipboardList} title="Budget Overrun Risk" accent="text-[#0EA5E9]" detail="Project burn rate extended over each project timeline" empty="No active projects are trending over budget by more than 5%.">{budgetOverruns.slice(0, 4).map((project) => <Row key={project.name} label={project.name} value={`+${project.overrunPct}%`} accent="text-[#0EA5E9]" />)}</InsightCard>
      <InsightCard icon={AlertCircle} title="Fraud Risk Indicators" accent="text-[#EF4444]" detail="Unusual expenses and approval-threshold structuring" empty="No unusual or structuring patterns detected.">{fraudRisk.unusual.slice(0, 2).map((expense) => <p key={expense.id} className="text-[12px] text-slate-600">{expense.vendor} — {expense.multiple}× {expense.category} average</p>)}{fraudRisk.structuring.slice(0, 2).map((expense) => <p key={expense.id} className="text-[12px] text-slate-600">{expense.vendor} — TZS {money(expense.amount)}k near the approval threshold</p>)}</InsightCard>
      <InsightCard icon={Factory} title="Maintenance Needs" accent="text-[#5B6472]" detail="Logged machine next-due dates" empty="No machines are due for maintenance within 21 days.">{maintenanceNeeds.map((machine) => <Row key={machine.machine} label={machine.machine} value={machine.daysUntil < 0 ? `${-machine.daysUntil}d overdue` : `${machine.daysUntil}d`} accent={machine.daysUntil < 0 ? "text-[#EF4444]" : "text-[#F59E0B]"} />)}</InsightCard>
    </div>
    <ScenarioPlanner invoices={invoices} expenseRows={expenseRows} employees={employees} runtime={runtime} />
  </div>;
}

function InsightCard({ icon: Icon, title, accent, detail, empty, children }) {
  const hasContent = React.Children.count(children) > 0;
  return <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5"><h3 className="text-[13.5px] font-semibold text-[#111827] mb-1 flex items-center gap-1.5"><Icon size={14} className={accent} />{title}</h3><p className="text-[11px] text-slate-400 mb-3">{detail}</p>{hasContent ? <div className="space-y-1.5">{children}</div> : <p className="text-[12.5px] text-slate-400 py-2">{empty}</p>}</div>;
}

function Row({ label, value, accent }) { return <div className="flex items-center justify-between text-[12.5px]"><span className="text-slate-600 truncate">{label}</span><span className={`font-mono font-medium shrink-0 ml-2 ${accent}`}>{value}</span></div>; }

function ScenarioPlanner({ invoices, expenseRows, employees, runtime }) {
  const { computePnLFigures, inputClass, money } = runtime;
  const [scenario, setScenario] = useState("price");
  const [priceChangePct, setPriceChangePct] = useState(10);
  const [newHires, setNewHires] = useState(1);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseCutPct, setExpenseCutPct] = useState(10);
  const baseline = useMemo(() => {
    const pnl = computePnLFigures(invoices, expenseRows);
    const activeEmployees = employees.rows.filter((employee) => employee.status === "Active");
    const averageSalary = activeEmployees.length ? activeEmployees.reduce((sum, employee) => sum + employee.salary, 0) / activeEmployees.length : 0;
    return { pnl, averageSalary, activeEmployees, categories: [...new Set(expenseRows.map((expense) => expense.category))] };
  }, [computePnLFigures, employees.rows, expenseRows, invoices]);
  const selectedCategory = expenseCategory || baseline.categories[0] || "";
  const result = useMemo(() => {
    if (scenario === "price") { const revenue = baseline.pnl.collected * (1 + priceChangePct / 100); return { lines: [["Current monthly revenue", baseline.pnl.collected], [`Projected revenue at ${priceChangePct >= 0 ? "+" : ""}${priceChangePct}%`, revenue, true], ["Expenses (unchanged)", -baseline.pnl.expTotal], ["Projected net position", revenue - baseline.pnl.expTotal, false, true]], caveat: "Assumes volume stays constant; actual customer demand can differ." }; }
    if (scenario === "hiring") { const addedCost = baseline.averageSalary * newHires; return { lines: [["Current average salary", baseline.averageSalary], [`Added monthly payroll for ${newHires} hire${newHires === 1 ? "" : "s"}`, addedCost, true], ["Projected net position", baseline.pnl.net - addedCost, false, true]], caveat: "Uses current active-employee salary records." }; }
    const currentSpend = expenseRows.filter((expense) => expense.category === selectedCategory).reduce((sum, expense) => sum + expense.amount, 0); const savings = currentSpend * (expenseCutPct / 100); return { lines: [[`Current spend on ${selectedCategory || "—"}`, currentSpend], [`Reduction at ${expenseCutPct}%`, savings, true], ["Projected net position", baseline.pnl.net + savings, false, true]], caveat: "A cost reduction can have operational effects beyond this arithmetic." };
  }, [baseline, expenseCutPct, expenseRows, newHires, priceChangePct, scenario, selectedCategory]);
  return <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5"><h3 className="text-[14.5px] font-semibold text-[#111827] mb-1 flex items-center gap-1.5"><Sparkles size={15} className="text-[#16A34A]" />Scenario Planner — What If</h3><p className="text-[12px] text-slate-500 mb-4">Test transparent arithmetic on your current operational data before deciding.</p><div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit max-w-full overflow-x-auto mb-4">{[["price", "Price Change"], ["hiring", "New Hire"], ["expense", "Cut an Expense"]].map(([id, label]) => <button key={id} onClick={() => setScenario(id)} className={`text-[12px] font-medium px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${scenario === id ? "bg-white text-[#111827] shadow-sm" : "text-slate-500"}`}>{label}</button>)}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-5"><div>{scenario === "price" && <Field label="Price change (%)"><input type="number" step="1" value={priceChangePct} onChange={(event) => setPriceChangePct(Number(event.target.value) || 0)} className={inputClass} /></Field>}{scenario === "hiring" && <Field label="Number of new hires"><input type="number" min="1" step="1" value={newHires} onChange={(event) => setNewHires(Math.max(1, Number(event.target.value) || 1))} className={inputClass} /></Field>}{scenario === "expense" && <div className="space-y-3"><Field label="Expense category"><select value={selectedCategory} onChange={(event) => setExpenseCategory(event.target.value)} className={inputClass}>{baseline.categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field><Field label="Reduction (%)"><input type="number" min="0" max="100" step="5" value={expenseCutPct} onChange={(event) => setExpenseCutPct(Number(event.target.value) || 0)} className={inputClass} /></Field></div>}</div><div className="bg-slate-50 rounded-lg p-3.5"><div className="space-y-1.5">{result.lines.map(([label, value, highlight, bold]) => <div key={label} className={`flex justify-between text-[12.5px] ${bold ? "font-semibold text-[#111827] pt-1.5 border-t border-slate-200" : highlight ? "font-medium text-[#16A34A]" : "text-slate-600"}`}><span>{label}</span><span className="font-mono">TZS {money(Math.round(value))}k</span></div>)}</div><p className="text-[10.5px] text-slate-400 mt-3 pt-3 border-t border-slate-100">{result.caveat}</p></div></div></div>;
}

function Field({ label, children }) { return <label className="text-[12px] font-medium text-slate-600 block mb-1.5">{label}{children}</label>; }
