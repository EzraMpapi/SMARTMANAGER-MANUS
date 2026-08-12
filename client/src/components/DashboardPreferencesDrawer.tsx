import React, { useState } from "react";
import { Sliders, X, Check, RotateCcw, DollarSign, Sparkles, Send, Loader2 } from "lucide-react";
import { useDashboardPreferences } from "../contexts/DashboardPreferencesContext";
import { trpc } from "../lib/trpc";

interface DashboardPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardPreferencesDrawer({ isOpen, onClose }: DashboardPreferencesDrawerProps) {
  const { preferences, updatePreference, resetPreferences } = useDashboardPreferences();
  const [activeTab, setActiveTab] = useState<"settings" | "ai">("settings");
  const [aiGoal, setAiGoal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ preferences: typeof preferences; explanation: string } | null>(null);

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
                <p className="text-[12px] text-[#94A3B8]">Customize layout, density & AI assistant</p>
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
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Executive Currency</label>
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
                    <span className="text-[11px] opacity-70">US Dollar ($2.6k)</span>
                  </button>
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
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#C9A96E]">Widget Visibility</label>
                
                <div
                  onClick={() => updatePreference("showKpiBanner", !preferences.showKpiBanner)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#0B1120] p-4 transition-colors hover:border-[#C9A96E]/40"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-white">Executive KPI Banner</p>
                    <p className="text-[12px] text-[#94A3B8]">Show top-level financial and operational summary cards</p>
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
                    <p className="text-[12px] text-[#94A3B8]">Display recent audit and operational events feed</p>
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
                    <p className="text-[14px] font-semibold text-white">Pending Approvals Widget</p>
                    <p className="text-[12px] text-[#94A3B8]">Highlight items requiring management decision</p>
                  </div>
                  <div className={`grid h-6 w-6 place-items-center rounded-md border ${preferences.showPendingApprovals ? "bg-[#C9A96E] border-[#C9A96E] text-[#0B1120]" : "border-white/20 bg-transparent"}`}>
                    {preferences.showPendingApprovals && <Check size={14} />}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-[#C9A96E]/30 bg-[#0B1120] p-4">
                <div className="flex items-center gap-2.5 mb-2 text-[#C9A96E]">
                  <Sparkles size={16} />
                  <h4 className="text-[14px] font-bold">Natural Language Setup</h4>
                </div>
                <p className="text-[12px] text-[#94A3B8] leading-relaxed">
                  Describe how you want your command center configured (e.g., <span className="text-white italic">"Switch to US Dollar currency and compact table view for dense inventory audits"</span>). The AI assistant will analyze your request and propose layout parameters instantly.
                </p>
              </div>

              <form onSubmit={handleAiSubmit} className="space-y-3">
                <textarea
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  placeholder="Type your configuration goal..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-[#0B1120] p-3 text-[13px] text-white placeholder:text-[#94A3B8] outline-none focus:border-[#C9A96E]"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiGoal.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C9A96E] py-3 text-[13px] font-bold text-[#0B1120] hover:bg-[#D4B87F] disabled:opacity-50 transition-all"
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  {aiLoading ? "Analyzing Goal..." : "Generate Configuration"}
                </button>
              </form>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Suggested Assistant Prompts</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Switch to US Dollar and compact view",
                    "Compact focus mode without activity feed",
                    "Default Tanzanian Shilling executive layout",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setAiGoal(prompt)}
                      className="rounded-lg border border-white/10 bg-[#0B1120] px-3 py-1.5 text-[11.5px] text-[#94A3B8] hover:border-[#C9A96E]/50 hover:text-white transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {aiResult && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-[13px]">
                    <Check size={16} /> Recommended Configuration Ready
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">{aiResult.explanation}</p>
                  <div className="grid grid-cols-2 gap-2 text-[11.5px] text-[#94A3B8] bg-[#0B1120] p-2.5 rounded-lg border border-white/10">
                    <div>Currency: <strong className="text-white">{aiResult.preferences.currency}</strong></div>
                    <div>Density: <strong className="text-white">{aiResult.preferences.compactDensity ? "Compact" : "Comfortable"}</strong></div>
                    <div>KPI Banner: <strong className="text-white">{aiResult.preferences.showKpiBanner ? "Shown" : "Hidden"}</strong></div>
                    <div>Timeline: <strong className="text-white">{aiResult.preferences.showActivityTimeline ? "Shown" : "Hidden"}</strong></div>
                  </div>
                  <button
                    type="button"
                    onClick={applyAiResult}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-[12.5px] font-bold text-white hover:bg-emerald-500 transition-colors"
                  >
                    Apply AI Recommendations
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <button
            onClick={resetPreferences}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#94A3B8] hover:text-white"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#C9A96E] px-5 py-2.5 text-[13px] font-bold text-[#0B1120] hover:bg-[#D4B87F]"
          >
            Apply Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
