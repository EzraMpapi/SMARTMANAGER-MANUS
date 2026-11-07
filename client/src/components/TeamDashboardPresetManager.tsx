import React, { useMemo, useState } from "react";
import { Check, Loader2, Plus, Trash2, UsersRound } from "lucide-react";
import { trpc } from "../lib/trpc";
import type { DashboardPreferences } from "../contexts/DashboardPreferencesContext";

const roleOptions = ["Organization Owner", "CEO", "CFO", "COO", "HR Manager", "Sales Manager", "Finance Manager", "Employee"];

interface TeamDashboardPresetManagerProps {
  preferences: DashboardPreferences;
}

export function TeamDashboardPresetManager({ preferences }: TeamDashboardPresetManagerProps) {
  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState<"role" | "department">("role");
  const [targetValue, setTargetValue] = useState(roleOptions[0]);
  const [notice, setNotice] = useState<string | null>(null);
  const presetsQuery = trpc.dashboardTeamPresets.list.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const createMutation = trpc.dashboardTeamPresets.create.useMutation({
    onSuccess: () => {
      setName("");
      setNotice("Preset saved. Activate it below when it is ready for the selected team.");
      void utils.dashboardTeamPresets.list.invalidate();
    },
    onError: (error) => setNotice(error.message),
  });
  const activateMutation = trpc.dashboardTeamPresets.activate.useMutation({
    onSuccess: () => {
      setNotice("Preset activated. Matching users will receive it as their default on their next dashboard load.");
      void utils.dashboardTeamPresets.list.invalidate();
      void utils.dashboardPreferences.get.invalidate();
    },
    onError: (error) => setNotice(error.message),
  });
  const deleteMutation = trpc.dashboardTeamPresets.delete.useMutation({
    onSuccess: () => {
      setNotice("Preset deleted.");
      void utils.dashboardTeamPresets.list.invalidate();
    },
    onError: (error) => setNotice(error.message),
  });
  const presets = useMemo(() => (presetsQuery.data || []) as Array<Record<string, unknown>>, [presetsQuery.data]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !targetValue.trim() || createMutation.isPending) return;
    createMutation.mutate({ name: name.trim(), targetType, targetValue: targetValue.trim(), preferences });
  };

  return (
    <section className="mt-4 rounded-xl border border-[#C9A96E]/30 bg-[#0B1120] p-4" aria-labelledby="team-dashboard-presets-title">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#C9A96E]/10 text-[#C9A96E]"><UsersRound size={16} /></span>
        <div>
          <h4 id="team-dashboard-presets-title" className="text-[13px] font-bold text-white">Team dashboard presets</h4>
          <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">Define a presentation default for a role or HR department. Existing personal layouts remain in control until changed.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-4 space-y-2.5">
        <label className="block text-[11px] font-semibold text-slate-300" htmlFor="team-preset-name">Preset name</label>
        <input id="team-preset-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12px] text-white outline-none focus:border-[#C9A96E]" placeholder="Finance lead workspace" />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="block text-[11px] font-semibold text-slate-300" htmlFor="team-preset-target-type">Target</label><select id="team-preset-target-type" value={targetType} onChange={(event) => { const next = event.target.value as "role" | "department"; setTargetType(next); setTargetValue(next === "role" ? roleOptions[0] : ""); }} className="mt-1 w-full rounded-lg border border-white/15 bg-[#131C31] px-2.5 py-2 text-[11px] text-white outline-none focus:border-[#C9A96E]"><option value="role">Role</option><option value="department">Department ID</option></select></div>
          <div><label className="block text-[11px] font-semibold text-slate-300" htmlFor="team-preset-target-value">Value</label>{targetType === "role" ? <select id="team-preset-target-value" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-[#131C31] px-2.5 py-2 text-[11px] text-white outline-none focus:border-[#C9A96E]">{roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}</select> : <input id="team-preset-target-value" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] text-white outline-none focus:border-[#C9A96E]" placeholder="HR department UUID" />}</div>
        </div>
        <button type="submit" disabled={!name.trim() || !targetValue.trim() || createMutation.isPending} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A96E] px-3 text-[11.5px] font-bold text-[#0B1120] disabled:cursor-not-allowed disabled:opacity-50">{createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save preset from current layout</button>
      </form>
      {notice && <p role="status" className="mt-3 text-[11px] leading-4 text-emerald-300">{notice}</p>}
      <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Saved presets</p>
        {presetsQuery.isLoading && <p className="text-[11px] text-[#94A3B8]">Loading presets…</p>}
        {!presetsQuery.isLoading && !presets.length && <p className="text-[11px] text-[#94A3B8]">No team presets yet.</p>}
        {presets.map((preset) => <div key={String(preset.id)} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-[11.5px] font-semibold text-white">{String(preset.name)}</p><p className="mt-0.5 text-[10px] text-[#94A3B8]">{String(preset.target_type)} · {String(preset.target_value)}{preset.is_active === true ? " · Active" : ""}</p></div><div className="flex shrink-0 gap-1.5"><button type="button" disabled={preset.is_active === true || activateMutation.isPending} onClick={() => activateMutation.mutate({ id: String(preset.id) })} className="inline-flex min-h-8 items-center gap-1 rounded-md border border-emerald-400/30 px-2 text-[10px] font-bold text-emerald-300 disabled:opacity-50" aria-label={`Activate ${String(preset.name)}`}><Check size={12} />{preset.is_active === true ? "Active" : "Push"}</button><button type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate({ id: String(preset.id) })} className="grid min-h-8 min-w-8 place-items-center rounded-md border border-red-400/25 text-red-300 disabled:opacity-50" aria-label={`Delete ${String(preset.name)}`}><Trash2 size={12} /></button></div></div>)}
      </div>
    </section>
  );
}
