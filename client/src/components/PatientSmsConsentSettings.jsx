import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, BellRing, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { trpc } from "../lib/trpc";

const OPTIONS = [
  { value: "Granted", title: "Allow appointment SMS", copy: "Let the clinic consider appointment reminders when its delivery service is active.", tone: "emerald" },
  { value: "Declined", title: "Do not send appointment SMS", copy: "Keep appointment SMS reminders off. You can change this choice later.", tone: "slate" },
  { value: "Revoked", title: "Revoke consent", copy: "Immediately withdraw your previous SMS reminder consent.", tone: "rose" },
];

function formatDate(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : "Not recorded";
}

export default function PatientSmsConsentSettings() {
  const utils = trpc.useUtils();
  const preferenceQuery = trpc.healthcare.patientSmsConsent.useQuery();
  const [preference, setPreference] = useState("Not recorded");
  const [method, setMethod] = useState("Verified digital confirmation");
  const [revokeAcknowledged, setRevokeAcknowledged] = useState(false);
  const mutation = trpc.healthcare.updatePatientSmsConsent.useMutation({
    onSuccess: (next) => {
      utils.healthcare.patientSmsConsent.setData(undefined, next);
      setPreference(next.preference);
      setRevokeAcknowledged(false);
    },
  });

  useEffect(() => {
    if (preferenceQuery.data?.preference) setPreference(preferenceQuery.data.preference);
    if (preferenceQuery.data?.method) setMethod(preferenceQuery.data.method);
  }, [preferenceQuery.data?.method, preferenceQuery.data?.preference]);

  const details = preferenceQuery.data;
  const isRevocation = preference === "Revoked";
  const save = () => mutation.mutate({ preference, method });

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <a href="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"><ArrowLeft size={16}/> Return to portal</a>
      <section className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/40">
        <header className="border-b border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 px-6 py-7 sm:px-8">
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20"><BellRing size={22}/></span><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-emerald-300">Patient preferences</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Appointment SMS preferences</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Choose whether your clinic may consider you for appointment SMS reminders. This page never displays your clinical information, phone number, or message content.</p></div></div>
        </header>
        {preferenceQuery.isLoading && <div className="grid min-h-64 place-items-center p-8" role="status"><div className="flex items-center gap-3 text-sm text-slate-300"><LoaderCircle size={18} className="animate-spin text-emerald-300"/>Loading your protected preference…</div></div>}
        {preferenceQuery.isError && <div className="p-6 sm:p-8"><div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5"><div className="flex gap-3"><AlertCircle className="mt-0.5 shrink-0 text-amber-300" size={18}/><div><h2 className="font-bold text-amber-100">Preference page unavailable</h2><p className="mt-1 text-sm leading-6 text-amber-50/80">{preferenceQuery.error?.message || "Your patient portal link could not be verified."}</p><p className="mt-3 text-xs leading-5 text-amber-100/70">For privacy, this page stays closed until the clinic links your portal reference to exactly one active patient record.</p><button onClick={() => preferenceQuery.refetch()} className="mt-4 rounded-lg border border-amber-200/20 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-100/10">Try again</button></div></div></div></div>}
        {details && <div className="space-y-6 p-6 sm:p-8">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current preference</p><p className="mt-1 text-lg font-bold text-white">{details.preference}</p><p className="mt-1 text-xs text-slate-400">Last recorded: {formatDate(details.preference === "Revoked" ? details.revokedAt : details.capturedAt)}</p></div><span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${details.eligibleWhenProviderEnabled ? "bg-emerald-400/15 text-emerald-200" : "bg-slate-700/70 text-slate-200"}`}><CheckCircle2 size={14}/>{details.eligibleWhenProviderEnabled ? "Eligible if reminders activate" : "Not eligible for SMS"}</span></div></div>
          <div><h2 className="text-base font-bold text-white">Update your preference</h2><p className="mt-1 text-sm text-slate-400">Your choice is saved immediately after confirmation and can be changed later.</p><div className="mt-4 grid gap-3">{OPTIONS.map((option) => <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 transition ${preference === option.value ? option.tone === "rose" ? "border-rose-300/70 bg-rose-400/10" : "border-emerald-300/60 bg-emerald-400/10" : "border-white/10 bg-white/[.025] hover:border-white/25"}`}><div className="flex gap-3"><input type="radio" name="sms-preference" value={option.value} checked={preference === option.value} onChange={() => setPreference(option.value)} className="mt-1 h-4 w-4 accent-emerald-400"/><span><span className="block text-sm font-bold text-white">{option.title}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{option.copy}</span></span></div></label>)}</div></div>
          {!isRevocation && <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">How you confirm this choice</span><select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"><option>Verified digital confirmation</option><option>In-person registration</option><option>Signed form</option><option>Recorded verbal confirmation</option></select></label>}
          {isRevocation && <label className="flex gap-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-50"><input type="checkbox" checked={revokeAcknowledged} onChange={(event) => setRevokeAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-400"/><span>I understand that this withdraws my SMS reminder consent. I can grant consent again later.</span></label>}
          <div className="rounded-2xl border border-sky-300/15 bg-sky-400/10 p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-sky-200" size={18}/><p className="text-sm leading-6 text-sky-50/90">{details.providerMessage}</p></div></div>
          {mutation.isError && <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" role="alert">{mutation.error?.message || "Your preference could not be saved. Please try again."}</p>}
          {mutation.isSuccess && <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" role="status">Your SMS preference has been updated.</p>}
          <button type="button" onClick={save} disabled={mutation.isPending || (isRevocation && !revokeAcknowledged)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck size={17}/>{mutation.isPending ? "Saving preference…" : isRevocation ? "Confirm SMS consent revocation" : "Save SMS preference"}</button>
        </div>}
      </section>
    </div>
  </main>;
}
