import React from "react";
import { Sliders, X, Check, RotateCcw, DollarSign } from "lucide-react";
import { useDashboardPreferences } from "../contexts/DashboardPreferencesContext";

interface DashboardPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardPreferencesDrawer({ isOpen, onClose }: DashboardPreferencesDrawerProps) {
  const { preferences, updatePreference, resetPreferences } = useDashboardPreferences();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#131C31] border-l border-white/10 p-6 text-white shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C9A96E]/10 text-[#C9A96E]">
                <Sliders size={18} />
              </span>
              <div>
                <h3 className="text-[16px] font-bold font-heading">Dashboard Preferences</h3>
                <p className="text-[12px] text-[#94A3B8]">Customize your layout and view density</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

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
