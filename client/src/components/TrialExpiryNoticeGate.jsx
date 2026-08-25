import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, LoaderCircle, ShieldCheck } from "lucide-react";

function messageFrom(response, body, fallback) {
  if (response.ok) return "";
  return typeof body?.error === "string" && body.error.trim() ? body.error.trim() : fallback;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Mounted once above the module router. The database claim is the source of
 * truth; this component deliberately has no localStorage/sessionStorage gate.
 */
export function TrialExpiryNoticeGate({ session, onChoosePlan }) {
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const acknowledgedRef = useRef(false);
  const acknowledgingRef = useRef(false);
  const requestKeyRef = useRef("");

  const acknowledgeNotice = useCallback(async () => {
    if (!notice?.claimToken || !session?.accessToken || acknowledgedRef.current || acknowledgingRef.current) return false;
    acknowledgingRef.current = true;
    setAcknowledging(true);
    setError("");
    try {
      const response = await fetch("/api/billing/trial-expiry-notice/ack", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-supabase-authorization": `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ claimToken: notice.claimToken }),
      });
      const body = await response.json().catch(() => ({}));
      const failure = messageFrom(response, body, "The trial notice could not be saved.");
      if (failure) throw new Error(failure);
      if (!body?.acknowledged) throw new Error("The server did not record the trial notice.");
      acknowledgedRef.current = true;
      setAcknowledged(true);
      return true;
    } catch (nextError) {
      setError(nextError.message || "The trial notice could not be saved.");
      return false;
    } finally {
      acknowledgingRef.current = false;
      setAcknowledging(false);
    }
  }, [notice?.claimToken, session?.accessToken]);

  useEffect(() => {
    const accessToken = session?.accessToken;
    const userId = session?.userId;
    if (!accessToken || session?.demo || !userId) {
      setNotice(null);
      setError("");
      setAcknowledged(false);
      acknowledgedRef.current = false;
      acknowledgingRef.current = false;
      requestKeyRef.current = "";
      return undefined;
    }

    const requestKey = `${userId}:${accessToken.slice(0, 18)}`;
    if (requestKeyRef.current === requestKey) return undefined;
    requestKeyRef.current = requestKey;
    let cancelled = false;

    const claim = async () => {
      try {
        const response = await fetch("/api/billing/trial-expiry-notice/claim", {
          headers: { "x-supabase-authorization": `Bearer ${accessToken}` },
        });
        const body = await response.json().catch(() => ({}));
        const failure = messageFrom(response, body, "Trial status could not be checked.");
        if (failure) throw new Error(failure);
        if (!cancelled && body?.show && body?.claimToken) {
          setNotice(body);
          setAcknowledged(false);
          acknowledgedRef.current = false;
          acknowledgingRef.current = false;
          setError("");
        }
      } catch (nextError) {
        if (!cancelled) setError(nextError.message || "Trial status could not be checked.");
      }
    };

    claim();
    return () => { cancelled = true; };
  }, [session?.accessToken, session?.demo, session?.userId]);

  useEffect(() => {
    if (!notice?.show || !notice.claimToken || acknowledgedRef.current || !session?.accessToken) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!cancelled) await acknowledgeNotice();
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [acknowledgeNotice, notice?.claimToken, notice?.show, session?.accessToken]);

  if (!notice?.show) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="trial-expiry-title">
      <div className="w-full max-w-xl overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="bg-[#15191F] px-6 py-7 text-white sm:px-8">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#D4AF37]"><Clock3 size={14} /> Subscription status</div>
          <h2 id="trial-expiry-title" className="mt-3 text-[25px] font-bold tracking-[-.045em] sm:text-[30px]">Your free trial has ended</h2>
          <p className="mt-2 max-w-lg text-[13px] leading-6 text-slate-300">Choose a plan to continue using premium Smart Manager features. Your workspace data remains preserved and no automatic payment has been taken.</p>
        </div>
        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">Trial started</p><p className="mt-2 text-[13px] font-semibold text-slate-900">{formatDate(notice.trialStartedAt)}</p></div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-rose-500">Trial ended</p><p className="mt-2 text-[13px] font-semibold text-rose-900">{formatDate(notice.trialEndsAt)}</p></div>
          </div>
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-[11.5px] leading-5 text-emerald-900"><ShieldCheck size={16} className="mt-0.5 shrink-0" />This notice is tied to your authenticated account and is recorded once on the server. It will not return after logout, refresh, or another device.</div>
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-800">{error}</div>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {error && !acknowledged && <button type="button" disabled={acknowledging} onClick={acknowledgeNotice} className="rounded-xl border border-slate-200 px-4 py-2.5 text-[12px] font-bold text-slate-700 disabled:opacity-50">Retry recording</button>}
            <button type="button" disabled={acknowledging || !acknowledged} onClick={onChoosePlan} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#15191F] px-5 py-2.5 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><ArrowUpRight size={15} /> Choose a plan</button>
          </div>
          {acknowledging && <p className="inline-flex items-center gap-2 text-[11px] text-slate-500"><LoaderCircle className="animate-spin" size={13} /> Recording this account notice…</p>}
          {acknowledged && <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-emerald-700"><CheckCircle2 size={13} /> Notice recorded for this account.</p>}
        </div>
      </div>
    </div>
  );
}
