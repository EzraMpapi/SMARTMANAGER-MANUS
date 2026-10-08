import { ChevronDown, ChevronUp, LayoutDashboard } from "lucide-react";
import type { DashboardPreferences } from "../contexts/DashboardPreferencesContext";

type WidgetId = "revenue" | "salesMix" | "quickActions" | "products" | "cashFlow" | "businessHealth" | "activity" | "actionCenter";
type KpiId = "revenue" | "expenses" | "net-result" | "orders" | "receivables";
type BooleanPreferenceKey = "showRevenueOverview" | "showSalesMix" | "showQuickActions" | "showTopProducts" | "showCashFlow" | "showBusinessHealth" | "showActionCenter" | "showActivityTimeline";

type DashboardLayoutPreferences = Pick<DashboardPreferences, "showRevenueOverview" | "showSalesMix" | "showQuickActions" | "showTopProducts" | "showCashFlow" | "showBusinessHealth" | "showActionCenter" | "showActivityTimeline" | "widgetOrder" | "kpiCardIds" | "performanceWindow">;

interface DashboardLayoutControlsProps {
  preferences: DashboardLayoutPreferences;
  updatePreference: <K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => void;
}

const widgets: Array<{ id: WidgetId; label: string; detail: string; key: BooleanPreferenceKey }> = [
  { id: "revenue", label: "Revenue overview", detail: "Confirmed collection and expense trend", key: "showRevenueOverview" },
  { id: "salesMix", label: "Sales mix", detail: "Confirmed collection-status breakdown", key: "showSalesMix" },
  { id: "quickActions", label: "Quick actions", detail: "Role-authorized ERP workflows", key: "showQuickActions" },
  { id: "products", label: "Top products", detail: "Confirmed invoice line-item ranking", key: "showTopProducts" },
  { id: "cashFlow", label: "Cash flow overview", detail: "Recorded collections and operating expenses", key: "showCashFlow" },
  { id: "businessHealth", label: "Business health", detail: "Explainable operational signals", key: "showBusinessHealth" },
  { id: "activity", label: "Recent activity", detail: "Confirmed business events", key: "showActivityTimeline" },
  { id: "actionCenter", label: "Action center", detail: "Overdue, stock, and approval attention", key: "showActionCenter" },
];

const kpis: Array<{ id: KpiId; label: string }> = [
  { id: "revenue", label: "Revenue" },
  { id: "expenses", label: "Expenses" },
  { id: "net-result", label: "Operating result" },
  { id: "orders", label: "Orders & sales" },
  { id: "receivables", label: "Receivables" },
];

export function DashboardLayoutControls({ preferences, updatePreference }: DashboardLayoutControlsProps) {
  const moveWidget = (widgetId: WidgetId, direction: -1 | 1) => {
    const currentIndex = preferences.widgetOrder.indexOf(widgetId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= preferences.widgetOrder.length) return;
    const nextOrder = [...preferences.widgetOrder];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
    updatePreference("widgetOrder", nextOrder);
  };

  const toggleKpi = (kpiId: KpiId) => {
    const selected = preferences.kpiCardIds.includes(kpiId);
    if (selected && preferences.kpiCardIds.length === 1) return;
    updatePreference("kpiCardIds", selected ? preferences.kpiCardIds.filter((id) => id !== kpiId) : [...preferences.kpiCardIds, kpiId]);
  };

  return (
    <>
      <div className="space-y-3">
        <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Performance Range & KPI Cards</label>
        <div className="rounded-xl border border-white/10 bg-[#0B1120] p-4">
          <p className="text-[13px] font-semibold text-white">Default performance range</p>
          <p className="mt-1 text-[11px] text-[#94A3B8]">Applies to confirmed dashboard collections and expenses.</p>
          <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Default dashboard performance range">
            {[{ id: "30d", label: "30D" }, { id: "3m", label: "3M" }, { id: "6m", label: "6M" }, { id: "1y", label: "1Y" }].map((window) => <button key={window.id} type="button" aria-pressed={preferences.performanceWindow === window.id} onClick={() => updatePreference("performanceWindow", window.id as DashboardPreferences["performanceWindow"])} className={`min-h-10 rounded-lg border text-[11px] font-bold transition ${preferences.performanceWindow === window.id ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]" : "border-white/10 text-[#94A3B8] hover:border-white/25 hover:text-white"}`}>{window.label}</button>)}
          </div>
          <p className="mt-4 text-[13px] font-semibold text-white">Visible KPI cards</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {kpis.map((kpi) => { const selected = preferences.kpiCardIds.includes(kpi.id); const onlySelected = selected && preferences.kpiCardIds.length === 1; return <button key={kpi.id} type="button" aria-pressed={selected} disabled={onlySelected} onClick={() => toggleKpi(kpi.id)} className={`min-h-10 rounded-lg border px-2 text-left text-[10.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${selected ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]" : "border-white/10 text-[#94A3B8] hover:border-white/25 hover:text-white"}`}>{kpi.label}</button>; })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Panel Visibility & Order</label>
        <div className="space-y-2 rounded-xl border border-white/10 bg-[#0B1120] p-3">
          {preferences.widgetOrder.map((widgetId, index) => {
            const widget = widgets.find((item) => item.id === widgetId);
            if (!widget) return null;
            const visible = preferences[widget.key];
            return <div key={widget.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.025] p-2.5"><LayoutDashboard size={14} className="shrink-0 text-[#C9A96E]" /><button type="button" aria-pressed={visible} onClick={() => updatePreference(widget.key, !visible)} className="min-h-9 min-w-0 flex-1 text-left"><span className="block text-[11.5px] font-semibold text-white">{widget.label}</span><span className="block truncate text-[9.5px] text-[#94A3B8]">{widget.detail}</span></button><div className="flex shrink-0 gap-1"><button type="button" aria-label={`Move ${widget.label} up`} disabled={index === 0} onClick={() => moveWidget(widget.id, -1)} className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-[#94A3B8] hover:text-white disabled:opacity-35"><ChevronUp size={14} /></button><button type="button" aria-label={`Move ${widget.label} down`} disabled={index === preferences.widgetOrder.length - 1} onClick={() => moveWidget(widget.id, 1)} className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-[#94A3B8] hover:text-white disabled:opacity-35"><ChevronDown size={14} /></button></div><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${visible ? "bg-emerald-400" : "bg-slate-600"}`} /></div>;
          })}
        </div>
      </div>
    </>
  );
}
