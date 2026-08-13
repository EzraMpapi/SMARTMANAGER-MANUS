import { useState } from "react";
import { AlertCircle, Banknote, CheckCircle2, CircleDollarSign, ClipboardCheck, Building2, FileText } from "lucide-react";

const PROCUREMENT_TABS = [
  { id: "orders", label: "Purchase Orders", icon: ClipboardCheck },
  { id: "approvals", label: "Approvals", icon: CheckCircle2 },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "payments", label: "Vendor Payments", icon: Banknote },
  { id: "portal", label: "Supplier Portal", icon: Building2 },
];

export function ProcurementWorkspace({ inventory, suppliersHook, expensesHook, currentUser, canManage, orders, contracts, money, poTotal, KpiCardComponent, PurchaseOrdersComponent, ApprovalsComponent, ProcurementContractsComponent, VendorPaymentsComponent, SupplierPortalComponent }) {
  const [tab, setTab] = useState("orders");
  const pendingApproval = orders.rows.filter((order) => order.status === "Pending Approval");
  const readyToPay = orders.rows.filter((order) => order.status === "Received");
  const totalCommitted = orders.rows.filter((order) => !["Draft", "Cancelled"].includes(order.status)).reduce((sum, order) => sum + poTotal(order.items), 0);
  const kpis = [
    { label: "Open Purchase Orders", value: String(orders.rows.filter((order) => !["Paid", "Cancelled"].includes(order.status)).length), delta: `${orders.rows.length} total`, up: true, icon: ClipboardCheck },
    { label: "Pending Approval", value: String(pendingApproval.length), delta: "Needs sign-off", up: false, icon: AlertCircle },
    { label: "Committed Spend", value: `TZS ${money(Math.round(totalCommitted))}k`, delta: "Active POs", up: true, icon: CircleDollarSign },
    { label: "Awaiting Payment", value: String(readyToPay.length), delta: "Received, unpaid", up: false, icon: Banknote },
  ];

  return <div className="space-y-5">
    <div><h1 className="text-[20px] sm:text-[22px] font-semibold text-[#111827] tracking-tight">Procurement</h1><p className="text-[13px] text-slate-500 mt-1">Purchase orders, approvals, contracts, and vendor payments</p></div>
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto w-fit max-w-full">{PROCUREMENT_TABS.map((item) => { const Icon = item.icon; const active = tab === item.id; const badge = item.id === "approvals" && pendingApproval.length > 0 ? pendingApproval.length : null; return <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`text-[12px] font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${active ? "bg-white text-[#111827] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Icon size={13} /> {item.label}{badge && <span className="text-[10px] font-semibold bg-[#F59E0B] text-white rounded-full w-4 h-4 flex items-center justify-center">{badge}</span>}</button>; })}</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{kpis.map((item) => <KpiCardComponent key={item.label} item={item} />)}</div>
    {tab === "orders" && <PurchaseOrdersComponent orders={orders} inventory={inventory} suppliersHook={suppliersHook} />}
    {tab === "approvals" && <ApprovalsComponent orders={orders} canManage={canManage} currentUser={currentUser} />}
    {tab === "contracts" && <ProcurementContractsComponent contracts={contracts} suppliersHook={suppliersHook} />}
    {tab === "payments" && <VendorPaymentsComponent orders={orders} expensesHook={expensesHook} />}
    {tab === "portal" && <SupplierPortalComponent suppliersHook={suppliersHook} orders={orders} />}
  </div>;
}
