import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Info, RefreshCw, Smartphone } from "lucide-react";

export const SMART_MANAGER_APP_VERSION = import.meta.env.VITE_APP_VERSION || "2.0.0";
export const SMART_MANAGER_ANDROID_PACKAGE = "tz.smartmanager.erp";
export const SMART_MANAGER_PRODUCTION_ORIGIN = "https://bserp-dashbo-xgm6fauw.manus.space";
const REMOTE_TWA_MANIFEST = "https://raw.githubusercontent.com/EzraMpapi/SMARTMANAGER-MANUS/main/android/twa-manifest.json";

function versionParts(version) {
  return String(version || "0")
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0)
    .slice(0, 3);
}

function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
}

export function AndroidAppStatus() {
  const [status, setStatus] = useState("idle");
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);
  const [error, setError] = useState("");

  const checkForUpdate = useCallback(async () => {
    setStatus("checking");
    setError("");
    try {
      const response = await fetch(`${REMOTE_TWA_MANIFEST}?check=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Update metadata returned HTTP ${response.status}.`);
      const manifest = await response.json();
      const nextVersion = manifest.appVersion || manifest.versionName || manifest.version;
      if (!nextVersion) throw new Error("Published Android metadata did not include a version.");
      setRemoteVersion(String(nextVersion));
      setCheckedAt(new Date());
      setStatus("ready");
    } catch (checkError) {
      setStatus("error");
      setError(checkError?.message || "The update check could not be completed.");
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  const updateState = useMemo(() => {
    if (!remoteVersion) return "unknown";
    const comparison = compareVersions(remoteVersion, SMART_MANAGER_APP_VERSION);
    if (comparison > 0) return "available";
    if (comparison === 0) return "current";
    return "local-ahead";
  }, [remoteVersion]);

  const statusLabel = status === "checking"
    ? "Checking published build…"
    : status === "error"
      ? "Update check unavailable"
      : updateState === "available"
        ? `Version ${remoteVersion} is available`
        : updateState === "current"
          ? "You are using the current published version"
          : updateState === "local-ahead"
            ? "This build is ahead of the published metadata"
            : "Not checked yet";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="android-app-status-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Smartphone size={18} /></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">About SMART MANAGER</p>
            <h3 id="android-app-status-title" className="mt-1 text-sm font-bold text-slate-900">Android app and release status</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">The Android app is a secure Trusted Web Activity over the same production web application, authentication, tenant boundary, and Supabase APIs.</p>
          </div>
        </div>
        <button type="button" onClick={checkForUpdate} disabled={status === "checking"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60">
          <RefreshCw size={13} className={status === "checking" ? "animate-spin" : ""} /> Check for updates
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Current version</p><p className="mt-1 font-mono text-sm font-bold text-slate-900">v{SMART_MANAGER_APP_VERSION}</p></div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Package ID</p><p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-900">{SMART_MANAGER_ANDROID_PACKAGE}</p></div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Release channel</p><p className="mt-1 text-sm font-bold capitalize text-slate-900">{import.meta.env.MODE}</p></div>
      </div>

      <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-xs ${status === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : updateState === "available" ? "border-blue-200 bg-blue-50 text-blue-900" : "border-emerald-100 bg-emerald-50 text-emerald-900"}`} role="status" aria-live="polite">
        {status === "error" ? <Info size={15} className="mt-0.5 shrink-0" /> : updateState === "available" ? <Info size={15} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={15} className="mt-0.5 shrink-0" />}
        <div><p className="font-semibold">{statusLabel}</p>{error && <p className="mt-1 leading-5 opacity-80">{error}</p>}{checkedAt && !error && <p className="mt-1 opacity-70">Last checked {checkedAt.toLocaleString("en-TZ", { dateStyle: "medium", timeStyle: "short" })}.</p>}</div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
        <a href={SMART_MANAGER_PRODUCTION_ORIGIN} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"><ExternalLink size={12} /> Open production app</a>
        <a href="https://github.com/EzraMpapi/SMARTMANAGER-MANUS/releases" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"><ExternalLink size={12} /> Release notes</a>
      </div>
    </section>
  );
}
