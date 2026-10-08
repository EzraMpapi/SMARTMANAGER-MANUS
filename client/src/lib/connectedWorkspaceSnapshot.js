export function resolveConnectedWorkspaceSnapshot({ date, invoices = [], expenses = [], crm = [], inventory = [], leaveRequests = [], workOrders = [], subscriptions = [], employees = [], posTransactions = [] } = {}) {
  const day = String(date || "").slice(0, 10);
  const rowsForDay = (rows, fields) => (Array.isArray(rows) ? rows : []).filter((row) => fields.some((field) => String(row?.[field] || "").slice(0, 10) === day));
  const dayInvoices = rowsForDay(invoices, ["date", "issueDate"]);
  const dayExpenses = rowsForDay(expenses, ["date", "expenseDate"]);
  const dayLeads = rowsForDay(crm, ["date", "createdAt", "createdDate"]);
  const dayWorkOrders = rowsForDay(workOrders, ["date", "startDate", "dueDate"]);
  const daySubscriptions = rowsForDay(subscriptions, ["startDate", "nextBillingDate"]);
  const dayPos = rowsForDay(posTransactions, ["date", "createdAt", "orderDate"]);
  const dayLeave = (Array.isArray(leaveRequests) ? leaveRequests : []).filter((row) => {
    const start = String(row?.startDate || "").slice(0, 10);
    const end = String(row?.endDate || start).slice(0, 10);
    return day && start && start <= day && end >= day;
  });
  const revenue = dayInvoices.reduce((sum, row) => {
    const lineTotal = (row.items || []).reduce((total, item) => total + Number(item?.qty || 0) * Number(item?.price || item?.unitPrice || 0), 0);
    const confirmedPaidAmount = Number(row?.amountPaid || 0);
    return sum + (row?.status === "Paid" ? (lineTotal || confirmedPaidAmount) : confirmedPaidAmount);
  }, 0);
  const expensesTotal = dayExpenses.reduce((sum, row) => sum + Number(row?.amount || 0), 0);
  const activity = [
    ...dayInvoices.map((row) => ({ id: `invoice-${row.id}`, module: "Sales", label: row.status === "Paid" ? `Invoice ${row.id} paid` : `Invoice ${row.id} issued`, detail: row.customer || "Confirmed invoice" })),
    ...dayExpenses.map((row) => ({ id: `expense-${row.id}`, module: "Finance", label: `Expense recorded${row.category ? ` — ${row.category}` : ""}`, detail: row.vendor || "Confirmed expense" })),
    ...dayLeads.map((row) => ({ id: `lead-${row.id}`, module: "CRM", label: `Lead activity${row.name ? ` — ${row.name}` : ""}`, detail: row.stage || "Confirmed opportunity" })),
    ...dayWorkOrders.map((row) => ({ id: `work-order-${row.id}`, module: "Operations", label: `Work order ${row.status || "updated"}`, detail: row.productName || row.id || "Confirmed work order" })),
    ...dayLeave.map((row) => ({ id: `leave-${row.id}`, module: "HR", label: `Leave ${String(row.status || "recorded").toLowerCase()}`, detail: row.employeeName || row.employee || "Confirmed leave record" })),
    ...dayPos.map((row) => ({ id: `pos-${row.id}`, module: "Point of Sale", label: "POS transaction recorded", detail: row.customer || row.reference || "Confirmed POS transaction" })),
  ];
  return { date: day, invoices: dayInvoices, expenses: dayExpenses, leads: dayLeads, workOrders: dayWorkOrders, subscriptions: daySubscriptions, leaveRequests: dayLeave, posTransactions: dayPos, revenue, expensesTotal, net: revenue - expensesTotal, totalRecords: dayInvoices.length + dayExpenses.length + dayLeads.length + dayWorkOrders.length + daySubscriptions.length + dayLeave.length + dayPos.length, activity };
}
