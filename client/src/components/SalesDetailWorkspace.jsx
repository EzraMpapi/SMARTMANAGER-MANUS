import { BarChart3, Clock3, Layers3 } from "lucide-react";

export function SalesDetailWorkspace({ subscriptions }) {
  const rows = subscriptions?.rows || [];
  const active = rows.filter((subscription) => subscription.status === "Active");
  const monthlyRecurringRevenue = active.reduce((sum, subscription) => {
    const months = { Monthly: 1, Quarterly: 3, Annual: 12 }[subscription.cycle] || 1;
    return sum + Number(subscription.amount || 0) / months;
  }, 0);
  return <section className="rounded-xl border border-[#16A34A]/20 bg-[#F0FDF4]/60 p-4" aria-label="Sales detail workspace">
    <div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#16A34A] shadow-sm"><BarChart3 size={16} /></div><div className="min-w-0"><h3 className="text-[13.5px] font-semibold text-[#111827]">Subscription detail workspace</h3><p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">This detail view loads only when Sales subscriptions are opened, helping the main workspace start faster while your records remain unchanged.</p></div></div>
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-lg bg-white/80 p-2.5"><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Active plans</p><p className="mt-1 text-[17px] font-bold text-[#15803D]">{active.length}</p></div><div className="rounded-lg bg-white/80 p-2.5"><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Monthly run rate</p><p className="mt-1 text-[14px] font-bold text-[#2563EB]">TZS {Math.round(monthlyRecurringRevenue).toLocaleString()}k</p></div><div className="hidden rounded-lg bg-white/80 p-2.5 sm:block"><p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400"><Clock3 size={10} /> Load strategy</p><p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-[#15803D]"><Layers3 size={12} /> On demand</p></div></div>
  </section>;
}
