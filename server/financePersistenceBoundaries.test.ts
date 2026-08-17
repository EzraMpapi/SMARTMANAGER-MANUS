import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const finance = source.slice(source.indexOf("function Finance("), source.indexOf("function FinanceOverview("));
const expenses = source.slice(source.indexOf("function Expenses("), source.indexOf("/* --------------------------------- GENERAL LEDGER"));
const expenseForm = source.slice(source.indexOf("function ExpenseFormPanel("), source.indexOf("/* --------------------------------- GENERAL LEDGER"));

describe("Finance persistence boundaries", () => {
  it("waits for confirmed server responses before mutating configured invoice and expense UI state", () => {
    const paidMutationAt = finance.indexOf('await sb("sales_invoices").eq("id", inv.dbId).update');
    const paidStateAt = finance.indexOf('setAllInvoices((prev) => prev.map((item)');
    const expenseInsertAt = finance.indexOf('await sb("finance_expenses").insert');
    const expenseStateAt = finance.indexOf('setExpenses((prev) => [mapExpenseRow(header), ...prev]);');
    const expenseDeleteAt = finance.indexOf('await sb("finance_expenses").eq("id", exp.dbId ?? exp.id).delete');
    const expenseRemovalAt = finance.indexOf('setExpenses((prev) => prev.filter((item) => item.id !== id));');

    expect(paidMutationAt).toBeGreaterThan(-1);
    expect(paidStateAt).toBeGreaterThan(paidMutationAt);
    expect(expenseInsertAt).toBeGreaterThan(-1);
    expect(expenseStateAt).toBeGreaterThan(expenseInsertAt);
    expect(expenseDeleteAt).toBeGreaterThan(-1);
    expect(expenseRemovalAt).toBeGreaterThan(expenseDeleteAt);
    expect(finance).not.toContain("Expense recorded locally, but saving to the server failed.");
  });

  it("preserves the expense drawer and draft on failed mutations while preventing duplicate submissions", () => {
    expect(expenses).toContain('const created = await onAdd(form);');
    expect(expenses).toContain('if (created) setShowForm(false);');
    expect(expenses).toContain('const deleted = await onDelete(expense.id);');
    expect(expenses).toContain('if (deleted) onClose();');
    expect(expenseForm).toContain('const [submitting, setSubmitting] = useState(false);');
    expect(expenseForm).toContain('if (!valid || submitting) return;');
    expect(expenseForm).toContain('disabled={submitting}');
    expect(expenseForm).toContain('{submitting ? "Saving…" : "Save Expense"}');
  });

  it("derives cash-flow visualization and KPI context from confirmed financial records", () => {
    expect(finance).toContain('delta: `${allInvoices.length} confirmed invoices`');
    expect(finance).toContain('delta: `${expenses.length} confirmed expenses`');
    expect(finance).toContain('delta: "Confirmed record total"');
    expect(finance).toContain('<FinanceOverview invoices={allInvoices} expenses={expenses} posTransactions={posTransactionsHook.rows} />');
    expect(source).not.toContain("const CASHFLOW_TREND = [");
    expect(source).toContain("const cashflowTrend = useMemo(() => {");
    expect(source).toContain("buildLedger(invoices, expenses, posTransactions)");
    expect(source).toContain("No confirmed cash movement yet");
  });
});
