import { AlertTriangle, ArrowUpRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function localDateKey(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-TZ", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function countdown(endsAt, now) {
  if (!endsAt) return { expired: false, days: null, hours: null };
  const end = new Date(endsAt).getTime();
  const remainingMs = end - now;
  if (!Number.isFinite(end) || remainingMs <= 0) return { expired: true, days: 0, hours: 0 };
  return {
    expired: false,
    days: Math.max(1, Math.ceil(remainingMs / DAY_MS)),
    hours: Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000))),
  };
}

export function FreeTrialBanner({ access, onUpgrade, compact = false }) {
  const [now, setNow] = useState(() => Date.now());
  const trialEndsAt = access?.trialEndsAt || access?.subscription?.trial_ends_at || access?.accessUntil;
  const trialStartedAt = access?.trialStartedAt || access?.subscription?.trial_started_at;
  const isFreeTrial = access?.subscription?.offerCode === "FREE_15" || access?.subscription?.offer_code === "FREE_15";
  const state = String(access?.state || access?.status || "").toLowerCase();
  const active = Boolean(isFreeTrial && access?.trialActive === true && access?.allowed === true && ["trial", "active"].includes(state));
  const time = useMemo(() => countdown(trialEndsAt, now), [trialEndsAt, now]);
  const expired = Boolean(isFreeTrial && (!active || time.expired) && ["required", "expired"].includes(state));

  useEffect(() => {
    if (!trialEndsAt || (!active && !expired)) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, [active, expired, trialEndsAt]);

  if (!active && !expired) return null;

  const endsToday = time.days === 1 && localDateKey(trialEndsAt) === localDateKey(now);
  const endsTomorrow = time.days === 1 && !endsToday;
  const warning = active && time.days !== null && time.days <= 7;
  const urgent = active && time.days !== null && time.days <= 3;
  const title = expired
    ? "Your free trial has ended"
    : time.days === null
      ? "Your free trial is active"
      : time.days > 7
        ? "Your free trial is active"
        : endsToday
          ? "Your trial ends today"
          : endsTomorrow
            ? "Your trial ends tomorrow"
            : urgent
              ? "Your trial ends soon"
              : `Your trial ends in ${time.days} days`;
  const message = expired
    ? "Choose a subscription plan to continue accessing premium features. Your workspace data remains preserved."
    : time.days === null
      ? "Enjoy unlimited access to all SMART MANAGER modules and features during your confirmed trial."
      : time.days > 7
        ? `You have ${time.days} days remaining in your SMART MANAGER trial. Enjoy unlimited access to all modules and features.`
        : `You have ${time.days} day${time.days === 1 ? "" : "s"} remaining. Upgrade now to continue uninterrupted access after the trial.`;
  const border = expired ? "border-rose-200" : urgent ? "border-amber-300" : warning ? "border-amber-200" : "border-emerald-200";
  const background = expired ? "bg-rose-50" : urgent ? "bg-amber-50" : warning ? "bg-amber-50/70" : "bg-emerald-50";
  const accent = expired ? "text-rose-700" : urgent ? "text-amber-800" : warning ? "text-amber-800" : "text-emerald-800";
  const Icon = expired ? AlertTriangle : urgent ? AlertTriangle : Sparkles;

  return (
    <section className={`w-full ${compact ? "px-3 py-2" : "px-4 py-3 sm:px-6"}`} aria-live="polite" data-testid="free-trial-banner">
      <div className={`mx-auto flex max-w-[1600px] flex-col gap-3 rounded-2xl border ${border} ${background} px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/80 ${accent}`} aria-hidden="true"><Icon size={17} /></span>
          <div className="min-w-0">
            <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-[.14em] ${accent}`}>
              {!expired && <><ShieldCheck size={12} /> FREE TRIAL ACTIVE</>}
              {expired && <><AlertTriangle size={12} /> FREE TRIAL ENDED</>}
            </div>
            <h2 className="mt-0.5 text-[14px] font-bold tracking-[-.02em] text-slate-950">{title}</h2>
            <p className="mt-0.5 max-w-3xl text-[12px] leading-5 text-slate-700">{message}</p>
            <p className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-semibold ${accent}`}>
              <span className="inline-flex items-center gap-1"><Clock3 size={12} />{expired ? "Ended" : `Ends ${formatDate(trialEndsAt)}`}</span>
              {trialStartedAt && <span className="text-slate-500">Started {formatDate(trialStartedAt)}</span>}
            </p>
          </div>
        </div>
        <button type="button" onClick={onUpgrade} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[11.5px] font-bold text-white ${expired ? "bg-rose-700 hover:bg-rose-800" : urgent ? "bg-amber-800 hover:bg-amber-900" : "bg-[#0B5D3B] hover:bg-[#084B30]"}`}>
          {expired ? "View Plans" : "Upgrade Plan"} <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}
