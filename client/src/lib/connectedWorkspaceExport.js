function safeCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function recordRows(snapshot = {}) {
  const rows = [];
  const add = (module, records, fields) => {
    (Array.isArray(records) ? records : []).forEach((record) => {
      rows.push([
        fields.date(record),
        module,
        fields.id(record),
        fields.status(record),
        fields.description(record),
        fields.amount(record),
      ]);
    });
  };
  const amountPaid = (record) => Number(record?.amountPaid || 0);
  const lineTotal = (record) => (record?.items || []).reduce((sum, item) => sum + Number(item?.qty || 0) * Number(item?.price || item?.unitPrice || 0), 0);
  const common = {
    date: (record) => record?.date || record?.issueDate || record?.createdAt || "",
    id: (record) => record?.id || record?.reference || "",
    status: (record) => record?.status || "Confirmed",
    description: (record) => record?.customer || record?.name || record?.vendor || record?.category || "Confirmed workspace record",
    amount: () => "",
  };
  add("Sales", snapshot.invoices, { ...common, amount: (record) => lineTotal(record) || amountPaid(record) });
  add("Finance", snapshot.expenses, { ...common, date: (record) => record?.date || record?.expenseDate || "", amount: (record) => Number(record?.amount || 0) });
  add("CRM", snapshot.leads, { ...common, date: (record) => record?.date || record?.createdAt || record?.createdDate || "", description: (record) => record?.name || record?.company || "Confirmed opportunity" });
  add("Operations", snapshot.workOrders, { ...common, date: (record) => record?.date || record?.startDate || record?.dueDate || "", description: (record) => record?.productName || record?.title || "Confirmed work order" });
  add("Subscriptions", snapshot.subscriptions, { ...common, date: (record) => record?.startDate || record?.nextBillingDate || "", description: (record) => record?.name || record?.customer || "Confirmed subscription" });
  add("HR", snapshot.leaveRequests, { ...common, date: (record) => record?.startDate || "", description: (record) => record?.employeeName || record?.employee || "Confirmed leave record" });
  add("Point of Sale", snapshot.posTransactions, { ...common, date: (record) => record?.date || record?.createdAt || record?.orderDate || "", description: (record) => record?.customer || record?.reference || "Confirmed POS transaction" });
  return rows;
}

export function buildConnectedWorkspaceCsv(snapshot = {}) {
  const header = ["Date", "Module", "Record ID", "Status", "Description", "Amount"];
  const summary = [
    [snapshot.date || "", "Summary", "", "Confirmed", "Total revenue", snapshot.revenue || 0],
    [snapshot.date || "", "Summary", "", "Confirmed", "Total expenses", snapshot.expensesTotal || 0],
    [snapshot.date || "", "Summary", "", "Confirmed", "Net movement", snapshot.net || 0],
  ];
  return [header, ...summary, ...recordRows(snapshot)].map((row) => row.map(safeCell).join(",")).join("\r\n");
}

export function connectedWorkspaceExportFilename(date) {
  const safeDate = String(date || "selected-date").slice(0, 10);
  return `smart-manager-workspace-records-${safeDate}.csv`;
}
