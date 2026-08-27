import React, { useRef, useState } from "react";
import { Sliders, X, Check, RotateCcw, DollarSign, Sparkles, Send, Loader2, Globe, Clock, Search, CalendarDays, Compass, Download, Upload, AlertCircle } from "lucide-react";
import { useDashboardPreferences, type DashboardPreferences } from "../contexts/DashboardPreferencesContext";
import { trpc } from "../lib/trpc";
import { DashboardLayoutControls } from "./DashboardLayoutControls";
import { importDashboardLayout, serializeDashboardLayout } from "../lib/dashboardLayoutTransfer";
import { TeamDashboardPresetManager } from "./TeamDashboardPresetManager";

interface DashboardPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  availableNavigationGroups?: Array<{ id: string; label: string; shortLabel?: string; itemCount?: number }>;
  canManageTeamPresets?: boolean;
}

const topBarControls = [
  { key: "showTopBarSearch", label: "Workspace search", detail: "Show the expanded command search on wide screens", icon: Search },
  { key: "showGuidedTour", label: "Guided tour", detail: "Keep the context-aware tour entry in the command bar", icon: Compass },
  { key: "showConnectionStatus", label: "Connection status", detail: "Show Live, Demo, or offline status when space allows", icon: Globe },
  { key: "showTopBarDate", label: "Current date", detail: "Show the local business date on extra-wide screens", icon: CalendarDays },
] as const;

export function DashboardPreferencesDrawer({ isOpen, onClose, availableNavigationGroups = [], canManageTeamPresets = false }: DashboardPreferencesDrawerProps) {
  const { preferences, updatePreference, replacePreferences, resetPreferences, resetToTeamDefault, isPersisting, persistenceError } = useDashboardPreferences();
  const [activeTab, setActiveTab] = useState<"settings" | "ai">("settings");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transferMessage, setTransferMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ preferences: Pick<typeof preferences, "compactDensity" | "showKpiBanner" | "showActivityTimeline" | "showPendingApprovals" | "accentColor" | "currency" | "timezone" | "fxRateOverride" | "departmentBudgets">; explanation: string } | null>(null);

  const configureAiMutation = trpc.ai.configurePreferences.useMutation({
    onSuccess: (data) => {
      setAiLoading(false);
      setAiResult({
        preferences: {
          compactDensity: data.preferences.density === "compact",
          showKpiBanner: data.preferences.showMetricsStrip,
          showActivityTimeline: data.preferences.showActivityFeed,
          showPendingApprovals: data.preferences.showQuickActions,
          accentColor: preferences.accentColor,
          currency: data.preferences.currency,
          timezone: preferences.timezone,
          fxRateOverride: preferences.fxRateOverride,
          departmentBudgets: preferences.departmentBudgets,
        },
        explanation: data.explanation,
      });
    },
    onError: () => {
      setAiLoading(false);
    },
  });

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoal.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult(null);
    configureAiMutation.mutate({
      goal: aiGoal.trim(),
      current: {
        theme: "dark",
        language: "en",
        currency: preferences.currency,
        density: preferences.compactDensity ? "compact" : "comfortable",
        showMetricsStrip: preferences.showKpiBanner,
        showActivityFeed: preferences.showActivityTimeline,
        showQuickActions: preferences.showPendingApprovals,
        showSmartAlerts: true,
      },
    });
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    updatePreference("currency", aiResult.preferences.currency);
    updatePreference("compactDensity", aiResult.preferences.compactDensity);
    updatePreference("showKpiBanner", aiResult.preferences.showKpiBanner);
    updatePreference("showActivityTimeline", aiResult.preferences.showActivityTimeline);
    updatePreference("showPendingApprovals", aiResult.preferences.showPendingApprovals);
    setActiveTab("settings");
  };

  const handleExport = () => {
    const blob = new Blob([serializeDashboardLayout(preferences)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "smart-manager-dashboard-layout.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setTransferMessage({ type: "success", text: "Dashboard layout exported. It contains presentation settings only." });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const layout = importDashboardLayout(
        await file.text(),
        preferences,
        availableNavigationGroups.length ? availableNavigationGroups.map((group) => group.id) : undefined,
      );
      replacePreferences(layout);
      setTransferMessage({ type: "success", text: "Dashboard layout imported and filtered to this workspace’s authorized options." });
    } catch (error) {
      setTransferMessage({ type: "error", text: error instanceof Error ? error.message : "This dashboard layout could not be imported." });
    }
  };

  const toggleNavigationGroup = (groupId: DashboardPreferences["visibleNavigationGroupIds"][number]) => {
    if (groupId === "home") return;
    const isVisible = preferences.visibleNavigationGroupIds.includes(groupId);
    const nextGroups = isVisible
      ? preferences.visibleNavigationGroupIds.filter((id) => id !== groupId)
      : [...preferences.visibleNavigationGroupIds, groupId];
    updatePreference("visibleNavigationGroupIds", nextGroups);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#131C31] border-l border-white/10 p-6 text-white shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C9A96E]/10 text-[#C9A96E]">
                <Sliders size={18} />
              </span>
              <div>
                <h3 className="text-[16px] font-bold font-heading">Dashboard Preferences</h3>
                <p className="text-[12px] text-[#94A3B8]">Customize layout, timezone & FX overrides</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex rounded-xl bg-[#0B1120] p-1 border border-white/10">
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 rounded-lg py-2 text-[12.5px] font-bold transition-all ${
                activeTab === "settings"
                  ? "bg-[#C9A96E] text-[#0B1120] shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Manual Settings
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-bold transition-all ${
                activeTab === "ai"
                  ? "bg-[#C9A96E] text-[#0B1120] shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <Sparkles size={14} /> AI Assistant
            </button>
          </div>

          {activeTab === "settings" ? (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Executive Currency & FX Override</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updatePreference("currency", "TZS")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-[13px] font-bold transition-all ${
                      preferences.currency === "TZS"
                        ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]"
                        : "border-white/10 bg-[#0B1120] text-[#94A3B8] hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <span>TZS</span>
                    <span className="text-[11px] opacity-70">Tanzanian Shilling</span>
                  </button>
                  <button
                    onClick={() => updatePreference("currency", "USD")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-[13px] font-bold transition-all ${
                      preferences.currency === "USD"
                        ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]"
                        : "border-white/10 bg-[#0B1120] text-[#94A3B8] hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <span>USD</span>
                    <span className="text-[11px] opacity-70">US Dollar</span>
                  </button>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-[#0B1120] p-4">
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">Custom TZS per USD Exchange Rate</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#C9A96E]"
                      value={preferences.fxRateOverride || 2600}
                      onChange={(e) => updatePreference("fxRateOverride", Number(e.target.value) || 2600)}
                      placeholder="2600"
                    />
                    <span className="text-[12px] text-slate-400 shrink-0">TZS / $1</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#94A3B8]">Applies customized exchange rate to USD executive summaries and conversions.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Time Zone Selection</label>
                <div className="rounded-xl border border-white/10 bg-[#0B1120] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={15} className="text-[#C9A96E]" />
                    <span className="text-[13px] font-semibold text-white">Dashboard Timezone</span>
                  </div>
                  <select
                    className="w-full rounded-lg border border-white/15 bg-[#131C31] px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#C9A96E]"
                    value={preferences.timezone || "Africa/Dar_es_Salaam"}
                    onChange={(e) => updatePreference("timezone", e.target.value)}
                  >
                    <option value="Africa/Dar_es_Salaam">East Africa Time (EAT — Dar es Salaam, Nairobi)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="Africa/Johannesburg">South Africa Standard Time (SAST)</option>
                    <option value="Europe/London">Greenwich Mean Time (GMT / London)</option>
                    <option value="America/New_York">Eastern Time (ET — New York)</option>
                    <option value="Asia/Dubai">Gulf Standard Time (GST — Dubai)</option>
                  </select>
                  <p className="mt-2 text-[11px] text-[#94A3B8]">Adjusts timestamp displays across activities, audit logs, and reports.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">View Density</label>
                <div
                  onClick={() => updatePreference("compactDensity", !preferences.compactDensity)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#0B1120] p-4 transition-colors hover:border-[#C9A96E]/40"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-white">Compact Table Density</p>
                    <p className="text-[12px] text-[#94A3B8]">Reduce row padding in ERP data tables for higher data visibility</p>
                  </div>
                  <div className={`grid h-6 w-6 place-items-center rounded-md border ${preferences.compactDensity ? "bg-[#C9A96E] border-[#C9A96E] text-[#0B1120]" : "border-white/20 bg-transparent"}`}>
                    {preferences.compactDensity && <Check size={14} />}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Dashboard Modules & Widgets</label>
                <div className="space-y-2.5">
                  <div
                    onClick={() => updatePreference("showKpiBanner", !preferences.showKpiBanner)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#0B1120] p-4 transition-colors hover:border-[#C9A96E]/40"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-white">Executive Metrics Strip</p>
                      <p className="text-[12px] text-[#94A3B8]">Show key financial and operational KPI summary cards</p>
                    </div>
                    <div className={`grid h-6 w-6 place-items-center rounded-md border ${preferences.showKpiBanner ? "bg-[#C9A96E] border-[#C9A96E] text-[#0B1120]" : "border-white/20 bg-transparent"}`}>
                      {preferences.showKpiBanner && <Check size={14} />}
                    </div>
                  </div>

                  <div
                    onClick={() => updatePreference("showActivityTimeline", !preferences.showActivityTimeline)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#0B1120] p-4 transition-colors hover:border-[#C9A96E]/40"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-white">Activity Timeline</p>
                      <p className="text-[12px] text-[#94A3B8]">Show recent business activities and ledger entries</p>
                    </div>
                    <div className={`grid h-6 w-6 place-items-center rounded-md border ${preferences.showActivityTimeline ? "bg-[#C9A96E] border-[#C9A96E] text-[#0B1120]" : "border-white/20 bg-transparent"}`}>
                      {preferences.showActivityTimeline && <Check size={14} />}
                    </div>
                  </div>

                  <div
                    onClick={() => updatePreference("showPendingApprovals", !preferences.showPendingApprovals)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#0B1120] p-4 transition-colors hover:border-[#C9A96E]/40"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-white">Quick Actions & Approvals</p>
                      <p className="text-[12px] text-[#94A3B8]">Show pending operational approvals and shortcuts</p>
                    </div>
                    <div className={`grid h-6 w-6 place-items-center rounded-md border ${preferences.showPendingApprovals ? "bg-[#C9A96E] border-[#C9A96E] text-[#0B1120]" : "border-white/20 bg-transparent"}`}>
                      {preferences.showPendingApprovals && <Check size={14} />}
                    </div>
                  </div>
                </div>
              </div>
              <DashboardLayoutControls preferences={preferences} updatePreference={updatePreference} />
              {canManageTeamPresets && <TeamDashboardPresetManager preferences={preferences} />}
              <div className="space-y-3">
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Workspace Navigation &amp; Command Bar</label>
                <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B1120] p-4">
                  <div>
                    <p className="text-[13px] font-semibold text-white">Navigation presentation</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">This changes only your personal menu layout. Role, company, and subscription checks still control what opens.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Sidebar presentation">
                      {[{ id: "expanded", label: "Expanded" }, { id: "compact", label: "Compact" }].map((mode) => <button key={mode.id} type="button" aria-pressed={preferences.sidebarPresentation === mode.id} onClick={() => updatePreference("sidebarPresentation", mode.id as DashboardPreferences["sidebarPresentation"])} className={`min-h-10 rounded-lg border px-2 text-[11px] font-bold transition ${preferences.sidebarPresentation === mode.id ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]" : "border-white/10 text-[#94A3B8] hover:border-white/25 hover:text-white"}`}>{mode.label}</button>)}
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[13px] font-semibold text-white">Menu order</p>
                    <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Sidebar sort order">
                      {[{ id: "priority", label: "Role priority" }, { id: "alphabetical", label: "A–Z" }].map((order) => <button key={order.id} type="button" aria-pressed={preferences.navigationSort === order.id} onClick={() => updatePreference("navigationSort", order.id as DashboardPreferences["navigationSort"])} className={`min-h-10 rounded-lg border px-2 text-[11px] font-bold transition ${preferences.navigationSort === order.id ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]" : "border-white/10 text-[#94A3B8] hover:border-white/25 hover:text-white"}`}>{order.label}</button>)}
                    </div>
                  </div>
                  {availableNavigationGroups.length > 0 && <div className="border-t border-white/10 pt-3">
                    <p className="text-[13px] font-semibold text-white">Visible menu groups</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">Only groups already authorized for this role are listed. Home remains available as a safe return point.</p>
                    <div className="mt-3 space-y-2">
                      {availableNavigationGroups.map((group) => {
                        const groupId = group.id as DashboardPreferences["visibleNavigationGroupIds"][number];
                        const visible = preferences.visibleNavigationGroupIds.includes(groupId);
                        const isHome = groupId === "home";
                        return <button key={group.id} type="button" aria-pressed={visible} disabled={isHome} onClick={() => toggleNavigationGroup(groupId)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left transition disabled:cursor-not-allowed disabled:opacity-75 ${visible ? "border-[#C9A96E]/45 bg-[#C9A96E]/10 text-white" : "border-white/10 text-[#94A3B8] hover:border-white/25 hover:text-white"}`}><span className="min-w-0"><span className="block truncate text-[11.5px] font-semibold">{group.label}</span><span className="mt-0.5 block text-[9.5px] text-[#94A3B8]">{isHome ? "Always available" : `${group.itemCount || 0} permitted workspace${group.itemCount === 1 ? "" : "s"}`}</span></span><span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${visible ? "border-[#C9A96E] bg-[#C9A96E] text-[#0B1120]" : "border-white/20"}`}>{visible && <Check size={13} />}</span></button>;
                      })}
                    </div>
                  </div>}
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[13px] font-semibold text-white">Top-bar controls</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">Choose optional context controls. Required account, notification, and security controls remain available.</p>
                    <div className="mt-3 space-y-2">
                      {topBarControls.map((control) => {
                        const enabled = preferences[control.key];
                        const Icon = control.icon;
                        return <button key={control.key} type="button" aria-pressed={enabled} onClick={() => updatePreference(control.key, !enabled)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left transition ${enabled ? "border-[#C9A96E]/45 bg-[#C9A96E]/10 text-white" : "border-white/10 text-[#94A3B8] hover:border-white/25 hover:text-white"}`}><span className="flex min-w-0 items-center gap-2.5"><Icon size={14} className={enabled ? "text-[#C9A96E]" : "text-[#94A3B8]"} /><span className="min-w-0"><span className="block truncate text-[11.5px] font-semibold">{control.label}</span><span className="mt-0.5 block truncate text-[9.5px] text-[#94A3B8]">{control.detail}</span></span></span><span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${enabled ? "border-[#C9A96E] bg-[#C9A96E] text-[#0B1120]" : "border-white/20"}`}>{enabled && <Check size={13} />}</span></button>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-[#C9A96E]/30 bg-gradient-to-br from-[#C9A96E]/10 to-transparent p-5">
                <div className="flex items-center gap-2 text-[#C9A96E] mb-2">
                  <Sparkles size={16} />
                  <h4 className="text-[14px] font-bold">AI Configuration Assistant</h4>
                </div>
                <p className="text-[13px] text-[#94A3B8] leading-relaxed">
                  Describe what you want to achieve (e.g. &ldquo;Set up USD currency with custom 2550 rate and EAT timezone&rdquo;) and our AI will configure your dashboard instantly.
                </p>
              </div>

              <form onSubmit={handleAiSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[#C9A96E] mb-2">Your Setup Goal</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-white/15 bg-[#0B1120] p-3.5 text-[13px] text-white placeholder:text-slate-500 focus:border-[#C9A96E] focus:outline-none"
                    placeholder="e.g. Set up compact view with USD currency and EAT timezone..."
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={aiLoading || !aiGoal.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A96E] px-5 py-3.5 text-[13px] font-bold text-[#0B1120] shadow-lg transition-all hover:bg-[#D4B87F] disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  <span>Generate Recommended Setup</span>
                </button>
              </form>

              {aiResult && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                  <p className="text-[13px] font-semibold text-emerald-400">{aiResult.explanation}</p>
                  <div className="text-[12px] text-[#94A3B8] space-y-1">
                    <p>• Currency: <strong className="text-white">{aiResult.preferences.currency}</strong></p>
                    <p>• Density: <strong className="text-white">{aiResult.preferences.compactDensity ? "Compact" : "Comfortable"}</strong></p>
                    <p>• Metrics Strip: <strong className="text-white">{aiResult.preferences.showKpiBanner ? "Visible" : "Hidden"}</strong></p>
                  </div>
                  <button
                    type="button"
                    onClick={applyAiResult}
                    className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 text-[12.5px] transition-colors"
                  >
                    Apply AI Recommendation
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Suggested Prompts</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Switch to USD currency and compact view",
                    "Configure EAT timezone and full metrics",
                    "Clean executive dashboard with comfortable density",
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiGoal(prompt)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-[11.5px] text-[#94A3B8] hover:border-white/25 hover:text-white transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Share layout</p>
              <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">Export a portable setup for teammates. Import never grants access to restricted modules.</p>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" aria-label="Import dashboard layout file" />
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={handleExport} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-bold text-[#C9A96E] hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/10" aria-label="Export dashboard layout">
                <Download size={14} /> Export
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-bold text-white hover:border-white/30" aria-label="Import dashboard layout">
                <Upload size={14} /> Import
              </button>
            </div>
          </div>
          {transferMessage && <div role="status" className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] leading-4 ${transferMessage.type === "error" ? "border-red-400/30 bg-red-950/20 text-red-200" : "border-emerald-400/30 bg-emerald-950/20 text-emerald-200"}`}>
            {transferMessage.type === "error" && <AlertCircle size={14} className="mt-0.5 shrink-0" />}
            <span>{transferMessage.text}</span>
          </div>}
          {persistenceError && <p role="alert" className="text-[11px] leading-4 text-red-200">{persistenceError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetPreferences}
            disabled={isPersisting}
            className="inline-flex min-h-9 items-center gap-1.5 text-[12px] font-medium text-[#94A3B8] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <RotateCcw size={13} /> Reset Built-in Defaults
          </button>
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            disabled={isPersisting}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#C9A96E]/30 px-2.5 text-[11px] font-bold text-[#C9A96E] hover:border-[#C9A96E]/60 hover:bg-[#C9A96E]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={13} /> Reset to Team Default
          </button>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 hover:bg-white/15 px-5 py-2.5 text-[12.5px] font-bold text-white transition-colors"
          >
            Done
          </button>
          </div>
          {resetConfirmOpen && <div role="dialog" aria-modal="true" aria-labelledby="reset-team-default-title" className="rounded-xl border border-[#C9A96E]/30 bg-[#131C31] p-3">
            <p id="reset-team-default-title" className="text-[12px] font-bold text-white">Restore the administrator default?</p>
            <p className="mt-1 text-[11px] leading-4 text-[#94A3B8]">Your personal dashboard override will be removed. The active role or department preset will be restored; access permissions will not change.</p>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setResetConfirmOpen(false)} className="min-h-9 rounded-lg border border-white/10 px-3 text-[11px] font-bold text-[#94A3B8]">Cancel</button>
              <button type="button" disabled={isPersisting} onClick={() => { setResetConfirmOpen(false); setTransferMessage({ type: "success", text: "Restoring the active administrator default…" }); resetToTeamDefault(); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#C9A96E] px-3 text-[11px] font-bold text-[#0B1120] disabled:opacity-50">{isPersisting && <Loader2 size={13} className="animate-spin" />} Restore default</button>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
